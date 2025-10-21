"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../utils/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = express_1.default.Router();
// Get upcoming draws
router.get('/upcoming', async (req, res) => {
    try {
        const upcomingDraws = await db_1.db.select({
            id: schema_1.draws.id,
            drawTime: schema_1.draws.drawTime,
            status: schema_1.draws.status,
            ticketPrice: schema_1.draws.ticketPrice,
            ticketCount: (0, drizzle_orm_1.count)(schema_1.tickets.id)
        })
            .from(schema_1.draws)
            .leftJoin(schema_1.tickets, (0, drizzle_orm_1.eq)(schema_1.draws.id, schema_1.tickets.drawId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.draws.status, 'pending'), (0, drizzle_orm_1.gte)(schema_1.draws.drawTime, new Date())))
            .groupBy(schema_1.draws.id)
            .orderBy(schema_1.draws.drawTime)
            .limit(5);
        res.json(upcomingDraws);
    }
    catch (error) {
        console.error('Error fetching upcoming draws:', error);
        res.status(500).json({ message: 'Error fetching upcoming draws' });
    }
});
// Get recent winners
router.get('/winners', async (req, res) => {
    try {
        const recentWinners = await db_1.db.select({
            id: schema_1.winners.id,
            userId: schema_1.winners.userId,
            prizeAmount: schema_1.winners.prizeAmount,
            announcedAt: schema_1.winners.announcedAt,
            draw: {
                drawTime: schema_1.draws.drawTime
            }
        })
            .from(schema_1.winners)
            .leftJoin(schema_1.draws, (0, drizzle_orm_1.eq)(schema_1.winners.drawId, schema_1.draws.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.winners.announcedAt))
            .limit(10);
        res.json(recentWinners);
    }
    catch (error) {
        console.error('Error fetching winners:', error);
        res.status(500).json({ message: 'Error fetching winners' });
    }
});
// Get available draws for ticket purchase
router.get('/available', async (req, res) => {
    try {
        const availableDraws = await db_1.db.select()
            .from(schema_1.draws)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.draws.status, 'pending'), (0, drizzle_orm_1.gte)(schema_1.draws.drawTime, new Date())))
            .orderBy(schema_1.draws.drawTime);
        res.json(availableDraws);
    }
    catch (error) {
        console.error('Error fetching available draws:', error);
        res.status(500).json({ message: 'Error fetching available draws' });
    }
});
// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalUsersResult, activeDrawsResult, totalWinnersResult, totalPrizesResult] = await Promise.all([
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.users),
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.draws).where((0, drizzle_orm_1.eq)(schema_1.draws.status, 'pending')),
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.winners),
            db_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_1.winners.prizeAmount) }).from(schema_1.winners)
        ]);
        res.json({
            totalUsers: totalUsersResult[0]?.count || 0,
            activeDraws: activeDrawsResult[0]?.count || 0,
            totalWinners: totalWinnersResult[0]?.count || 0,
            totalPrizes: totalPrizesResult[0]?.total || '0'
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});
exports.default = router;
