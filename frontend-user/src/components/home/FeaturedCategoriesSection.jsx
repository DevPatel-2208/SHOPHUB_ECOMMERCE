import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Package } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import { SectionSkeleton } from './ReusableComponents.jsx'

const FeaturedCategoriesSection = ({ categories, isLoading }) => {
  if (isLoading) return <SectionSkeleton type="category" />

  if (!categories || categories.length === 0) return null

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-white dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Shop by Category
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
              Explore our wide range of categories
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium text-sm"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.slice(0, 6).map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={`/products?category=${cat._id}`}
                className="group relative block rounded-xl sm:rounded-2xl overflow-hidden aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-50 dark:bg-dark-card"
              >
                {cat.image ? (
                  <img
                    src={getImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5">
                    <Package className="w-10 h-10 sm:w-14 sm:h-14 text-primary/30 dark:text-primary/20" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 lg:p-4 text-white">
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base truncate group-hover:translate-y-[-2px] transition-transform">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">
                    {cat.productCount || 0} products
                  </p>
                </div>

                {/* Hover shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedCategoriesSection