"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFallbackMode = exports.pool = void 0;
exports.connectWithRetry = connectWithRetry;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/ridecompare';
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
});
exports.isFallbackMode = false;
// Retry database connection on initial load
async function connectWithRetry(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await exports.pool.connect();
            console.log('Successfully connected to PostgreSQL database!');
            client.release();
            exports.isFallbackMode = false;
            return exports.pool;
        }
        catch (err) {
            console.error(`Database connection attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    console.warn('⚠️ WARNING: Failed to connect to PostgreSQL database. Switching to InMemory Fallback Mode for Searches & Analytics.');
    exports.isFallbackMode = true;
    return null;
}
