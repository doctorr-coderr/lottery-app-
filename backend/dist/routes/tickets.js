"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../utils/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
const router = express_1.default.Router();
// Get user's tickets
router.get('/my', auth_1.authenticateToken, async (req, res) => {
    try {
        const userTickets = await db_1.db
            .select({
            id: schema_1.tickets.id,
            purchasedAt: schema_1.tickets.purchasedAt,
            draw: {
                id: schema_1.draws.id,
                drawTime: schema_1.draws.drawTime,
                status: schema_1.draws.status,
                winningTicketId: schema_1.draws.winningTicketId,
            },
        })
            .from(schema_1.tickets)
            .leftJoin(schema_1.draws, (0, drizzle_orm_1.eq)(schema_1.tickets.drawId, schema_1.draws.id))
            .where((0, drizzle_orm_1.eq)(schema_1.tickets.userId, req.userId)) // use non-null assertion
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tickets.purchasedAt));
        res.json(userTickets);
    }
    catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});
// Purchase tickets
router.post('/purchase', auth_1.authenticateToken, async (req, res) => {
    try {
        const { drawId, quantity } = req.body;
        if (!drawId || !quantity || quantity < 1 || quantity > 10) {
            return res.status(400).json({ message: 'Invalid draw ID or quantity' });
        }
        // Get draw information
        const drawResult = await db_1.db.select().from(schema_1.draws).where((0, drizzle_orm_1.eq)(schema_1.draws.id, drawId));
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
        const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
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
        await db_1.db.transaction(async (tx) => {
            // Deduct balance safely with SQL
            await tx
                .update(schema_1.users)
                .set({
                balance: (0, drizzle_orm_2.sql) `${schema_1.users.balance} - ${totalCost}`,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
            // Create tickets
            for (let i = 0; i < quantity; i++) {
                await tx.insert(schema_1.tickets).values({
                    userId: req.userId,
                    drawId,
                });
            }
            // Create notification
            await tx.insert(schema_1.notifications).values({
                userId: req.userId,
                message: `Purchased ${quantity} ticket(s) for draw #${draw.id.slice(-6)}`,
                type: 'ticket_purchase',
            });
        });
        res.json({ message: 'Tickets purchased successfully' });
    }
    catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).json({ message: 'Error purchasing tickets' });
    }
});
exports.default = router;
