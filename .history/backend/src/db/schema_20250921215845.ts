import { pgTable, varchar, integer, timestamp, boolean, decimal, text, numeric } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00'),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Deposit requests table
export const depositRequests = pgTable('deposit_requests', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 24 }).references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lottery draws table
export const draws = pgTable("draws", {
  id: varchar("id").primaryKey().notNull(),
  drawTime: timestamp("draw_time").notNull(),
  status: varchar("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // 👇 add these
  ticketPrice: numeric("ticket_price").notNull(),
  winningTicketId: varchar("winning_ticket_id"),
});

// Lottery tickets table
export const tickets = pgTable('tickets', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 24 }).references(() => users.id),
  drawId: varchar('draw_id', { length: 24 }).references(() => draws.id),
  purchasedAt: timestamp('purchased_at').defaultNow(),
});

// Winners table
export const winners = pgTable('winners', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 24 }).references(() => users.id),
  drawId: varchar('draw_id', { length: 24 }).references(() => draws.id),
  prizeAmount: decimal('prize_amount', { precision: 10, scale: 2 }).notNull(),
  announcedAt: timestamp('announced_at').defaultNow(),
});

export const withdrawRequests = pgTable('withdraw_requests', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 24 }).references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 24 }).references(() => users.id),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // deposit, ticket, winner, etc.
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});