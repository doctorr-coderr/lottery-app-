import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { depositRequests, users, notifications } from '../models/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'deposit-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create deposit request
router.post('/', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const { amount } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Create deposit request
    const deposit = await db.insert(depositRequests).values({
      userId: req.userId,
      amount,
      imageUrl: `/uploads/${req.file.filename}`,
      status: 'pending'
    }).returning();

    // Create notification
    await db.insert(notifications).values({
      userId: req.userId,
      message: `Deposit request of $${amount} submitted for approval`,
      type: 'deposit'
    });

    res.status(201).json({ message: 'Deposit request submitted successfully', deposit: deposit[0] });
  } catch (error) {
    console.error('Deposit creation error:', error);
    res.status(500).json({ message: 'Error creating deposit request' });
  }
});

// Get user's deposit history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const deposits = await db.select()
      .from(depositRequests)
      .where(eq(depositRequests.userId, req.userId))
      .orderBy(depositRequests.createdAt);

    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    res.status(500).json({ message: 'Error fetching deposit history' });
  }
});

export default router;