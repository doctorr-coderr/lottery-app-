import express from 'express';
import { db } from '../utils/db';
import { draws, winners, tickets, users, notifications } from '../db/schema';
import { eq, desc, gte, and, count, sum } from 'drizzle-orm';

const router = express.Router();

// Get upcoming draws
router.get('/upcoming', async (req, res) => {
  try {
    const upcomingDraws = await db.select({
      id: draws.id,
      drawTime: draws.drawTime,
      status: draws.status,
      ticketPrice: draws.ticketPrice,
      ticketCount: count(tickets.id)
    })
    .from(draws)
    .leftJoin(tickets, eq(draws.id, tickets.drawId))
    .where(and(
      eq(draws.status, 'pending'),
      gte(draws.drawTime, new Date())
    ))
    .groupBy(draws.id)
    .orderBy(draws.drawTime)
    .limit(5);

    res.json(upcomingDraws);
  } catch (error) {
    console.error('Error fetching upcoming draws:', error);
    res.status(500).json({ message: 'Error fetching upcoming draws' });
  }
});

// Get recent winners
router.get('/winners', async (req, res) => {
  try {
    const recentWinners = await db.select({
      id: winners.id,
      userId: winners.userId,
      prizeAmount: winners.prizeAmount,
      announcedAt: winners.announcedAt,
      draw: {
        drawTime: draws.drawTime
      }
    })
    .from(winners)
    .leftJoin(draws, eq(winners.drawId, draws.id))
    .orderBy(desc(winners.announcedAt))
    .limit(10);

    res.json(recentWinners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: 'Error fetching winners' });
  }
});

// Get available draws for ticket purchase
router.get('/available', async (req, res) => {
  try {
    const availableDraws = await db.select()
      .from(draws)
      .where(and(
        eq(draws.status, 'pending'),
        gte(draws.drawTime, new Date())
      ))
      .orderBy(draws.drawTime);

    res.json(availableDraws);
  } catch (error) {
    console.error('Error fetching available draws:', error);
    res.status(500).json({ message: 'Error fetching available draws' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsersResult,
      activeDrawsResult,
      totalWinnersResult,
      totalPrizesResult
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(draws).where(eq(draws.status, 'pending')),
      db.select({ count: count() }).from(winners),
      db.select({ total: sum(winners.prizeAmount) }).from(winners)
    ]);

    res.json({
      totalUsers: totalUsersResult[0]?.count || 0,
      activeDraws: activeDrawsResult[0]?.count || 0,
      totalWinners: totalWinnersResult[0]?.count || 0,
      totalPrizes: totalPrizesResult[0]?.total || '0'
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

export default router;