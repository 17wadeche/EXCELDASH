// server.mjs

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cron from 'node-cron';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware setup
const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies and other credentials
}));

// Configure express-session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your_session_secret', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 3600000, // 1 hour in milliseconds
  },
});

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('combined')); // Optional: For logging

// Initialize SQLite Database
const db = await open({
  filename: './database.sqlite',
  driver: sqlite3.Database
});

await db.run('PRAGMA foreign_keys = ON;');

// Create necessary tables if they don't exist
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dashboard_items TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dashboard_id TEXT NOT NULL,
    email TEXT NOT NULL,
    UNIQUE(dashboard_id, email),
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id)
  );
`);

// Helper Functions

// User Functions
const findUserByEmail = async (email) => {
  return await db.get('SELECT * FROM users WHERE email = ?', email);
};

const createUser = async (user) => {
  const { id, email } = user;
  await db.run(
    `INSERT INTO users (id, email)
     VALUES (?, ?)`,
    id,
    email
  );
};

// Dashboard Functions
const createDashboard = async (dashboard) => {
  const { id, userId, dashboardItems, createdAt } = dashboard;
  await db.run(
    `INSERT INTO dashboards (id, user_id, dashboard_items, created_at)
     VALUES (?, ?, ?, ?)`,
    id,
    userId,
    JSON.stringify(dashboardItems),
    createdAt
  );
};

const findDashboard = async (dashboardId, userId) => {
  return await db.get(
    'SELECT * FROM dashboards WHERE id = ? AND user_id = ?',
    dashboardId,
    userId
  );
};

const findDashboardById = async (dashboardId) => {
  return await db.get('SELECT * FROM dashboards WHERE id = ?', dashboardId);
};

const addRecipient = async (dashboardId, recipientEmail) => {
  await db.run(
    `INSERT INTO recipients (dashboard_id, email)
     VALUES (?, ?)`,
    dashboardId,
    recipientEmail
  );
};

const getRecipients = async (dashboardId) => {
  return await db.all(
    'SELECT email FROM recipients WHERE dashboard_id = ?',
    dashboardId
  );
};

const getUserDashboards = async (userId) => {
  return await db.all(
    'SELECT * FROM dashboards WHERE user_id = ?',
    userId
  );
};

// Function to generate mailto link
const generateMailtoLink = (recipientEmail, subject, body) => {
  const formattedBody = encodeURIComponent(body.replace(/\n/g, '\\n'));
  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${formattedBody}`;
};

// Function to generate email content from dashboard items
const generateDashboardContent = (dashboardItems) => {
  let content = 'Your Weekly Dashboard Update:\n\n';

  dashboardItems.forEach((item, index) => {
    if (item.type === 'text') {
      content += `${index + 1}. ${item.content}\n`;
    } else if (item.type === 'chart' || item.type === 'gantt') {
      content += `${index + 1}. Chart: ${item.data.title}\n[Visualization Placeholder]\n`;
    } else if (item.type === 'existingChart') {
      content += `${index + 1}. Existing Chart: ${item.data.title}\n`;
    }
  });

  return content;
};

// API Endpoints

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    // Create a new user
    const newUser = {
      id: uuidv4(),
      email,
    };

    await createUser(newUser);

    // Initialize session
    req.session.user = { id: newUser.id, email: newUser.email };

    console.log(`User registered: ${newUser.email}`);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // Find the user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Initialize session
    req.session.user = { id: user.id, email: user.email };

    console.log(`User logged in: ${user.email}`);
    res.json({ message: 'Logged in successfully.' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// User Logout Endpoint
app.post('/api/logout', (req, res) => {
  if (req.session.user) {
    const userEmail = req.session.user.email;
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      res.clearCookie('connect.sid'); // Name may vary based on your session setup
      console.log(`User logged out: ${userEmail}`);
      res.json({ message: 'Logged out successfully.' });
    });
  } else {
    res.status(400).json({ error: 'No active session.' });
  }
});

// Endpoint to get mailto link for dashboard
app.post('/api/getMailtoLink', async (req, res) => {
  const { dashboardId, recipientEmail } = req.body;
  const userId = req.session.user?.id || 'anonymous';

  if (!dashboardId || !recipientEmail) {
    console.warn(`User ${userId} provided incomplete data.`);
    return res.status(400).json({ error: 'Dashboard ID and recipient email are required.' });
  }

  try {
    const dashboard = await findDashboard(dashboardId, userId);
    if (dashboard) {
      const dashboardItems = JSON.parse(dashboard.dashboard_items);
      const emailContent = generateDashboardContent(dashboardItems);
      const mailtoLink = generateMailtoLink(recipientEmail, 'Weekly Dashboard Update', emailContent);

      console.log(`Generated mailto link for ${recipientEmail} from dashboard ${dashboardId}.`);
      res.json({ mailtoLink });
    } else {
      console.warn(`Dashboard ${dashboardId} not found for user ${userId}.`);
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    console.error('Error generating mailto link:', error);
    res.status(500).json({ error: 'Error generating mailto link' }); // Ensure error is a string
  }
});

// Endpoint to load a specific dashboard by ID (authenticated users)
app.get('http://localhost/api/loadDashboard/:id', async (req, res) => {
  const dashboardId = req.params.id;
  const userId = req.session.user?.id;

  if (!userId) {
    console.warn(`Unauthenticated access attempt to load dashboard ${dashboardId}.`);
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const dashboard = await findDashboard(dashboardId, userId);
    if (dashboard) {
      // Parse the dashboard items before sending
      const dashboardData = {
        id: dashboard.id,
        userId: dashboard.user_id,
        dashboardItems: JSON.parse(dashboard.dashboard_items),
        createdAt: dashboard.created_at,
      };
      res.json(dashboardData);
    } else {
      console.warn(`Dashboard ${dashboardId} not found for user ${userId}.`);
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    console.error(`Error loading dashboard ${dashboardId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to load a shared dashboard by ID (no authentication required)
app.get('http://localhost/api/sharedDashboard/:id', async (req, res) => {
  const dashboardId = req.params.id;

  try {
    const dashboard = await findDashboardById(dashboardId);

    if (dashboard) {
      const dashboardData = {
        id: dashboard.id,
        userId: dashboard.user_id,
        dashboardItems: JSON.parse(dashboard.dashboard_items),
        createdAt: dashboard.created_at,
      };
      res.json(dashboardData);
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    console.error(`Error loading shared dashboard ${dashboardId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get authenticated user's information
app.get('/api/getUser', (req, res) => {
  if (req.session.user) {
    res.json({ userId: req.session.user.id, email: req.session.user.email });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Schedule weekly email task to log mailto links every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('Running weekly mailto link task...');
  try {
    const users = await db.all('SELECT * FROM users');
    const dashboards = await db.all('SELECT * FROM dashboards');

    for (const user of users) {
      const userDashboards = dashboards.filter(dash => dash.user_id === user.id);
      for (const dashboard of userDashboards) {
        const recipients = await getRecipients(dashboard.id);
        for (const recipient of recipients) {
          const dashboardItems = JSON.parse(dashboard.dashboard_items);
          const emailContent = generateDashboardContent(dashboardItems);
          const mailtoLink = generateMailtoLink(recipient.email, 'Weekly Dashboard Update', emailContent);

          console.log(`Generated mailto link for ${recipient.email} from dashboard ${dashboard.id}:`);
          console.log(mailtoLink);
        }
      }
    }
  } catch (error) {
    console.error('Error during weekly mailto link task:', error);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
