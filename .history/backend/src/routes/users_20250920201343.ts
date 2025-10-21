import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { users, tickets, draws, winners } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

const router = express.Router();

// Get current user info
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, req.userId));

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Get user's tickets
router.get('/tickets', authenticateToken, async (req: any, res) => {
  try {
    const userTickets = await db.select({
      id: tickets.id,
      purchasedAt: tickets.purchasedAt,
      draw: {
        id: draws.id,
        drawTime: draws.drawTime,
        status: draws.status,
        winningTicketId: draws.winningTicketId
      }
    })
    .from(tickets)
    .leftJoin(draws, eq(tickets.drawId, draws.id))
    .where(eq(tickets.userId, req.userId))
    .orderBy(desc(tickets.purchasedAt));

    res.json(userTickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

export default router;