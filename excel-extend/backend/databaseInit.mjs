// databaseInit.mjs

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  app.get('/auth/url', (req, res) => {
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
    res.json({ url });
  });
  
(async () => {
  try {
    // Open a database handle
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    // Create necessary tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        scope TEXT,
        token_type TEXT,
        expiry_date INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        dashboard_items TEXT, -- Stored as JSON string
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dashboard_id TEXT,
        email TEXT,
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id)
      );
    `);

    console.log('Database and tables initialized successfully.');
    
    // Close the database connection
    await db.close();
  } catch (error) {
    console.error('Error initializing the database:', error);
    process.exit(1);
  }
})();
