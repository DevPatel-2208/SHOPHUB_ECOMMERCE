import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Eye, Tag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../redux/slices/cartSlice.js'
import { toggleWishlist } from '../../redux/slices/wishlistSlice.js'
import toast from 'react-hot-toast'
import { getImageUrl } from '../../utils/imageUrl.js'
import { getOfferLabel, comparePriceDiscount, formatCurrency } from '../../utils/offerUtils.js'

const ProductCard = ({ product, index = 0 }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const wishlistProducts = useSelector((state) => state.wishlist.products)
  const isInWishlist = wishlistProducts?.some((p) => p._id === product._id)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap()
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err || 'Failed to add')
    }
  }

  const handleToggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    try {
      await dispatch(toggleWishlist(product._id)).unwrap()
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!')
    } catch (err) {
      toast.error(err || 'Failed to update wishlist')
    }
  }

  const discount = comparePriceDiscount(product.comparePrice, product.price)
  const offer = product.offer
  const hasOffer = offer && offer.discountAmount > 0
  const displayPrice = hasOffer ? offer.discountedPrice : product.price
  const savings = hasOffer ? offer.discountAmount : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border"
    >
      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={getImageUrl(product.images?.[0]) || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = '/placeholder.svg' }}
        />

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
          {hasOffer && (
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-danger text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
              {getOfferLabel(offer)}
            </span>
          )}
          {!hasOffer && discount > 0 && (
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-danger text-white text-[10px] sm:text-xs font-bold rounded-full">
              {discount}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-warning text-white text-[10px] sm:text-xs font-bold rounded-full">
              Featured
            </span>
          )}
        </div>

        {product.outOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white text-xs sm:text-sm font-bold rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex flex-col gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleToggleWishlist}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isInWishlist
                ? 'bg-danger text-white'
                : 'bg-white dark:bg-dark-card hover:bg-danger hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isInWishlist ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product._id}`) }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs text-primary font-medium mb-1">{product.category?.name || 'Category'}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base line-clamp-2 hover:text-primary transition-colors mb-1.5 sm:mb-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                  i < Math.round(product.ratings || 0)
                    ? 'text-warning fill-warning'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500">({product.numReviews || 0})</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            {hasOffer ? (
              <>
                <span className="text-sm sm:text-lg font-bold text-danger">₹{formatCurrency(displayPrice)}</span>
                <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.price}</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">₹{product.price}</span>
                {product.comparePrice > 0 && (
                  <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.comparePrice}</span>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.outOfStock}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {hasOffer && savings > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-danger" />
            <span className="text-[10px] sm:text-xs font-medium text-danger">
              Save ₹{formatCurrency(savings)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard
