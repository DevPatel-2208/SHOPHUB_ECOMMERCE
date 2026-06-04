import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Mail, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api.js'

const NewsletterSection = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/subscribers', { email, source: 'homepage' })
      toast.success('Successfully subscribed! Welcome to our community 🎉')
      setEmail('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to subscribe. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary animate-gradient-shift">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Stay in the Loop
            </h2>
            <p className="text-sm sm:text-lg text-white/80 mb-6 sm:mb-8 max-w-lg mx-auto">
              Subscribe to get exclusive offers, new arrivals, and insider-only discounts delivered to your inbox.
            </p>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <div className="relative flex-1 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white/15 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 rounded-xl outline-none focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 text-sm sm:text-base"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-black/10 whitespace-nowrap text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Subscribing...
                  </div>
                ) : (
                  <>
                    Subscribe <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Trust indicators */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-sm text-white/60 mt-4 sm:mt-6 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-green-300" />
              No spam, unsubscribe anytime
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default NewsletterSection