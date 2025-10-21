import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { depositRequests, users, notifications } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Ethiopian banks list
const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'Nib International Bank',
  'Cooperative Bank of Oromia',
  'Lion International Bank',
  'Zemen Bank',
  'Bunna International Bank',
  'Berhan International Bank',
  'Abay Bank',
  'Addis International Bank',
  'Enat Bank',
  'Shabelle Bank',
  'Telebirr',
  'HelloCash',
  'M-Birr',
  'Other'
];

// Create deposit request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { amount, transactionId, bankName, bankMethod } = req.body;
    
    // Validation
    if (!amount || !transactionId || !bankName || !bankMethod) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!ETHIOPIAN_BANKS.includes(bankName)) {
      return res.status(400).json({ message: 'Invalid bank selection' });
    }

    // Validate transaction ID format (alphanumeric, typical Ethiopian format)
    const transactionIdRegex = /^[A-Za-z0-9]{8,20}$/;
    if (!transactionIdRegex.test(transactionId)) {
      return res.status(400).json({ 
        message: 'Transaction ID must be 8-20 characters long and contain only letters and numbers' 
      });
    }

    // Check if transaction ID already exists (to prevent duplicates)
    const existingDeposit = await db.select()
      .from(depositRequests)
      .where(eq(depositRequests.transactionId, transactionId))
      .limit(1);

    if (existingDeposit.length > 0) {
      return res.status(400).json({ message: 'This transaction ID has already been used' });
    }

    // Create deposit request
    const deposit = await db.insert(depositRequests).values({
      userId: req.userId,
      amount,
      transactionId,
      bankName,
      bankMethod,
      status: 'pending'
    }).returning();

    // Create notification
    await db.insert(notifications).values({
      userId: req.userId,
      message: `Deposit request of ETB ${amount} submitted for approval (Transaction ID: ${transactionId})`,
      type: 'deposit'
    });

    res.status(201).json({ 
      message: 'Deposit request submitted successfully', 
      deposit: deposit[0] 
    });
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

// Get Ethiopian banks list
router.get('/banks', (req, res) => {
  res.json(ETHIOPIAN_BANKS);
});

export default router;