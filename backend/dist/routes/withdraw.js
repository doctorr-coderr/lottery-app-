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
const MIN_WITHDRAW_AMOUNT = 40; // ETB
// Create withdraw request
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || parseFloat(amount) < MIN_WITHDRAW_AMOUNT) {
            return res.status(400).json({ message: `Minimum withdraw amount is ETB ${MIN_WITHDRAW_AMOUNT}` });
        }
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.userId)).limit(1);
        if (!user.length)
            return res.status(404).json({ message: 'User not found' });
        const userBalance = parseFloat(user[0].balance || '0');
        if (userBalance < parseFloat(amount))
            return res.status(400).json({ message: 'Insufficient balance' });
        const withdraw = await db_1.db.insert(schema_1.withdrawRequests).values({
            userId: req.userId,
            amount,
            status: 'pending'
        }).returning();
        await db_1.db.insert(schema_1.notifications).values({
            userId: req.userId,
            message: `Withdraw request of ETB ${amount} submitted for review`,
            type: 'withdraw'
        });
        res.status(201).json({ message: 'Withdraw request submitted successfully', withdraw: withdraw[0] });
    }
    catch (error) {
        console.error('Withdraw creation error:', error);
        res.status(500).json({ message: 'Error creating withdraw request' });
    }
});
// User withdraw history
router.get('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        const withdraws = await db_1.db.select()
            .from(schema_1.withdrawRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.withdrawRequests.userId, req.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.withdrawRequests.createdAt));
        res.json(withdraws);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching withdraw history' });
    }
});
exports.default = router;
