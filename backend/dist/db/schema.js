"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = exports.withdrawRequests = exports.winners = exports.tickets = exports.draws = exports.depositRequests = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const cuid2_1 = require("@paralleldrive/cuid2");
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique().notNull(),
    password: (0, pg_core_1.varchar)('password', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    balance: (0, pg_core_1.decimal)('balance', { precision: 10, scale: 2 }).default('0.00'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// Deposit requests table
// Deposit requests table
exports.depositRequests = (0, pg_core_1.pgTable)('deposit_requests', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 24 }).references(() => exports.users.id),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    // Remove imageUrl and add new fields:
    transactionId: (0, pg_core_1.varchar)('transaction_id', { length: 100 }).notNull(),
    bankName: (0, pg_core_1.varchar)('bank_name', { length: 100 }).notNull(),
    bankMethod: (0, pg_core_1.varchar)('bank_method', { length: 50 }).notNull(), // e.g., 'telebirr', 'cbe', 'awash'
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// Lottery draws table
exports.draws = (0, pg_core_1.pgTable)("draws", {
    id: (0, pg_core_1.varchar)("id").primaryKey().notNull(),
    drawTime: (0, pg_core_1.timestamp)("draw_time").notNull(),
    status: (0, pg_core_1.varchar)("status").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    // 👇 add these
    ticketPrice: (0, pg_core_1.numeric)("ticket_price").notNull(),
    winningTicketId: (0, pg_core_1.varchar)("winning_ticket_id"),
});
// Lottery tickets table
exports.tickets = (0, pg_core_1.pgTable)('tickets', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 24 }).references(() => exports.users.id),
    drawId: (0, pg_core_1.varchar)('draw_id', { length: 24 }).references(() => exports.draws.id),
    purchasedAt: (0, pg_core_1.timestamp)('purchased_at').defaultNow(),
});
// Winners table
exports.winners = (0, pg_core_1.pgTable)('winners', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 24 }).references(() => exports.users.id),
    drawId: (0, pg_core_1.varchar)('draw_id', { length: 24 }).references(() => exports.draws.id),
    prizeAmount: (0, pg_core_1.decimal)('prize_amount', { precision: 10, scale: 2 }).notNull(),
    announcedAt: (0, pg_core_1.timestamp)('announced_at').defaultNow(),
});
exports.withdrawRequests = (0, pg_core_1.pgTable)('withdraw_requests', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 24 }).references(() => exports.users.id),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'), // pending, approved, rejected
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// Notifications table
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.varchar)('id', { length: 24 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 24 }).references(() => exports.users.id),
    message: (0, pg_core_1.text)('message').notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // deposit, ticket, winner, etc.
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
