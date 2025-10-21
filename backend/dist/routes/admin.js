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
const cuid2_1 = require("@paralleldrive/cuid2");
const schema_2 = require("../db/schema");
const router = express_1.default.Router();
// All admin routes require authentication and admin privileges
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
// Get admin dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalDeposits, pendingDeposits, totalTickets, activeDraws] = await Promise.all([
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.users),
            db_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_1.depositRequests.amount) }).from(schema_1.depositRequests).where((0, drizzle_orm_1.eq)(schema_1.depositRequests.status, 'approved')),
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.depositRequests).where((0, drizzle_orm_1.eq)(schema_1.depositRequests.status, 'pending')),
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.tickets),
            db_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.draws).where((0, drizzle_orm_1.eq)(schema_1.draws.status, 'pending'))
        ]);
        res.json({
            totalUsers: totalUsers[0].count,
            totalDeposits: totalDeposits[0].total || '0',
            pendingDeposits: pendingDeposits[0].count,
            totalTickets: totalTickets[0].count,
            activeDraws: activeDraws[0].count
        });
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});
// Get recent activity
router.get('/activity', async (req, res) => {
    try {
        const recentActivity = await db_1.db.select()
            .from(schema_1.notifications)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))
            .limit(10);
        res.json(recentActivity);
    }
    catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ message: 'Error fetching recent activity' });
    }
});
// Get all deposit requests
// Get all deposit requests (update the select query)
router.get('/deposits', async (req, res) => {
    try {
        const deposits = await db_1.db.select({
            id: schema_1.depositRequests.id,
            userId: schema_1.depositRequests.userId,
            amount: schema_1.depositRequests.amount,
            transactionId: schema_1.depositRequests.transactionId,
            bankName: schema_1.depositRequests.bankName,
            bankMethod: schema_1.depositRequests.bankMethod,
            status: schema_1.depositRequests.status,
            createdAt: schema_1.depositRequests.createdAt,
            user: {
                id: schema_1.users.id,
                email: schema_1.users.email
            }
        })
            .from(schema_1.depositRequests)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.depositRequests.userId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.depositRequests.createdAt));
        res.json(deposits);
    }
    catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({ message: 'Error fetching deposits' });
    }
});
// Update deposit request status
router.patch('/deposits/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        // Update deposit status
        const updatedDeposits = await db_1.db.update(schema_1.depositRequests)
            .set({ status })
            .where((0, drizzle_orm_1.eq)(schema_1.depositRequests.id, id))
            .returning();
        if (updatedDeposits.length === 0) {
            return res.status(404).json({ message: 'Deposit request not found' });
        }
        const deposit = updatedDeposits[0];
        // If approved, update user balance
        if (status === 'approved') {
            await db_1.db.update(schema_1.users)
                .set({ balance: (0, drizzle_orm_1.sql) `${schema_1.users.balance} + ${deposit.amount}` })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, deposit.userId));
            // Create notification for user
            await db_1.db.insert(schema_1.notifications).values({
                userId: deposit.userId,
                message: `Your deposit of ETB ${deposit.amount} has been approved`,
                type: 'deposit'
            });
        }
        else {
            // Create notification for rejected deposit
            await db_1.db.insert(schema_1.notifications).values({
                userId: deposit.userId,
                message: `Your deposit of ETB ${deposit.amount} has been rejected`,
                type: 'deposit'
            });
        }
        res.json({ message: 'Deposit status updated successfully' });
    }
    catch (error) {
        console.error('Error updating deposit:', error);
        res.status(500).json({ message: 'Error updating deposit status' });
    }
});
// Get all draws
router.get('/draws', async (req, res) => {
    try {
        const drawsList = await db_1.db.select({
            id: schema_1.draws.id,
            drawTime: schema_1.draws.drawTime,
            status: schema_1.draws.status,
            ticketPrice: schema_1.draws.ticketPrice,
            createdAt: schema_1.draws.createdAt,
            winningTicketId: schema_1.draws.winningTicketId,
            ticketCount: (0, drizzle_orm_1.count)(schema_1.tickets.id)
        })
            .from(schema_1.draws)
            .leftJoin(schema_1.tickets, (0, drizzle_orm_1.eq)(schema_1.draws.id, schema_1.tickets.drawId))
            .groupBy(schema_1.draws.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.draws.drawTime));
        res.json(drawsList);
    }
    catch (error) {
        console.error('Error fetching draws:', error);
        res.status(500).json({ message: 'Error fetching draws' });
    }
});
// Create new draw
router.post('/draws', async (req, res) => {
    try {
        const { drawTime, ticketPrice } = req.body;
        if (!drawTime || !ticketPrice) {
            return res.status(400).json({ message: 'Draw time and ticket price are required' });
        }
        const newDraw = await db_1.db.insert(schema_1.draws).values({
            id: (0, cuid2_1.createId)(),
            drawTime: new Date(drawTime),
            ticketPrice,
            status: 'pending'
        }).returning();
        res.status(201).json({ message: 'Draw created successfully', draw: newDraw[0] });
    }
    catch (error) {
        console.error('Error creating draw:', error);
        res.status(500).json({ message: 'Error creating draw' });
    }
});
// Run draw (select winner)
// Run draw (select winner) with minimum participant check
router.post('/draws/:id/run', async (req, res) => {
    try {
        const { id } = req.params;
        // Get the draw with ticket count
        const drawResult = await db_1.db.select({
            id: schema_1.draws.id,
            drawTime: schema_1.draws.drawTime,
            status: schema_1.draws.status,
            ticketPrice: schema_1.draws.ticketPrice,
            ticketCount: (0, drizzle_orm_1.count)(schema_1.tickets.id)
        })
            .from(schema_1.draws)
            .leftJoin(schema_1.tickets, (0, drizzle_orm_1.eq)(schema_1.draws.id, schema_1.tickets.drawId))
            .where((0, drizzle_orm_1.eq)(schema_1.draws.id, id))
            .groupBy(schema_1.draws.id);
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
        // Check if minimum participant requirement is met (at least 5 participants)
        if (draw.ticketCount < 5) {
            // Get all tickets for this draw
            const ticketsList = await db_1.db.select()
                .from(schema_1.tickets)
                .where((0, drizzle_orm_1.eq)(schema_1.tickets.drawId, id));
            // Refund all participants their full ticket price
            for (const ticket of ticketsList) {
                if (ticket.userId) {
                    await db_1.db.update(schema_1.users)
                        .set({ balance: (0, drizzle_orm_1.sql) `${schema_1.users.balance} + ${draw.ticketPrice}` })
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, ticket.userId));
                    // Create notification for user about refund
                    await db_1.db.insert(schema_1.notifications).values({
                        userId: ticket.userId,
                        message: `Draw #${draw.id.slice(-6)} was cancelled due to insufficient participants (less than 5). Your ticket price of ETB ${draw.ticketPrice} has been fully refunded.`,
                        type: 'refund'
                    });
                }
            }
            // Update draw status to cancelled
            await db_1.db.update(schema_1.draws)
                .set({ status: 'cancelled' })
                .where((0, drizzle_orm_1.eq)(schema_1.draws.id, id));
            return res.json({
                message: 'Draw cancelled due to insufficient participants (less than 5). All participants have been fully refunded.',
                refundedTickets: ticketsList.length,
                refundAmount: draw.ticketPrice
            });
        }
        // Proceed with normal draw process if minimum participants are met
        const ticketsList = await db_1.db.select()
            .from(schema_1.tickets)
            .where((0, drizzle_orm_1.eq)(schema_1.tickets.drawId, id));
        // Select random winner (cryptographically secure)
        const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000 * ticketsList.length);
        const winningTicket = ticketsList[randomIndex];
        // Calculate prize (80% of total ticket sales)
        const totalSales = ticketsList.length * parseFloat(draw.ticketPrice);
        const prizeAmount = totalSales * 0.8;
        // Update draw status and set winning ticket
        await db_1.db.update(schema_1.draws)
            .set({
            status: 'completed',
            winningTicketId: winningTicket.id
        })
            .where((0, drizzle_orm_1.eq)(schema_1.draws.id, id));
        // Create winner record
        await db_1.db.insert(schema_1.winners).values({
            userId: winningTicket.userId,
            drawId: id,
            prizeAmount: prizeAmount.toString()
        });
        // Update winner's balance
        await db_1.db.update(schema_1.users)
            .set({
            balance: (0, drizzle_orm_1.sql) `${schema_1.users.balance} + ${prizeAmount}`
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, winningTicket.userId));
        // Create notification for winner
        await db_1.db.insert(schema_1.notifications).values({
            userId: winningTicket.userId,
            message: `Congratulations! You won ETB ${prizeAmount.toFixed(2)} in draw #${draw.id.slice(-6)}!`,
            type: 'winner'
        });
        // Create notifications for all participants
        const participantIds = [...new Set(ticketsList.map(ticket => ticket.userId))];
        for (const userId of participantIds) {
            if (userId !== winningTicket.userId) {
                await db_1.db.insert(schema_1.notifications).values({
                    userId,
                    message: `Draw #${draw.id.slice(-6)} has been completed. The winner has been selected. Better luck next time!`,
                    type: 'draw_completed'
                });
            }
        }
        res.json({
            message: 'Draw completed successfully',
            winner: winningTicket.userId,
            prizeAmount: prizeAmount.toFixed(2),
            totalParticipants: ticketsList.length
        });
    }
    catch (error) {
        console.error('Error running draw:', error);
        res.status(500).json({ message: 'Error running draw' });
    }
});
// Get all users
router.get('/users', async (req, res) => {
    try {
        const usersList = await db_1.db.select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            balance: schema_1.users.balance,
            isAdmin: schema_1.users.isAdmin,
            createdAt: schema_1.users.createdAt,
            ticketCount: (0, drizzle_orm_1.count)(schema_1.tickets.id)
        })
            .from(schema_1.users)
            .leftJoin(schema_1.tickets, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.tickets.userId))
            .groupBy(schema_1.users.id)
            .orderBy(schema_1.users.createdAt);
        res.json(usersList);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});
