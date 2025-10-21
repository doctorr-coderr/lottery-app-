import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { db } from '../utils/db';
import { users, depositRequests, tickets, draws, winners, notifications } from '../db/schema';
import { eq, and, count, sum, sql, gte, lte, desc } from 'drizzle-orm';
import { createId } from "@paralleldrive/cuid2";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken, requireAdmin);

// Get admin dashboard stats
router.get('/stats', async (req: any, res) => {
  try {
    const [
      totalUsers,
      totalDeposits,
      pendingDeposits,
      totalTickets,
      activeDraws
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ total: sum(depositRequests.amount) }).from(depositRequests).where(eq(depositRequests.status, 'approved')),
      db.select({ count: count() }).from(depositRequests).where(eq(depositRequests.status, 'pending')),
      db.select({ count: count() }).from(tickets),
      db.select({ count: count() }).from(draws).where(eq(draws.status, 'pending'))
    ]);

    res.json({
      totalUsers: totalUsers[0].count,
      totalDeposits: totalDeposits[0].total || '0',
      pendingDeposits: pendingDeposits[0].count,
      totalTickets: totalTickets[0].count,
      activeDraws: activeDraws[0].count
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get recent activity
router.get('/activity', async (req: any, res) => {
  try {
    const recentActivity = await db.select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    res.json(recentActivity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

// Get all deposit requests
router.get('/deposits', async (req: any, res) => {
  try {
    const deposits = await db.select({
      id: depositRequests.id,
      userId: depositRequests.userId,
      amount: depositRequests.amount,
      status: depositRequests.status,
      imageUrl: depositRequests.imageUrl,
      createdAt: depositRequests.createdAt,
      user: {
        id: users.id,
        email: users.email
      }
    })
    .from(depositRequests)
    .leftJoin(users, eq(depositRequests.userId, users.id))
    .orderBy(desc(depositRequests.createdAt));

    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ message: 'Error fetching deposits' });
  }
});

// Update deposit request status
router.patch('/deposits/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update deposit status
    const updatedDeposits = await db.update(depositRequests)
      .set({ status })
      .where(eq(depositRequests.id, id))
      .returning();

    if (updatedDeposits.length === 0) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }

    const deposit = updatedDeposits[0];

    // If approved, update user balance
    if (status === 'approved') {
      await db.update(users)
        .set({ balance: sql`${users.balance} + ${deposit.amount}` })
        .where(eq(users.id, deposit.userId!));

      // Create notification for user
      await db.insert(notifications).values({
        userId: deposit.userId!,
        message: `Your deposit of ETB ${deposit.amount} has been approved`,
        type: 'deposit'
      });
    } else {
      // Create notification for rejected deposit
      await db.insert(notifications).values({
        userId: deposit.userId!,
        message: `Your deposit of ETB ${deposit.amount} has been rejected`,
        type: 'deposit'
      });
    }

    res.json({ message: 'Deposit status updated successfully' });
  } catch (error) {
    console.error('Error updating deposit:', error);
    res.status(500).json({ message: 'Error updating deposit status' });
  }
});

// Get all draws
router.get('/draws', async (req: any, res) => {
  try {
    const drawsList = await db.select({
      id: draws.id,
      drawTime: draws.drawTime,
      status: draws.status,
      ticketPrice: draws.ticketPrice,
      createdAt: draws.createdAt,
      winningTicketId: draws.winningTicketId,
      ticketCount: count(tickets.id)
    })
    .from(draws)
    .leftJoin(tickets, eq(draws.id, tickets.drawId))
    .groupBy(draws.id)
    .orderBy(desc(draws.drawTime));

    res.json(drawsList);
  } catch (error) {
    console.error('Error fetching draws:', error);
    res.status(500).json({ message: 'Error fetching draws' });
  }
});

// Create new draw
router.post('/draws', async (req: any, res) => {
  try {
    const { drawTime, ticketPrice } = req.body;

    if (!drawTime || !ticketPrice) {
      return res.status(400).json({ message: 'Draw time and ticket price are required' });
    }

    const newDraw = await db.insert(draws).values({
    id: createId(),
    drawTime: new Date(drawTime),
    ticketPrice,
    status: 'pending'
    }).returning();

    res.status(201).json({ message: 'Draw created successfully', draw: newDraw[0] });
  } catch (error) {
    console.error('Error creating draw:', error);
    res.status(500).json({ message: 'Error creating draw' });
  }
});

// Run draw (select winner)
router.post('/draws/:id/run', async (req: any, res) => {
  try {
    const { id } = req.params;

    // Get the draw
    const drawResult = await db.select()
      .from(draws)
      .where(eq(draws.id, id));

    if (drawResult.length === 0) {
      return res.status(404).json({ message: 'Draw not found' });
    }

    const draw = drawResult[0];

    if (draw.status !== 'pending') {
      return res.status(400).json({ message: 'Draw has already been completed or cancelled' });
    }

    if (new Date(draw.drawTime) > new Date()) {
      return res.status(400).json({ message: 'Draw time has not yet arrived' });
    }

    // Get all tickets for this draw
    const ticketsList = await db.select()
      .from(tickets)
      .where(eq(tickets.drawId, id));

    if (ticketsList.length === 0) {
      return res.status(400).json({ message: 'No tickets purchased for this draw' });
    }

    // Select random winner (cryptographically secure)
    const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000 * ticketsList.length);
    const winningTicket = ticketsList[randomIndex];

    // Calculate prize (80% of total ticket sales)
    const totalSales = ticketsList.length * parseFloat(draw.ticketPrice);
    const prizeAmount = totalSales * 0.8;

    // Update draw status and set winning ticket
    await db.update(draws)
      .set({ 
        status: 'completed',
        winningTicketId: winningTicket.id
      })
      .where(eq(draws.id, id));

    // Create winner record
    await db.insert(winners).values({
      userId: winningTicket.userId,
      drawId: id,
      prizeAmount: prizeAmount.toString()
    });

    // Update winner's balance
    await db.update(users)
    .set({
        balance: sql<number>`${users.balance} + ${prizeAmount}`
    })
    .where(eq(users.id, winningTicket.userId!));

    // Create notification for winner
    await db.insert(notifications).values({
      userId: winningTicket.userId,
      message: `Congratulations! You won $${prizeAmount.toFixed(2)} in the lottery draw`,
      type: 'winner'
    });

    // Create notifications for all participants
    const participantIds = [...new Set(ticketsList.map(ticket => ticket.userId))];
    for (const userId of participantIds) {
      if (userId !== winningTicket.userId) {
        await db.insert(notifications).values({
          userId,
          message: `The lottery draw has been completed. Better luck next time!`,
          type: 'draw_completed'
        });
      }
    }

    res.json({ 
      message: 'Draw completed successfully', 
      winner: winningTicket.userId, 
      prizeAmount 
    });
  } catch (error) {
    console.error('Error running draw:', error);
    res.status(500).json({ message: 'Error running draw' });
  }
});

// Get all users
router.get('/users', async (req: any, res) => {
  try {
    const usersList = await db.select({
      id: users.id,
      email: users.email,
      balance: users.balance,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      ticketCount: count(tickets.id)
    })
    .from(users)
    .leftJoin(tickets, eq(users.id, tickets.userId))
    .groupBy(users.id)
    .orderBy(users.createdAt);

    res.json(usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user (toggle admin status)
router.patch('/users/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    const updatedUsers = await db.update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning();

    if (updatedUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: updatedUsers[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});





export default router;