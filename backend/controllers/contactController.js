import ContactMessage from '../models/ContactMessage.js'
import AdminNotification from '../models/AdminNotification.js'
import { emitNewMessageToAdmins, emitAdminNotification } from '../sockets/socketHandler.js'

export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    const contact = await ContactMessage.create({ name, email, subject, message })

    // Create admin notification
    try {
      const adminNotif = await AdminNotification.create({
        title: 'New Contact Message',
        message: `${name} sent: ${subject}`,
        type: 'system',
        customerName: name,
        customerEmail: email,
        link: '/messages',
        metadata: { subject, contactId: contact._id },
      })

      const io = req.app ? req.app.get('io') : null
      if (io) {
        emitNewMessageToAdmins(io, contact)
        emitAdminNotification(io, adminNotif)
      }
    } catch (socketErr) {
      console.warn('Contact message notification failed:', socketErr.message)
    }

    res.status(201).json({ success: true, message: 'Message sent successfully', contact })
  } catch (error) {
    console.error('Contact message error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getContactMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const { isRead } = req.query

    const filter = {}
    if (isRead !== undefined) filter.isRead = isRead === 'true'

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
    ])

    res.json({
      success: true,
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount: await ContactMessage.countDocuments({ isRead: false }),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const markMessageRead = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    )
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    res.json({ success: true, message })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const markAllMessagesRead = async (req, res) => {
  try {
    await ContactMessage.updateMany({ isRead: false }, { isRead: true })
    res.json({ success: true, message: 'All messages marked as read' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    res.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
