import { motion } from 'framer-motion'
import { Truck, Shield, Brain, HeadphonesIcon, Sparkles, Clock, BadgeCheck, RefreshCcw } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping on orders above ₹499. Delivery in 24-48 hours across India.',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: '100% secure transactions with encrypted payment gateway and buyer protection.',
    gradient: 'from-emerald-500 to-green-500',
    shadow: 'shadow-emerald-500/20',
  },
  {
    icon: Brain,
    title: 'AI Recommendations',
    description: 'Smart product suggestions powered by machine learning based on your preferences.',
    gradient: 'from-purple-500 to-pink-500',
    shadow: 'shadow-purple-500/20',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Round-the-clock customer support via chat, email, and phone. Always here to help.',
    gradient: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-500/20',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const FeaturesSection = () => {
  return (
    <section className="relative py-12 sm:py-16 lg:py-24 bg-white dark:bg-dark overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border border-primary/10 dark:border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary dark:text-primary-light">Why Choose Us</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Everything You Need
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400">
            We provide the best shopping experience with premium features designed for your convenience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative"
            >
              {/* Glassmorphism Card */}
              <div className="relative h-full p-6 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-dark-card/50 border border-gray-100 dark:border-dark-border/50 hover:border-gray-200 dark:hover:border-dark-border transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/20 overflow-hidden backdrop-blur-sm">
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.06] transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`relative mb-5 sm:mb-6 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center shadow-lg ${feature.shadow} group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Extra Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 sm:mt-14 lg:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8"
        >
          {[
            { icon: BadgeCheck, text: 'Verified Quality' },
            { icon: RefreshCcw, text: 'Easy Returns' },
            { icon: Clock, text: 'Same Day Dispatch' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturesSection