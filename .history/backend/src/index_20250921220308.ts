import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';


// Load environment variables
dotenv.config();

// Import routes
import  withdrawRoutes  from './routes/withdraw';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import depositRoutes from './routes/deposits';
import ticketRoutes from './routes/tickets';
import drawRoutes from './routes/draws';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

// Import DB
import db from './utils/db';
import { depositRequests, draws, users } from './db/schema';
import { sql } from 'drizzle-orm';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', 
      process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL! 
        : 'http://localhost:3000'
    );
    
    // Set cache headers for production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Test DB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    res.json({ success: true, userCount: result[0].count });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Debug: all users
app.get('/api/debug/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Debug: all deposits
app.get('/api/debug/deposits', async (req, res) => {
  try {
    const allDeposits = await db.select().from(depositRequests);
    res.json(allDeposits);
  } catch (error) {
    console.error('Debug deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Debug: all draws
app.get('/api/debug/draws', async (req, res) => {
  try {
    const allDraws = await db.select().from(draws);
    res.json(allDraws);
  } catch (error) {
    console.error('Debug draws error:', error);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

// Debug: uploaded files
app.get('/api/debug/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      uploadsDirectory: uploadsDir,
      fileCount: files.length,
      files: files
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    res.status(500).json({ error: 'Error reading uploads directory' });
  }
});

// Debug: deposits with file check
app.get('/api/debug/deposit-images', async (req, res) => {
  try {
    const deposits = await db.select({
      id: depositRequests.id,
      imageUrl: depositRequests.imageUrl,
    }).from(depositRequests);

    const depositsWithFileInfo = deposits.map(deposit => {
      const filename = deposit.imageUrl.replace('/uploads/', '');
      const filePath = path.join(uploadsDir, filename);
      return {
        id: deposit.id,
        imageUrl: deposit.imageUrl,
        filename,
        fileExists: fs.existsSync(filePath),
        filePath
      };
    });

    res.json(depositsWithFileInfo);
  } catch (error) {
    console.error('Error checking deposit images:', error);
    res.status(500).json({ error: 'Error checking deposit images' });
  }
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
