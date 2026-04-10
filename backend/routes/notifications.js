import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
} from '../controllers/notificationController.js'

const router = express.Router()

router.get('/', protect, getNotifications)
router.patch('/:id/read', protect, markAsRead)
router.patch('/read-all', protect, markAllAsRead)
router.delete('/:id', protect, deleteNotification)
router.post('/', protect, createNotification)

export default router
