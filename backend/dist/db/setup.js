"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
dotenv_1.default.config();
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ridecompare';
function getSystemDbUrl(url) {
    try {
        const parsed = new url_1.URL(url);
        parsed.pathname = '/postgres';
        return parsed.toString();
    }
    catch (err) {
        throw new Error(`Failed to parse DATABASE_URL: ${url}`);
    }
}
function getDatabaseName(url) {
    try {
        const parsed = new url_1.URL(url);
        return parsed.pathname.replace('/', '');
    }
    catch (err) {
        throw new Error(`Failed to extract database name from DATABASE_URL: ${url}`);
    }
}
async function checkPostgresAvailability(retries = 10, delay = 2000) {
    const systemDbUrl = getSystemDbUrl(dbUrl);
    const parsedUrl = new url_1.URL(dbUrl);
    console.log(`Checking PostgreSQL availability at ${parsedUrl.hostname}:${parsedUrl.port || '5432'}...`);
    for (let i = 0; i < retries; i++) {
        const client = new pg_1.Client({ connectionString: systemDbUrl });
        try {
            await client.connect();
            await client.end();
            console.log('✅ PostgreSQL server is available and accepting connections.');
            return true;
        }
        catch (err) {
            console.log(`[Attempt ${i + 1}/${retries}] PostgreSQL not available yet: ${err.message}. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    return false;
}
async function ensureDatabaseExists() {
    const targetDb = getDatabaseName(dbUrl);
    const systemDbUrl = getSystemDbUrl(dbUrl);
    console.log(`Verifying target database "${targetDb}" exists...`);
    const client = new pg_1.Client({ connectionString: systemDbUrl });
    try {
        await client.connect();
        const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
        if (res.rowCount === 0) {
            console.log(`Database "${targetDb}" does not exist. Creating database "${targetDb}"...`);
            // CREATE DATABASE cannot run in a transaction, run it on the client
            await client.query(`CREATE DATABASE ${targetDb}`);
            console.log(`✅ Database "${targetDb}" created successfully.`);
        }
        else {
            console.log(`Database "${targetDb}" already exists.`);
        }
    }
    catch (err) {
        console.error(`❌ Error verifying or creating database: ${err.message}`);
        throw err;
    }
    finally {
        await client.end();
    }
}
async function runMigrations() {
    const targetDb = getDatabaseName(dbUrl);
    console.log(`Connecting to database "${targetDb}" to execute migrations...`);
    const client = new pg_1.Client({ connectionString: dbUrl });
    try {
        await client.connect();
        // Ensure migrations table exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        const migrationsDir = path_1.default.join(__dirname, 'migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            console.warn(`⚠️ Migrations directory not found at: ${migrationsDir}. Skipping migrations.`);
            return;
        }
        const files = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        if (files.length === 0) {
            console.log('No migration scripts (.sql) found.');
            return;
        }
        for (const file of files) {
            const checkRes = await client.query('SELECT 1 FROM schema_migrations WHERE migration_name = $1', [file]);
            if (checkRes.rowCount === 0) {
                console.log(`Applying migration "${file}"...`);
                const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf8');
                await client.query('BEGIN');
                try {
                    // Execute migration SQL commands
                    await client.query(sql);
                    // Log applied migration
                    await client.query('INSERT INTO schema_migrations (migration_name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`✅ Migration "${file}" applied successfully.`);
                }
                catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Migration "${file}" failed! Transaction rolled back.`);
                    throw err;
                }
            }
            else {
                console.log(`Migration "${file}" already applied.`);
            }
        }
    }
    catch (err) {
        console.error(`❌ Error during migration runner: ${err.message}`);
        throw err;
    }
    finally {
        await client.end();
    }
}
async function main() {
    console.log('====================================================');
    console.log('         RideCompare Database Setup & Migrator       ');
    console.log('====================================================');
    try {
        const isAvailable = await checkPostgresAvailability(10, 2000);
        if (!isAvailable) {
            console.error('❌ FATAL: PostgreSQL server is offline or unreachable on port 5432.');
            console.error('Please verify PostgreSQL is running locally before launching RideCompare.');
            process.exit(1);
        }
        await ensureDatabaseExists();
        await runMigrations();
        console.log('====================================================');
        console.log('✅ Database setup and migrations completed successfully!');
        console.log('====================================================');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ FATAL: Database setup failed:');
        console.error(err.stack || err.message || err);
        process.exit(1);
    }
}
main();
