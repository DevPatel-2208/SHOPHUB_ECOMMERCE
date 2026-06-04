import { motion } from 'framer-motion'
import { Tag, Clock, Zap } from 'lucide-react'
import { getOfferLabel, getOfferTag, formatCurrency } from '../../utils/offerUtils.js'

export { getOfferLabel, getDiscountText, getOfferTag } from '../../utils/offerUtils.js'

export const OfferBadge = ({ offer, size = 'sm', className = '' }) => {
  if (!offer || !offer.discountAmount > 0) return null
  const label = getOfferLabel(offer)
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-danger to-red-600 text-white shadow-lg ${sizes[size]} ${className}`}
    >
      <Zap className={`${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
      {label}
    </motion.span>
  )
}

export const OfferPriceDisplay = ({ originalPrice, offer, comparePrice }) => {
  const hasOffer = offer && offer.discountAmount > 0
  const displayPrice = hasOffer ? offer.discountedPrice : originalPrice
  const savings = hasOffer ? offer.discountAmount : 0
  const showComparePrice = comparePrice > originalPrice

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
        <span className={`font-bold ${hasOffer ? 'text-danger' : 'text-gray-900 dark:text-white'} ${'text-sm sm:text-lg'}`}>
          ₹{formatCurrency(displayPrice)}
        </span>
        {(hasOffer || showComparePrice) && (
          <span className="text-xs sm:text-sm text-gray-400 line-through">
            ₹{formatCurrency(hasOffer ? originalPrice : comparePrice)}
          </span>
        )}
        {savings > 0 && (
          <span className="text-[10px] sm:text-xs font-semibold text-danger bg-danger/10 px-1.5 py-0.5 rounded-full">
            {getOfferTag(offer)}
          </span>
        )}
      </div>
      {savings > 0 && (
        <div className="flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-danger" />
          <span className="text-[10px] sm:text-xs font-medium text-danger">
            Save ₹{formatCurrency(savings)}
          </span>
        </div>
      )}
      {offer?.endDate && (
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock className="w-2.5 h-2.5" />
          <span>Offer ends {new Date(offer.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      )}
    </div>
  )
}

export default OfferBadge
