import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { connectWithRetry } from './db/pool';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({
  origin: '*', // Allows access from any client, suitable for Docker orchestrations
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Express rate limiter to secure backend routes from abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Bind Routes
app.use('/api', apiRouter);

// Base Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected database or server error occurred' });
});

// Launch server after connecting to PostgreSQL DB
async function startServer() {
  try {
    await connectWithRetry();
    app.listen(PORT, () => {
      console.log(`RideCompare backend listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error('Fatal error starting RideCompare server:', error);
    process.exit(1);
  }
}

startServer();
