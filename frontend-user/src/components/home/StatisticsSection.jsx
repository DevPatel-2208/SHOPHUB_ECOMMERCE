import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Package, Building2, Tags, ShoppingCart, MessageSquare, Users } from 'lucide-react'

const AnimatedCounter = ({ value, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const target = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, '')) || 0
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  const displayVal = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, '')) || 0

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

const statsConfig = [
  { key: 'productCount', icon: Package, label: 'Products', suffix: '+', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
  { key: 'brandCount', icon: Building2, label: 'Brands', suffix: '+', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
  { key: 'categoryCount', icon: Tags, label: 'Categories', suffix: '+', gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
  { key: 'orderCount', icon: ShoppingCart, label: 'Orders', suffix: '+', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
  { key: 'reviewCount', icon: MessageSquare, label: 'Reviews', suffix: '+', gradient: 'from-pink-500 to-pink-600', shadow: 'shadow-pink-500/20' },
  { key: 'happyCustomers', icon: Users, label: 'Happy Customers', suffix: '+', gradient: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
]

const StatisticsSection = ({ stats }) => {
  if (!stats) return null

  return (
    <section className="relative py-10 sm:py-14 lg:py-16 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-dark dark:to-dark-card/30">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0ZjQ2ZTUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            ShopHubX in Numbers
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Our growing community of shoppers and sellers
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {statsConfig.map((stat, i) => {
            const val = stats[stat.key]
            if (!val && val !== 0) return null
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 lg:p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

                <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  <AnimatedCounter value={val} suffix={stat.suffix} />
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>

                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${stat.gradient} group-hover:w-3/4 transition-all duration-300 rounded-full`} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StatisticsSection
