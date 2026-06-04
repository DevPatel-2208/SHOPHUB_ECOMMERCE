import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true })

contactMessageSchema.index({ isRead: 1, createdAt: -1 })

export default mongoose.model('ContactMessage', contactMessageSchema)
