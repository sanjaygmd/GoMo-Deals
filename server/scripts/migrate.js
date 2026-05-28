import dotenv from 'dotenv';
dotenv.config();

import { testDB } from '../config/db.js';
import { initSchema } from '../config/initDb.js';

async function runMigration() {
    console.log("Starting database migration...");
    console.warn("WARNING: This migration script uses 'initSchema' which relies on 'CREATE TABLE IF NOT EXISTS'.");
    console.warn("It will NOT apply structural changes (new columns, constraint modifications) to existing tables.");
    console.warn("Recommendation: Integrate a versioned migration tool (e.g., node-pg-migrate) for production use.");
    
    try {
        await testDB();
        await initSchema();
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
