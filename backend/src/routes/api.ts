import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { calculateFaresAndScores } from '../services/pricing';

const router = Router();

// Geocoding Endpoint (Proxies Nominatim)
router.get('/geocode', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RideCompare-App/1.0.0 (contact@ridecompare.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ error: 'Failed to retrieve geocoding locations' });
  }
});

// Route Calculation & Comparison Endpoint (Proxies OSRM + pricing calculations)
router.get('/route', async (req: Request, res: Response) => {
  const { start, end, sourceName, destName } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Parameters "start" (lng,lat) and "end" (lng,lat) are required' });
  }

  const startCoords = (start as string).split(',');
  const endCoords = (end as string).split(',');
  const lon1 = parseFloat(startCoords[0]);
  const lat1 = parseFloat(startCoords[1]);
  const lon2 = parseFloat(endCoords[0]);
  const lat2 = parseFloat(endCoords[1]);

  let distanceKm = 0;
  let durationMins = 0;
  let geometry: any = null;

  try {
    // Abort controller to enforce a 4-second timeout limit for OSRM public API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM Routing API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found in OSRM response');
    }

    const route = data.routes[0];
    distanceKm = route.distance / 1000; // OSRM returns meters
    durationMins = route.duration / 60; // OSRM returns seconds
    geometry = route.geometry;
  } catch (error: any) {
    console.warn('⚠️ OSRM API failed or timed out. Falling back to straight-line Haversine routing approximation.', error.message);
    
    // Haversine formula calculation
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Add 25% winding factor to approximate road routing distance
    distanceKm = R * c * 1.25;
    
    // Assume average city travel speed of 25 km/h to approximate duration
    durationMins = (distanceKm / 25) * 60;

    // Direct straight-line visual path fallback
    geometry = {
      type: 'LineString',
      coordinates: [
        [lon1, lat1],
        [lon2, lat2]
      ]
    };
  }

  try {
    const sourceLabel = (sourceName as string) || 'Source Location';
    const destLabel = (destName as string) || 'Destination Location';

    // Calculate fares & recommendation scores
    const comparison = calculateFaresAndScores(distanceKm, durationMins, sourceLabel, destLabel);

    // Calculate savings
    const fares = comparison.providers.map(p => p.totalFare);
    const maxFare = Math.max(...fares);
    const minFare = Math.min(...fares);
    const potentialSavings = maxFare - minFare;

    // PostgreSQL Active Path
    const queryText = `
      INSERT INTO searches (
        source, destination, source_lng, source_lat, dest_lng, dest_lat,
        distance_km, duration_min, cheapest_provider, fastest_provider, best_provider, savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      sourceLabel,
      destLabel,
      lon1,
      lat1,
      lon2,
      lat2,
      distanceKm,
      durationMins,
      comparison.recommendations.cheapest,
      comparison.recommendations.fastest,
      comparison.recommendations.bestOverall,
      potentialSavings
    ];

    const dbRes = await pool.query(queryText, values);
    const searchId = dbRes.rows[0].id;

    return res.json({
      searchId,
      geometry,
      comparison
    });
  } catch (error: any) {
    console.error('Failed to log search or compile fares:', error);
    return res.status(500).json({ error: 'Failed to process comparison calculations' });
  }
});

// Logs selected redirect options for user booking click
router.post('/redirect', async (req: Request, res: Response) => {
  const { searchId, provider, fare } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Parameter "provider" is required' });
  }

  try {
    // PostgreSQL Active Path
    if (searchId) {
      await pool.query(
        'UPDATE searches SET selected_provider = $1 WHERE id = $2',
        [provider, searchId]
      );
    }

    const checkQuery = `
      SELECT id FROM analytics 
      WHERE provider = $1 AND created_at >= CURRENT_DATE
    `;
    const checkRes = await pool.query(checkQuery, [provider]);

    if (checkRes.rows.length > 0) {
      const updateQuery = `
        UPDATE analytics 
        SET clicks = clicks + 1, redirects = redirects + 1, fare = fare + $1
        WHERE id = $2
      `;
      await pool.query(updateQuery, [fare || 0, checkRes.rows[0].id]);
    } else {
      const insertQuery = `
        INSERT INTO analytics (provider, clicks, redirects, fare)
        VALUES ($1, 1, 1, $2)
      `;
      await pool.query(insertQuery, [provider, fare || 0]);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Booking redirect analytics error:', error);
    return res.status(500).json({ error: 'Failed to record analytics click redirect' });
  }
});

// Retrieve aggregated Analytics Dashboard stats
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // PostgreSQL Active Path
    const totalSearchesRes = await pool.query('SELECT COUNT(*)::int as count FROM searches');
    const totalSearches = totalSearchesRes.rows[0].count;

    const avgSavingsRes = await pool.query('SELECT COALESCE(AVG(savings), 0)::float as avg_savings FROM searches');
    const avgSavings = Math.round(avgSavingsRes.rows[0].avg_savings);

    const popRoutesRes = await pool.query(`
      SELECT source, destination, COUNT(*)::int as count
      FROM searches
      GROUP BY source, destination
      ORDER BY count DESC
      LIMIT 5
    `);
    const popularRoutes = popRoutesRes.rows;

    const providerShareRes = await pool.query(`
      SELECT provider, SUM(clicks)::int as clicks, SUM(redirects)::int as redirects, COALESCE(SUM(fare), 0)::float as total_fare
      FROM analytics
      GROUP BY provider
      ORDER BY clicks DESC
    `);
    const providerShares = providerShareRes.rows;

    const dailyTrendsRes = await pool.query(`
      SELECT 
        TO_CHAR(d.day, 'YYYY-MM-DD') as date,
        COUNT(s.id)::int as count
      FROM (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date as day
      ) d
      LEFT JOIN searches s ON s.created_at::date = d.day
      GROUP BY d.day
      ORDER BY d.day ASC
    `);
    const dailyTrends = dailyTrendsRes.rows;

    return res.json({
      totalSearches,
      avgSavings,
      popularRoutes,
      providerShares,
      dailyTrends
    });
  } catch (error: any) {
    console.error('Failed to get analytics dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

export default router;
