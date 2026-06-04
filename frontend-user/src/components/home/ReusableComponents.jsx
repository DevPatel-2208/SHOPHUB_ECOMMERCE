import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getOfferLabel } from '../../utils/offerUtils.js'

export const SectionSkeleton = ({ type = 'grid', count = 8 }) => {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'category') {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    )
  }

  if (type === 'banner') {
    return (
      <div className="h-[300px] sm:h-[420px] md:h-[500px] lg:h-[560px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
    )
  }

  if (type === 'testimonial') {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-[320px] sm:min-w-[380px] bg-white dark:bg-dark-card rounded-2xl p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}

export const StarRating = ({ rating = 0, size = 'sm', showValue = false }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }
  const starSize = sizes[size] || sizes.sm

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starSize} ${
            star <= Math.round(rating)
              ? 'text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {showValue && (
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export const SectionTitle = ({ title, subtitle, action, light = false }) => (
  <div className="flex items-end justify-between mb-6 sm:mb-8">
    <div>
      <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${light ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-sm mt-1 ${light ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} hidden sm:block`}>
          {subtitle}
        </p>
      )}
    </div>
    {action && (
      <Link
        to={action.path}
        className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium text-sm whitespace-nowrap"
      >
        {action.label} <ChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
)

export const DiscountBadge = ({ discount, offer }) => {
  if (offer && offer.discountAmount > 0) {
    return (
      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg shadow-red-500/20">
        {getOfferLabel(offer)}
      </span>
    )
  }
  if (!discount || discount <= 0) return null
  return (
    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg shadow-red-500/20">
      {discount}% OFF
    </span>
  )
}

export const StockBadge = ({ outOfStock, stock, lowStockThreshold = 5 }) => {
  if (outOfStock || stock <= 0) {
    return (
      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-full">
        Out of Stock
      </span>
    )
  }
  if (stock <= lowStockThreshold) {
    return (
      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-semibold rounded-full">
        Only {stock} left
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-semibold rounded-full">
      In Stock
    </span>
  )
}