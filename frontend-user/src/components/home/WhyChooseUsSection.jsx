import { motion } from 'framer-motion'
import { Truck, Shield, Headphones, RotateCcw, CreditCard, Clock } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    desc: 'On orders above ₹499',
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    desc: '100% secure checkout',
    gradient: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    desc: 'Dedicated support team',
    gradient: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-500/20',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    desc: '30-day return policy',
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-500/20',
  },
  {
    icon: CreditCard,
    title: 'Cash on Delivery',
    desc: 'Pay when you receive',
    gradient: 'from-pink-500 to-pink-600',
    shadow: 'shadow-pink-500/20',
  },
  {
    icon: Clock,
    title: 'Quick Delivery',
    desc: '2-5 business days',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/20',
  },
]

const WhyChooseUsSection = () => {
  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-gray-50 dark:bg-dark-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Why Choose Us
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            We provide the best shopping experience with quality service
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 lg:p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border overflow-hidden"
            >
              {/* Hover gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

              {/* Icon */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              {/* Text */}
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.desc}
              </p>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${feature.gradient} group-hover:w-3/4 transition-all duration-300 rounded-full`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUsSection