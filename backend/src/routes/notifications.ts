import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/db';
import { notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, req.userId))
      .orderBy(desc(notifications.createdAt));

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: any, res) => {
  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, req.userId));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

export default router;