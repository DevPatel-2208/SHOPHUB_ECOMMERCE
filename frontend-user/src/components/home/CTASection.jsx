import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

const CTASection = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
      {/* Gradient Background with Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-secondary">
        {/* Glow Orbs */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/15 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-white/30 rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-6 h-6 bg-white/20 rounded-full animate-float-delayed" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white/40 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs sm:text-sm font-medium text-white">Premium Shopping Experience</span>
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-[1.1]">
            Ready to Start{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Shopping?
            </span>
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of happy customers and get access to exclusive deals, fast delivery, and premium products curated just for you.
          </p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              to="/products"
              className="group relative inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-primary rounded-full font-bold text-sm sm:text-base shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Browse Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/products?sort=newest"
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-sm sm:text-base border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4" /> New Arrivals
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" className="fill-white dark:fill-dark" />
        </svg>
      </div>
    </section>
  )
}

export default CTASection