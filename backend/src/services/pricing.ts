export interface RideProviderDetails {
  name: string;
  type: 'Cab' | 'Bike' | 'Auto';
  distanceKm: number;
  etaMins: number;
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  surgeMultiplier: number;
  totalFare: number;
  recommendationScore: number;
  appDeepLink: string;
  webLink: string;
}

export interface ComparisonResult {
  distanceKm: number;
  durationMins: number;
  providers: RideProviderDetails[];
  recommendations: {
    cheapest: string;
    fastest: string;
    bestOverall: string;
  };
  insights: string[];
}

export function calculateFaresAndScores(distanceKm: number, durationMins: number, source: string, destination: string): ComparisonResult {
  // 1. Determine a base traffic factor (speed in km/h)
  const averageSpeed = distanceKm / (durationMins / 60);
  let trafficSurge = 1.0;
  
  // Severe traffic if average speed is under 15 km/h
  if (averageSpeed < 15) {
    trafficSurge = 1.35;
  } else if (averageSpeed < 25) {
    trafficSurge = 1.15;
  }

  // Define booking parameters and Deep-links
  const pickupAddr = encodeURIComponent(source);
  const dropoffAddr = encodeURIComponent(destination);

  const providersConfig = [
    {
      name: 'Uber',
      type: 'Cab' as const,
      baseFare: 55,
      perKmRate: 14.5,
      perMinRate: 2.5,
      etaMultiplier: 1.0, // Standard OSRM ETA
      surgeBase: trafficSurge,
      appDeepLink: `uber://?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`,
      webLink: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`
    },
    {
      name: 'Ola',
      type: 'Cab' as const,
      baseFare: 50,
      perKmRate: 15.0,
      perMinRate: 2.2,
      etaMultiplier: 1.1, // Extra 10% delay for driver allocation
      surgeBase: Math.max(1.0, trafficSurge - 0.05),
      appDeepLink: `olacabs://app/launch?pickup=my_location`,
      webLink: `https://www.olacabs.com/`
    },
    {
      name: 'Rapido',
      type: 'Bike' as const,
      baseFare: 20,
      perKmRate: 8.0,
      perMinRate: 1.2,
      etaMultiplier: 0.8, // 20% faster than cars in traffic
      surgeBase: Math.max(1.0, trafficSurge * 0.9),
      appDeepLink: `rapido://booking`,
      webLink: `https://www.rapido.bike/`
    }
  ];

  // Calculate detailed costs for each provider
  const providers: RideProviderDetails[] = providersConfig.map(cfg => {
    const providerDistance = distanceKm;
    const providerEta = Math.round(durationMins * cfg.etaMultiplier);
    
    const dFare = providerDistance * cfg.perKmRate;
    const tFare = providerEta * cfg.perMinRate;
    const surge = Number(cfg.surgeBase.toFixed(2));
    const rawTotal = (cfg.baseFare + dFare + tFare) * surge;
    const totalFare = Math.round(rawTotal);

    return {
      name: cfg.name,
      type: cfg.type,
      distanceKm: Number(providerDistance.toFixed(1)),
      etaMins: providerEta,
      baseFare: cfg.baseFare,
      distanceFare: Number(dFare.toFixed(2)),
      durationFare: Number(tFare.toFixed(2)),
      surgeMultiplier: surge,
      totalFare,
      recommendationScore: 0, // calculated below
      appDeepLink: cfg.appDeepLink,
      webLink: cfg.webLink
    };
  });

  // Calculate recommendation scores using weighted formula:
  // Score = (40% Fare Efficiency) + (40% Travel Time Efficiency) + (20% Distance Efficiency)
  // Let's normalize these values against the group
  const fares = providers.map(p => p.totalFare);
  const times = providers.map(p => p.etaMins);
  const distances = providers.map(p => p.distanceKm);

  const minFare = Math.min(...fares);
  const minTime = Math.min(...times);
  const minDistance = Math.min(...distances);

  providers.forEach(p => {
    // Efficiency is inverted: lower is better, so min / p_val is efficiency
    const fareEfficiency = minFare / p.totalFare;
    const timeEfficiency = minTime / p.etaMins;
    const distanceEfficiency = minDistance / p.distanceKm;

    const rawScore = (fareEfficiency * 40) + (timeEfficiency * 40) + (distanceEfficiency * 20);
    p.recommendationScore = Math.round(rawScore);
  });

  // Sort or identify the recommendation outcomes
  const cheapest = providers.reduce((prev, curr) => prev.totalFare < curr.totalFare ? prev : curr).name;
  const fastest = providers.reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr).name;
  
  // Best overall matches the highest score
  const bestOverall = providers.reduce((prev, curr) => prev.recommendationScore > curr.recommendationScore ? prev : curr).name;

  // Generate dynamic insights
  const insights: string[] = [];
  
  // Dynamic savings insight
  const maxFare = Math.max(...fares);
  const maxFareProvider = providers.find(p => p.totalFare === maxFare);
  const minFareProvider = providers.find(p => p.totalFare === minFare);
  if (minFareProvider && maxFareProvider && minFareProvider.name !== maxFareProvider.name) {
    const savings = maxFare - minFare;
    insights.push(`${minFareProvider.name} saves ₹${savings} compared to ${maxFareProvider.name}`);
  }

  // Dynamic travel time insight
  const maxTime = Math.max(...times);
  const maxTimeProvider = providers.find(p => p.etaMins === maxTime);
  const minTimeProvider = providers.find(p => p.etaMins === minTime);
  if (minTimeProvider && maxTimeProvider && minTimeProvider.name !== maxTimeProvider.name) {
    const timeSaved = maxTime - minTime;
    insights.push(`${minTimeProvider.name} is ${timeSaved} minutes faster than ${maxTimeProvider.name}`);
  }

  // General recommendation summary
  insights.push(`${bestOverall} offers the best balance based on price, travel duration, and route distance.`);

  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMins: Math.round(durationMins),
    providers,
    recommendations: {
      cheapest,
      fastest,
      bestOverall
    },
    insights
  };
}
