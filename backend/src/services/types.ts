export interface RideProviderDetails {
  provider: string;
  vehicleType: 'Cab' | 'Bike' | 'Auto';
  distanceKm: number;
  etaMinutes: number;
  estimatedFare: number;
  surgeMultiplier: number;
  confidence: 'High' | 'Medium' | 'Low';
  
  // Efficiency metrics
  costPerKm: number;
  costPerMin: number;
  efficiencyScore: number;
  recommendationScore: number;

  // Detailed components
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  platformFee: number;
  tollEstimate: number;
  appDeepLink: string;
  webLink: string;

  // Visual highlights
  isCheapest: boolean;
  isFastest: boolean;
  isMostEfficient: boolean;
  isBestValue: boolean;
}

export interface ComparisonResult {
  distanceKm: number;
  durationMins: number;
  detectedCity: string;
  surgeRuleName: string;
  straightLineDistance: number;
  detourDistance: number;
  providers: RideProviderDetails[];
  recommendations: {
    cheapest: string;
    fastest: string;
    mostEfficient: string;
    bestValue: string;
    recommendationReason: string;
    distanceAdvantage: string;
    timeAdvantage: string;
    costAdvantage: string;
  };
  insights: string[];
}
