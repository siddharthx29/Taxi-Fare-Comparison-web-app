export interface RideProviderDetails {
  provider: string;
  vehicleType: 'Cab' | 'Bike' | 'Auto';
  distanceKm: number;
  etaMinutes: number;
  estimatedFare: number;
  surgeMultiplier: number;
  confidence: 'High' | 'Medium' | 'Low';
  
  // Detailed components for transparency/transient metrics
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  platformFee: number;
  tollEstimate: number;
  recommendationScore: number;
  appDeepLink: string;
  webLink: string;
}

export interface ComparisonResult {
  distanceKm: number;
  durationMins: number;
  detectedCity: string;
  surgeRuleName: string;
  providers: RideProviderDetails[];
  recommendations: {
    cheapest: string;
    fastest: string;
    bestOverall: string;
  };
  insights: string[];
}
