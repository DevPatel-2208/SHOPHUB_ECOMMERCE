import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api.js'

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/contact', form)
      if (data.success) {
        setSent(true)
        setForm({ name: '', email: '', subject: '', message: '' })
        toast.success('Message sent successfully!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Message Sent!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
          <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">Send another message</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl w-fit mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Us</h1>
          <p className="text-gray-500 dark:text-gray-400">Have a question or concern? We'd love to hear from you.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
              <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows="5" placeholder="Tell us more about your inquiry..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@shophub.com' },
            { icon: MessageSquare, label: 'Response Time', value: 'Within 24 hours' },
            { icon: AlertCircle, label: 'Urgent?', value: 'Call our support line' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-dark-border text-center">
              <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContactPage
