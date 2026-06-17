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
      name: 'Uber Go',
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
      name: 'Uber Auto',
      type: 'Auto' as const,
      baseFare: 35,
      perKmRate: 10.0,
      perMinRate: 1.5,
      etaMultiplier: 1.05,
      surgeBase: Math.max(1.0, trafficSurge - 0.05),
      appDeepLink: `uber://?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`,
      webLink: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`
    },
    {
      name: 'Uber Moto',
      type: 'Bike' as const,
      baseFare: 20,
      perKmRate: 8.0,
      perMinRate: 1.1,
      etaMultiplier: 0.82,
      surgeBase: Math.max(1.0, trafficSurge * 0.92),
      appDeepLink: `uber://?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`,
      webLink: `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`
    },
    {
      name: 'Ola Mini',
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
      name: 'Ola Auto',
      type: 'Auto' as const,
      baseFare: 32,
      perKmRate: 10.5,
      perMinRate: 1.4,
      etaMultiplier: 1.12,
      surgeBase: Math.max(1.0, trafficSurge - 0.08),
      appDeepLink: `olacabs://app/launch?pickup=my_location`,
      webLink: `https://www.olacabs.com/`
    },
    {
      name: 'Ola Bike',
      type: 'Bike' as const,
      baseFare: 18,
      perKmRate: 8.5,
      perMinRate: 1.0,
      etaMultiplier: 0.85,
      surgeBase: Math.max(1.0, trafficSurge * 0.95),
      appDeepLink: `olacabs://app/launch?pickup=my_location`,
      webLink: `https://www.olacabs.com/`
    },
    {
      name: 'Rapido Bike',
      type: 'Bike' as const,
      baseFare: 15,
      perKmRate: 7.5,
      perMinRate: 0.9,
      etaMultiplier: 0.78,
      surgeBase: Math.max(1.0, trafficSurge * 0.88),
      appDeepLink: `rapido://booking`,
      webLink: `https://www.rapido.bike/`
    },
    {
      name: 'Rapido Auto',
      type: 'Auto' as const,
      baseFare: 28,
      perKmRate: 9.8,
      perMinRate: 1.3,
      etaMultiplier: 1.08,
      surgeBase: Math.max(1.0, trafficSurge - 0.07),
      appDeepLink: `rapido://booking`,
      webLink: `https://www.rapido.bike/`
    },
    {
      name: 'Rapido Cab',
      type: 'Cab' as const,
      baseFare: 48,
      perKmRate: 13.8,
      perMinRate: 2.0,
      etaMultiplier: 1.15,
      surgeBase: Math.max(1.0, trafficSurge - 0.02),
      appDeepLink: `rapido://booking`,
      webLink: `https://www.rapido.bike/`
    }
  ];

  // Calculate detailed costs for each provider
  const providers: RideProviderDetails[] = providersConfig.map(cfg => {
    const providerDistance = distanceKm;
    const providerEta = Math.round(durationMins * cfg.etaMultiplier);
    
    // Simulate dynamic real-time demand surge fluctuation (+0% to +25%)
    const demandSurge = 1.0 + Math.random() * 0.25;
    const finalSurge = Number((cfg.surgeBase * demandSurge).toFixed(2));
    
    const dFare = providerDistance * cfg.perKmRate;
    const tFare = providerEta * cfg.perMinRate;
    const rawTotal = (cfg.baseFare + dFare + tFare) * finalSurge;
    const totalFare = Math.round(rawTotal);

    return {
      name: cfg.name,
      type: cfg.type,
      distanceKm: Number(providerDistance.toFixed(1)),
      etaMins: providerEta,
      baseFare: cfg.baseFare,
      distanceFare: Number(dFare.toFixed(2)),
      durationFare: Number(tFare.toFixed(2)),
      surgeMultiplier: finalSurge,
      totalFare,
      recommendationScore: 0, // calculated below
      appDeepLink: cfg.appDeepLink,
      webLink: cfg.webLink
    };
  });

  // Calculate recommendation scores relative to their categories
  const fares = providers.map(p => p.totalFare);
  const times = providers.map(p => p.etaMins);
  const distances = providers.map(p => p.distanceKm);

  const minFare = Math.min(...fares);
  const minTime = Math.min(...times);
  const minDistance = Math.min(...distances);

  // Group providers by type to find category-specific minimums
  const cabs = providers.filter(p => p.type === 'Cab');
  const autos = providers.filter(p => p.type === 'Auto');
  const bikes = providers.filter(p => p.type === 'Bike');

  const minFareCab = cabs.length > 0 ? Math.min(...cabs.map(c => c.totalFare)) : minFare;
  const minTimeCab = cabs.length > 0 ? Math.min(...cabs.map(c => c.etaMins)) : minTime;

  const minFareAuto = autos.length > 0 ? Math.min(...autos.map(a => a.totalFare)) : minFare;
  const minTimeAuto = autos.length > 0 ? Math.min(...autos.map(a => a.etaMins)) : minTime;

  const minFareBike = bikes.length > 0 ? Math.min(...bikes.map(b => b.totalFare)) : minFare;
  const minTimeBike = bikes.length > 0 ? Math.min(...bikes.map(b => b.etaMins)) : minTime;

  providers.forEach(p => {
    let typeMinFare = minFare;
    let typeMinTime = minTime;

    if (p.type === 'Cab') {
      typeMinFare = minFareCab;
      typeMinTime = minTimeCab;
    } else if (p.type === 'Auto') {
      typeMinFare = minFareAuto;
      typeMinTime = minTimeAuto;
    } else if (p.type === 'Bike') {
      typeMinFare = minFareBike;
      typeMinTime = minTimeBike;
    }

    const fareEfficiency = typeMinFare / p.totalFare;
    const timeEfficiency = typeMinTime / p.etaMins;
    const distanceEfficiency = minDistance / p.distanceKm;

    const rawScore = (fareEfficiency * 45) + (timeEfficiency * 45) + (distanceEfficiency * 10);
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
