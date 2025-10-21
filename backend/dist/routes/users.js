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
const router = express_1.default.Router();
// Get current user info
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await db_1.db.select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId));
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user[0];
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
// Get user's tickets
router.get('/tickets', auth_1.authenticateToken, async (req, res) => {
    try {
        const userTickets = await db_1.db.select({
            id: schema_1.tickets.id,
            purchasedAt: schema_1.tickets.purchasedAt,
            draw: {
                id: schema_1.draws.id,
                drawTime: schema_1.draws.drawTime,
                status: schema_1.draws.status,
                winningTicketId: schema_1.draws.winningTicketId
            }
        })
            .from(schema_1.tickets)
            .leftJoin(schema_1.draws, (0, drizzle_orm_1.eq)(schema_1.tickets.drawId, schema_1.draws.id))
            .where((0, drizzle_orm_1.eq)(schema_1.tickets.userId, req.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tickets.purchasedAt));
        res.json(userTickets);
    }
    catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});
// Get user notifications
router.get('/notifications', auth_1.authenticateToken, async (req, res) => {
    try {
        const userNotifications = await db_1.db.select()
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt));
        res.json(userNotifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});
// Mark notification as read
router.patch('/notifications/:id/read', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.db.update(schema_1.notifications)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
});
// Mark all notifications as read
router.patch('/notifications/read-all', auth_1.authenticateToken, async (req, res) => {
    try {
        await db_1.db.update(schema_1.notifications)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.userId));
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
});
exports.default = router;
