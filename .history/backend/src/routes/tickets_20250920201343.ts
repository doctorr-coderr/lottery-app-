import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { tickets, draws, users, notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Get user's tickets
router.get('/my', authenticateToken, async (req: any, res) => {
  try {
    const userTickets = await db
      .select({
        id: tickets.id,
        purchasedAt: tickets.purchasedAt,
        draw: {
          id: draws.id,
          drawTime: draws.drawTime,
          status: draws.status,
          winningTicketId: draws.winningTicketId,
        },
      })
      .from(tickets)
      .leftJoin(draws, eq(tickets.drawId, draws.id))
      .where(eq(tickets.userId, req.userId!)) // use non-null assertion
      .orderBy(desc(tickets.purchasedAt));

    res.json(userTickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

// Purchase tickets
router.post('/purchase', authenticateToken, async (req: any, res) => {
  try {
    const { drawId, quantity } = req.body;

    if (!drawId || !quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({ message: 'Invalid draw ID or quantity' });
    }

    // Get draw information
    const drawResult = await db.select().from(draws).where(eq(draws.id, drawId));

    if (drawResult.length === 0) {
      return res.status(404).json({ message: 'Draw not found' });
    }

    const draw = drawResult[0];

    if (draw.status !== 'pending') {
      return res.status(400).json({ message: 'This draw is not active' });
    }

    if (new Date(draw.drawTime) < new Date()) {
      return res.status(400).json({ message: 'This draw has already started' });
    }

    // Get user balance
    const userResult = await db.select().from(users).where(eq(users.id, req.userId!));

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult[0];
    const totalCost = Number(draw.ticketPrice) * quantity;
    const currentBalance = Number(user.balance);

    if (currentBalance < totalCost) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Deduct balance safely with SQL
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${totalCost}`,
        })
        .where(eq(users.id, req.userId!));

      // Create tickets
      for (let i = 0; i < quantity; i++) {
        await tx.insert(tickets).values({
          userId: req.userId!,
          drawId,
        });
      }

      // Create notification
      await tx.insert(notifications).values({
        userId: req.userId!,
        message: `Purchased ${quantity} ticket(s) for draw #${draw.id.slice(-6)}`,
        type: 'ticket_purchase',
      });
    });

    res.json({ message: 'Tickets purchased successfully' });
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    res.status(500).json({ message: 'Error purchasing tickets' });
  }
});

export default router;
