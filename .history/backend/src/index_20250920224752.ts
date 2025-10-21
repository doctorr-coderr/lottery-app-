import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import depositRoutes from './routes/deposits';
import { depositRequests } from './db/schema';
import { draws } from './db/schema';
import ticketRoutes from './routes/tickets';
import drawRoutes from './routes/draws';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import db from './utils/db';
import { sql } from 'drizzle-orm';
import { users } from './db/schema';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Debug endpoint to check all users
app.get('/api/debug/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Debug endpoint to check all deposits
app.get('/api/debug/deposits', async (req, res) => {
  try {
    const allDeposits = await db.select().from(depositRequests);
    res.json(allDeposits);
  } catch (error) {
    console.error('Debug deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Debug endpoint to check all draws
app.get('/api/debug/draws', async (req, res) => {
  try {
    const allDraws = await db.select().from(draws);
    res.json(allDraws);
  } catch (error) {
    console.error('Debug draws error:', error);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

// 404 handler - MUST be the last middleware
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add this right after creating the Express app
app.get('/api/test-db', async (req, res) => {
  try {
    // Simple query to test database connection
    const result = await db.select({ count: sql`count(*)` }).from(users);
    res.json({ success: true, userCount: result[0].count });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});