import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { withdrawRequests, users, notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Minimum withdraw amount (100 ETB)
const MIN_WITHDRAW_AMOUNT = 100;

// Create withdraw request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { amount } = req.body;

    if (!amount || parseFloat(amount) < MIN_WITHDRAW_AMOUNT) {
      return res.status(400).json({ 
        message: `Minimum withdraw amount is ETB ${MIN_WITHDRAW_AMOUNT}` 
      });
    }

    // Get user balance - handle potential null values
    const user = await db.select()
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle null balance by defaulting to 0
    const userBalance = parseFloat(user[0].balance || '0');

    if (userBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create withdraw request
    const withdraw = await db.insert(withdrawRequests).values({
      userId: req.userId,
      amount,
      status: 'pending'
    }).returning();

    // Create notification
    await db.insert(notifications).values({
      userId: req.userId,
      message: `Withdraw request of ETB ${amount} submitted for review`,
      type: 'withdraw'
    });

    res.status(201).json({ 
      message: 'Withdraw request submitted successfully', 
      withdraw: withdraw[0] 
    });
  } catch (error) {
    console.error('Withdraw creation error:', error);
    res.status(500).json({ message: 'Error creating withdraw request' });
  }
});

// Get user's withdraw history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const withdraws = await db.select()
      .from(withdrawRequests)
      .where(eq(withdrawRequests.userId, req.userId))
      .orderBy(desc(withdrawRequests.createdAt));

    res.json(withdraws);
  } catch (error) {
    console.error('Error fetching withdraw history:', error);
    res.status(500).json({ message: 'Error fetching withdraw history' });
  }
});

export default router;