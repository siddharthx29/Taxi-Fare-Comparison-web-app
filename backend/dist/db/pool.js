"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.connectWithRetry = connectWithRetry;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ridecompare';
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
});
// Retry database connection on initial load
async function connectWithRetry(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await exports.pool.connect();
            console.log('Successfully connected to PostgreSQL database!');
            client.release();
            return exports.pool;
        }
        catch (err) {
            console.error(`❌ Database connection attempt ${i + 1} of ${retries} failed.`);
            console.error(`Error details: ${err.message || err}`);
            if (err.stack) {
                console.error(err.stack);
            }
            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
    throw new Error(`Failed to establish database connection after ${retries} attempts.`);
}