// Update user (toggle admin status)
router.patch('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { isAdmin } = req.body;
        const updatedUsers = await db_1.db.update(schema_1.users)
            .set({ isAdmin })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (updatedUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', user: updatedUsers[0] });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});
router.get('/withdraws', async (req, res) => {
    try {
        const withdraws = await db_1.db.select({
            id: schema_2.withdrawRequests.id,
            userId: schema_2.withdrawRequests.userId,
            amount: schema_2.withdrawRequests.amount,
            status: schema_2.withdrawRequests.status,
            adminNotes: schema_2.withdrawRequests.adminNotes,
            createdAt: schema_2.withdrawRequests.createdAt,
            updatedAt: schema_2.withdrawRequests.updatedAt,
            user: {
                id: schema_1.users.id,
                email: schema_1.users.email
            }
        })
            .from(schema_2.withdrawRequests)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_2.withdrawRequests.userId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_2.withdrawRequests.createdAt));
        res.json(withdraws);
    }
    catch (error) {
        console.error('Error fetching withdraws:', error);
        res.status(500).json({ message: 'Error fetching withdraws' });
    }
});
// Update withdraw request status
router.patch('/withdraws/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        // Get withdraw request
        const withdrawResult = await db_1.db.select()
            .from(schema_2.withdrawRequests)
            .where((0, drizzle_orm_1.eq)(schema_2.withdrawRequests.id, id))
            .limit(1);
        if (withdrawResult.length === 0) {
            return res.status(404).json({ message: 'Withdraw request not found' });
        }
        const withdraw = withdrawResult[0];
        // Update withdraw status
        await db_1.db.update(schema_2.withdrawRequests)
            .set({ status, adminNotes, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_2.withdrawRequests.id, id));
        // If approved, deduct from user balance
        if (status === 'approved' && withdraw.userId) {
            await db_1.db.update(schema_1.users)
                .set({ balance: (0, drizzle_orm_1.sql) `${schema_1.users.balance} - ${withdraw.amount}` })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, withdraw.userId));
            // Create notification for user
            await db_1.db.insert(schema_1.notifications).values({
                userId: withdraw.userId,
                message: `Your withdraw request of ETB ${withdraw.amount} has been approved. The funds will be sent manually.`,
                type: 'withdraw'
            });
        }
        else if (withdraw.userId) {
            // Create notification for rejected withdraw
            await db_1.db.insert(schema_1.notifications).values({
                userId: withdraw.userId,
                message: `Your withdraw request of ETB ${withdraw.amount} has been rejected. ${adminNotes || ''}`,
                type: 'withdraw'
            });
        }
        res.json({ message: 'Withdraw status updated successfully' });
    }
    catch (error) {
        console.error('Error updating withdraw:', error);
        res.status(500).json({ message: 'Error updating withdraw status' });
    }
});
exports.default = router;
