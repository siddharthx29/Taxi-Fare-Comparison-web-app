"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCity = detectCity;
exports.getSurgeMultiplier = getSurgeMultiplier;
exports.calculateFaresAndScores = calculateFaresAndScores;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Fully populated hardcoded fallback config in case JSON fails to load
const fallbackFares = {
    "dynamicPricing": {
        "morningPeak": { "startHour": 7, "endHour": 10, "multiplier": 1.4 },
        "eveningPeak": { "startHour": 17, "endHour": 21, "multiplier": 1.5 },
        "nightCharges": { "startHour": 23, "endHour": 5, "multiplier": 1.25 }
    },
    "defaultCity": "Bangalore",
    "cities": {
        "Bangalore": {
            "toll": {
                "airportKeywords": ["airport", "kempegowda", "kia"],
                "charge": 120
            },
            "providers": {
                "Uber Go": { "baseFare": 50, "perKmRate": 14.0, "perMinRate": 2.0, "platformFee": 15, "vehicleType": "Cab" },
                "Uber Premier": { "baseFare": 70, "perKmRate": 18.0, "perMinRate": 2.5, "platformFee": 20, "vehicleType": "Cab" },
                "Rapido Bike": { "baseFare": 15, "perKmRate": 7.0, "perMinRate": 1.0, "platformFee": 5, "vehicleType": "Bike" },
                "Rapido Auto": { "baseFare": 28, "perKmRate": 10.0, "perMinRate": 1.5, "platformFee": 10, "vehicleType": "Auto" },
                "Ola Mini": { "baseFare": 48, "perKmRate": 14.5, "perMinRate": 2.2, "platformFee": 15, "vehicleType": "Cab" },
                "Ola Prime": { "baseFare": 65, "perKmRate": 17.5, "perMinRate": 2.4, "platformFee": 18, "vehicleType": "Cab" },
                "Local Taxi": { "baseFare": 60, "perKmRate": 16.0, "perMinRate": 0.0, "platformFee": 0, "vehicleType": "Cab" }
            }
        }
    }
};
// Check multiple locations to locate the configuration file across dev, production, and Docker
const possiblePaths = [
    path_1.default.join(__dirname, '../config/fares.json'), // Dev: src/config/fares.json
    path_1.default.join(__dirname, '../../src/config/fares.json'), // Production: dist/services/../../src/config/fares.json
    path_1.default.join(process.cwd(), 'src/config/fares.json'), // Cwd-relative src/config
    path_1.default.join(process.cwd(), 'dist/config/fares.json'), // Cwd-relative dist/config
    path_1.default.join(process.cwd(), 'backend/src/config/fares.json'), // Root folder context
    path_1.default.join(process.cwd(), 'backend/dist/config/fares.json')
];
let fareConfig = fallbackFares;
let loaded = false;
for (const p of possiblePaths) {
    try {
        if (fs_1.default.existsSync(p)) {
            const content = fs_1.default.readFileSync(p, 'utf8');
            const parsed = JSON.parse(content);
            // Verify parsed config structure is valid
            if (parsed && parsed.cities && Object.keys(parsed.cities).length > 0) {
                fareConfig = parsed;
                loaded = true;
                console.log(`[Pricing Configuration] Loaded configuration file from: ${p}`);
                break;
            }
        }
    }
    catch (err) {
        // Continue loop
    }
}
if (!loaded) {
    console.warn('[Pricing Configuration] All fares.json paths failed or were empty. Using hardcoded Bangalore fallback configurations.');
}
function detectCity(source, destination) {
    const text = `${source} ${destination}`.toLowerCase();
    if (text.includes('kochi') || text.includes('cochin') || text.includes('ernakulam')) {
        return 'Kochi';
    }
    if (text.includes('chennai') || text.includes('madras')) {
        return 'Chennai';
    }
    if (text.includes('hyderabad')) {
        return 'Hyderabad';
    }
    if (text.includes('mumbai') || text.includes('bombay')) {
        return 'Mumbai';
    }
    if (text.includes('delhi') || text.includes('noida') || text.includes('gurgaon') || text.includes('ghaziabad') || text.includes('ncr')) {
        return 'Delhi';
    }
    return 'Bangalore'; // default
}
function getSurgeMultiplier() {
    const now = new Date();
    // Since the user is in IST (UTC+5:30), let's ensure we evaluate based on Indian Standard Time.
    // We can convert the server's Date to IST timezone.
    const utcOffset = now.getTimezoneOffset() * 60000;
    const utcTime = now.getTime() + utcOffset;
    const istTime = new Date(utcTime + (3600000 * 5.5));
    const currentHour = istTime.getHours();
    const { dynamicPricing } = fareConfig;
    // Morning Peak: 7:00 AM – 10:00 AM
    if (currentHour >= dynamicPricing.morningPeak.startHour && currentHour < dynamicPricing.morningPeak.endHour) {
        return { multiplier: dynamicPricing.morningPeak.multiplier, ruleName: 'Morning Peak' };
    }
    // Evening Peak: 5:00 PM – 9:00 PM
    if (currentHour >= dynamicPricing.eveningPeak.startHour && currentHour < dynamicPricing.eveningPeak.endHour) {
        return { multiplier: dynamicPricing.eveningPeak.multiplier, ruleName: 'Evening Peak' };
    }
    // Night Charges: 11:00 PM – 5:00 AM
    if (currentHour >= dynamicPricing.nightCharges.startHour || currentHour < dynamicPricing.nightCharges.endHour) {
        return { multiplier: dynamicPricing.nightCharges.multiplier, ruleName: 'Night Charges' };
    }
    return { multiplier: 1.0, ruleName: 'Standard' };
}
function calculateFaresAndScores(distanceKm, durationMins, source, destination, osrmSuccess = true) {
    const city = detectCity(source, destination);
    // Safe extraction to prevent undefined crashes in missing config scenarios
    let cityData = fareConfig.cities[city] || fareConfig.cities[fareConfig.defaultCity];
    if (!cityData) {
        cityData = fallbackFares.cities.Bangalore;
    }
    const { multiplier: peakMultiplier, ruleName: surgeRuleName } = getSurgeMultiplier();
    // Determine Airport Toll Estimate
    let tollEstimate = 0;
    if (cityData.toll) {
        const combinedText = `${source} ${destination}`.toLowerCase();
        const isAirport = cityData.toll.airportKeywords.some((kw) => combinedText.includes(kw));
        // If it's a long trip and goes to the airport, add airport toll
        if (isAirport && distanceKm > 10) {
            tollEstimate = cityData.toll.charge;
        }
    }
    const pickupAddr = encodeURIComponent(source);
    const dropoffAddr = encodeURIComponent(destination);
    // Compile calculations for each provider defined in the city pricing config
    const providerKeys = Object.keys(cityData.providers);
    let providers = providerKeys.map((name) => {
        const cfg = cityData.providers[name];
        // Exact fare formula: (baseFare + (dist * rate) + (time * rate)) * peakMultiplier + platformFee + toll
        const dFare = distanceKm * cfg.perKmRate;
        const tFare = durationMins * cfg.perMinRate;
        const rawFare = (cfg.baseFare + dFare + tFare) * peakMultiplier + cfg.platformFee + tollEstimate;
        const estimatedFare = Math.round(rawFare);
        // Deep link patterns
        const appDeepLink = name.toLowerCase().includes('uber')
            ? `uber://?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`
            : name.toLowerCase().includes('ola')
                ? `olacabs://app/launch?pickup=my_location`
                : name.toLowerCase().includes('rapido')
                    ? `rapido://booking`
                    : `taxifarecompare://booking`;
        const webLink = name.toLowerCase().includes('uber')
            ? `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickupAddr}&dropoff[formatted_address]=${dropoffAddr}`
            : name.toLowerCase().includes('ola')
                ? `https://www.olacabs.com/`
                : name.toLowerCase().includes('rapido')
                    ? `https://www.rapido.bike/`
                    : `https://www.google.com/search?q=local+taxi+booking+${city}`;
        // Confidence Level
        const confidence = !osrmSuccess ? 'Low' : (peakMultiplier > 1.0 ? 'Medium' : 'High');
        return {
            provider: name,
            vehicleType: cfg.vehicleType,
            distanceKm: Number(distanceKm.toFixed(1)),
            etaMinutes: Math.round(durationMins),
            estimatedFare,
            surgeMultiplier: peakMultiplier,
            confidence,
            baseFare: cfg.baseFare,
            distanceFare: Number(dFare.toFixed(1)),
            durationFare: Number(tFare.toFixed(1)),
            platformFee: cfg.platformFee,
            tollEstimate,
            recommendationScore: 0, // Calculated below
            appDeepLink,
            webLink
        };
    });
    // Calculate recommendation scores
    if (providers.length > 0) {
        const fares = providers.map(p => p.estimatedFare);
        const times = providers.map(p => p.etaMinutes);
        const distances = providers.map(p => p.distanceKm);
        const minFare = Math.min(...fares);
        const minTime = Math.min(...times);
        const minDistance = Math.min(...distances);
        // Category specific minimums
        const cabs = providers.filter(p => p.vehicleType === 'Cab');
        const autos = providers.filter(p => p.vehicleType === 'Auto');
        const bikes = providers.filter(p => p.vehicleType === 'Bike');
        const minFareCab = cabs.length > 0 ? Math.min(...cabs.map(c => c.estimatedFare)) : minFare;
        const minTimeCab = cabs.length > 0 ? Math.min(...cabs.map(c => c.etaMinutes)) : minTime;
        const minFareAuto = autos.length > 0 ? Math.min(...autos.map(a => a.estimatedFare)) : minFare;
        const minTimeAuto = autos.length > 0 ? Math.min(...autos.map(a => a.etaMinutes)) : minTime;
        const minFareBike = bikes.length > 0 ? Math.min(...bikes.map(b => b.estimatedFare)) : minFare;
        const minTimeBike = bikes.length > 0 ? Math.min(...bikes.map(b => b.etaMinutes)) : minTime;
        providers.forEach(p => {
            let typeMinFare = minFare;
            let typeMinTime = minTime;
            if (p.vehicleType === 'Cab') {
                typeMinFare = minFareCab;
                typeMinTime = minTimeCab;
            }
            else if (p.vehicleType === 'Auto') {
                typeMinFare = minFareAuto;
                typeMinTime = minTimeAuto;
            }
            else if (p.vehicleType === 'Bike') {
                typeMinFare = minFareBike;
                typeMinTime = minTimeBike;
            }
            const fareEfficiency = p.estimatedFare > 0 ? (typeMinFare / p.estimatedFare) : 1.0;
            const timeEfficiency = p.etaMinutes > 0 ? (typeMinTime / p.etaMinutes) : 1.0;
            const distanceEfficiency = p.distanceKm > 0 ? (minDistance / p.distanceKm) : 1.0;
            const rawScore = (fareEfficiency * 45) + (timeEfficiency * 45) + (distanceEfficiency * 10);
            p.recommendationScore = Math.round(rawScore);
        });
    }
    // Sort providers strictly by cheapest estimated fare (ascending)
    providers.sort((a, b) => a.estimatedFare - b.estimatedFare);
    // Recommendations summary
    const cheapest = providers.length > 0
        ? providers.reduce((prev, curr) => prev.estimatedFare < curr.estimatedFare ? prev : curr).provider
        : 'None';
    const fastest = providers.length > 0
        ? providers.reduce((prev, curr) => prev.etaMinutes < curr.etaMinutes ? prev : curr).provider
        : 'None';
    const bestOverall = providers.length > 0
        ? providers.reduce((prev, curr) => prev.recommendationScore > curr.recommendationScore ? prev : curr).provider
        : 'None';
    // Dynamic Insights
    const insights = [];
    if (providers.length > 1) {
        const minFareProvider = providers[0];
        const maxFareProvider = providers[providers.length - 1];
        if (minFareProvider && maxFareProvider && minFareProvider.provider !== maxFareProvider.provider) {
            const savings = maxFareProvider.estimatedFare - minFareProvider.estimatedFare;
            insights.push(`Save up to ₹${savings} by choosing ${minFareProvider.provider} instead of ${maxFareProvider.provider}.`);
        }
        const fastestProvider = providers.reduce((prev, curr) => prev.etaMinutes < curr.etaMinutes ? prev : curr);
        const slowestProvider = providers.reduce((prev, curr) => prev.etaMinutes > curr.etaMinutes ? prev : curr);
        if (fastestProvider && slowestProvider && fastestProvider.provider !== slowestProvider.provider) {
            const timeSaved = slowestProvider.etaMinutes - fastestProvider.etaMinutes;
            insights.push(`${fastestProvider.provider} gets you there ${timeSaved} minutes faster than ${slowestProvider.provider}.`);
        }
        if (bestOverall !== 'None') {
            insights.push(`${bestOverall} is recommended as it offers the best balance of cost, speed, and comfort.`);
        }
        if (tollEstimate > 0) {
            insights.push(`Includes an estimated Airport Toll charge of ₹${tollEstimate} applied for ${city}.`);
        }
    }
    return {
        distanceKm: Number(distanceKm.toFixed(1)),
        durationMins: Math.round(durationMins),
        detectedCity: city,
        surgeRuleName,
        providers,
        recommendations: {
            cheapest,
            fastest,
            bestOverall
        },
        insights
    };
}
