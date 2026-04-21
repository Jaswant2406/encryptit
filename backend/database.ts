import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
    await fs.mkdir(path.dirname(databasePath), { recursive: true });

    db = await open({
      filename: databasePath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        reset_token TEXT,
        reset_token_expiry DATETIME,
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        name TEXT,
        size INTEGER,
        type TEXT,
        date TEXT,
        encryption_type TEXT,
        entropy_before REAL,
        entropy_after REAL,
        FOREIGN KEY(user_email) REFERENCES users(email)
      )
    `);

    // Migration: Add missing columns if they don't exist
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('email_verified')) {
      await db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
    }
    if (!columnNames.includes('verification_token')) {
      await db.exec("ALTER TABLE users ADD COLUMN verification_token TEXT");
    }
    if (!columnNames.includes('name')) {
      await db.exec("ALTER TABLE users ADD COLUMN name TEXT");
    }
  }
  return db;
}
