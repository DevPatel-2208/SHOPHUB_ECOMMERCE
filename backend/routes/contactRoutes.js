import express from 'express'
import { protect, adminOnly } from '../middleware/auth.js'
import {
  submitContactMessage,
  getContactMessages,
  markMessageRead,
  markAllMessagesRead,
  deleteMessage,
} from '../controllers/contactController.js'

const router = express.Router()

router.post('/', submitContactMessage)
router.get('/', protect, adminOnly, getContactMessages)
router.patch('/:id/read', protect, adminOnly, markMessageRead)
router.patch('/read-all', protect, adminOnly, markAllMessagesRead)
router.delete('/:id', protect, adminOnly, deleteMessage)

export default router
