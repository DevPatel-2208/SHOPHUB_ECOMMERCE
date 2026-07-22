import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import {
  Star, Heart, ShoppingCart, Share2, Truck, Shield, RotateCcw,
  ChevronRight, Minus, Plus, Clock, Zap, Check, X, ChevronLeft,
  ChevronDown, ThumbsUp, MessageSquare,
  TrendingUp, Package, BadgePercent,
  ArrowRight, AlertCircle, Info,
  Play, Maximize2
} from 'lucide-react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { addToCart } from '../../redux/slices/cartSlice.js'
import { toggleWishlist } from '../../redux/slices/wishlistSlice.js'
import { OfferBadge, OfferPriceDisplay } from '../../components/user/OfferBadge.jsx'
import { getOfferLabel, getDiscountText, formatCurrency } from '../../utils/offerUtils.js'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import toast from 'react-hot-toast'
import ProductCard from '../../components/user/ProductCard.jsx'

// ─── STAGGER VARIANTS ───
const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

const shimmer = `before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`

// ─── Skeleton Loader ───
const SkeletonBlock = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg ${shimmer} ${className}`} />
)

const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      <div className="lg:w-[55%]">
        <SkeletonBlock className="aspect-square rounded-2xl" />
        <div className="flex gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="w-20 h-20 rounded-xl" />)}
        </div>
      </div>
      <div className="lg:w-[45%] space-y-5">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-3/4" />
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    </div>
  </div>
)

// ─── IMAGE MAGNIFIER ───
const ImageMagnifier = ({ src, alt, onZoom }) => {
  const [zoomed, setZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const imgRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    if (!imgRef.current) return
    const { left, top, width, height } = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setPosition({ x, y })
  }, [])

  return (
    <div
      ref={imgRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair group"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => { setZoomed(false); onZoom?.(false) }}
      onMouseMove={handleMouseMove}
    >
      <LazyLoadImage
        src={getImageUrl(src)}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = '/placeholder.svg' }}
        effect="opacity"
      />
      {zoomed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${getImageUrl(src)})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: '200%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  )
}

// ─── FULLSCREEN IMAGE MODAL ───
const FullscreenModal = ({ images, currentIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [currentIndex, images.length, onClose, onNavigate])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex - 1 + images.length) % images.length) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex + 1) % images.length) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl max-h-[90vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={getImageUrl(images[currentIndex])}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </motion.div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── FLASH SALE TIMER ───
const FlashSaleTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!endTime) return
    const update = () => {
      const diff = new Date(endTime) - new Date()
      if (diff <= 0) { setExpired(true); return }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ hours, minutes, seconds })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  if (!endTime || expired) return null

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800/50">
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Offer ends in</span>
      </div>
      <div className="flex items-center gap-1 font-mono">
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[22px] text-center">{pad(timeLeft.hours)}</span>
        <span className="text-red-500 font-bold text-xs">:</span>
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[22px] text-center">{pad(timeLeft.minutes)}</span>
        <span className="text-red-500 font-bold text-xs">:</span>
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[22px] text-center">{pad(timeLeft.seconds)}</span>
      </div>
    </div>
  )
}

// ─── OFFER COUNTDOWN ───
const OfferCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!endDate) return
    const update = () => {
      const diff = new Date(endDate) - new Date()
      if (diff <= 0) { setExpired(true); return }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft({ days, hours, minutes })
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [endDate])

  if (!endDate || expired || !timeLeft) return null

  return (
    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-orange-600 dark:text-orange-400">
      <Clock className="w-3 h-3" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours}h {timeLeft.minutes}m left
      </span>
    </div>
  )
}

// ─── OFFER CARD ───
const OfferCard = ({ offer }) => {
  const discountLabel = getOfferLabel(offer)

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 cursor-pointer group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-start gap-3">
        <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl shadow-sm shrink-0">
          <BadgePercent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-indigo-700 dark:text-indigo-300">{discountLabel}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{offer.description || offer.title}</p>
          {offer.minOrderAmount > 0 && (
            <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">Min. order ₹{offer.minOrderAmount}</p>
          )}
          {offer.endDate && <OfferCountdown endDate={offer.endDate} />}
        </div>
        <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
      </div>
    </motion.div>
  )
}

// ─── RATING DISTRIBUTION ───
const RatingDistribution = ({ distribution, total }) => {
  const stars = [5, 4, 3, 2, 1]
  return (
    <div className="space-y-2">
      {stars.map((star) => {
        const count = distribution[star] || 0
        const percentage = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400 w-8 shrink-0">{star}</span>
            <Star className="w-3.5 h-3.5 text-warning fill-warning shrink-0" />
            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-warning to-orange-400 rounded-full"
              />
            </div>
            <span className="text-gray-500 dark:text-gray-400 w-8 text-right text-xs">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── REVIEW CARD ───
const ReviewCard = ({ review, onHelpful }) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful || 0)
  const [helpfulClicked, setHelpfulClicked] = useState(false)

  const handleHelpful = async () => {
    if (helpfulClicked) return
    try {
      await api.post(`/reviews/${review._id}/helpful`)
      setHelpfulCount((c) => c + 1)
      setHelpfulClicked(true)
      toast.success('Marked as helpful!')
    } catch {
      // silent
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-5 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {review.user?.avatar ? (
              <img src={getImageUrl(review.user.avatar)} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              review.user?.name?.charAt(0) || 'U'
            )}
            {review.isVerifiedPurchase && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-secondary text-white rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{review.user?.name || 'Anonymous'}</p>
              {review.isVerifiedPurchase && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < review.rating ? 'text-warning fill-warning' : 'text-gray-300 dark:text-gray-600'}`}
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-1">
                {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{review.title}</h4>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{review.comment}</p>

      {review.images?.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img)}
              alt="Review"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-100 dark:border-dark-border shrink-0"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ))}
        </div>
      )}

      {review.adminReply && (
        <div className="ml-4 sm:ml-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-2 border-primary mt-3">
          <p className="text-xs font-semibold text-primary mb-1">Seller Response</p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{review.adminReply}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
        <button
          onClick={handleHelpful}
          disabled={helpfulClicked}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            helpfulClicked
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${helpfulClicked ? 'fill-primary' : ''}`} />
          <span>Helpful ({helpfulCount})</span>
        </button>
      </div>
    </motion.div>
  )
}

// ─── REVIEW FORM ───
const ReviewForm = ({ productId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const reviewFileRef = useRef(null)

  const handleReviewImages = (files) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024
    const selected = Array.from(files).filter(f => {
      if (!validTypes.includes(f.type)) { toast.error(`${f.name}: invalid type`); return false }
      if (f.size > maxSize) { toast.error(`${f.name}: must be < 5MB`); return false }
      return true
    })
    setReviewImages(prev => [...prev, ...selected])
    setImagePreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))])
  }

  const removeReviewImage = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx])
    setReviewImages(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadReviewFiles = async () => {
    if (!reviewImages.length) return []
    setUploadingImages(true)
    const formData = new FormData()
    reviewImages.forEach(f => formData.append('images', f))
    try {
      const { data } = await api.post('/admin/upload/images', formData)
      return data.urls || []
    } catch {
      toast.error('Some images failed to upload')
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { toast.error('Please select a rating'); return }
    if (!comment.trim()) { toast.error('Please write a review'); return }
    setSubmitting(true)
    try {
      const uploadedUrls = await uploadReviewFiles()
      await api.post('/reviews', { product: productId, rating, title, comment, images: uploadedUrls })
      toast.success('Review submitted successfully!')
      reviewImages.forEach(f => URL.revokeObjectURL(URL.createObjectURL(f)))
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="p-5 sm:p-6 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border"
    >
      <h3 className="font-bold text-lg mb-4">Write a Review</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          maxLength={100}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Your Review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience with this product..."
          rows={4}
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>

      {/* Review Images */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Add Photos</label>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeReviewImage(idx)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => reviewFileRef.current?.click()}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-primary hover:bg-gray-50 dark:hover:bg-dark-hover transition-all"
          >
            <Plus size={18} className="text-gray-400" />
          </button>
        </div>
        <input
          ref={reviewFileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { handleReviewImages(e.target.files); e.target.value = '' }}
          className="hidden"
        />
        <p className="text-xs text-gray-400 mt-1">Upload up to 5 images (JPEG, PNG, WebP, max 5MB each)</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploadingImages}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {(submitting || uploadingImages) && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          )}
          {submitting ? 'Submitting...' : uploadingImages ? 'Uploading images...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  )
}

// ─── SHARE MODAL ───
const ShareModal = ({ product, onClose }) => {
  const shareUrl = window.location.href
  const shareText = `Check out ${product.name} on our store!`

  const shareLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, color: 'bg-green-500' },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: 'bg-blue-600' },
    { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, color: 'bg-sky-500' },
    { name: 'Email', url: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, color: 'bg-gray-500' },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Share Product</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} text-white p-3 rounded-xl flex flex-col items-center gap-1.5 hover:scale-105 transition-transform`}
              >
                <Share2 className="w-5 h-5" />
                <span className="text-[10px] font-medium">{link.name}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-xs text-gray-600 dark:text-gray-400 outline-none truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════
// MAIN PRODUCT DETAIL PAGE COMPONENT
// ═══════════════════════════════════════════════════

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const wishlistProducts = useSelector((state) => state.wishlist.products)

  // ─── State ───
  const [product, setProduct] = useState(null)
  const [reviewsData, setReviewsData] = useState({ items: [], total: 0, page: 1, totalPages: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [offers, setOffers] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [alsoBought, setAlsoBought] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewSort, setReviewSort] = useState('-createdAt')
  const [reviewFilterRating, setReviewFilterRating] = useState(0)
  const [reviewPage, setReviewPage] = useState(1)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)

  const isInWishlist = product ? wishlistProducts?.some((p) => p._id === product._id) : false

  // ─── Fetch Product Data ───
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const res = await api.get(`/products/${id}/details?page=1&limit=5`)
        const data = res.data
        setProduct(data.product)
        setReviewsData(data.reviews)
        setOffers(data.offers || [])
        setRelatedProducts(data.relatedProducts || [])
        setAlsoBought(data.alsoBought || [])
        setSelectedImage(0)
        setQuantity(1)
        setActiveTab('description')
        setReviewPage(1)
        setShowReviewForm(false)
      } catch (err) {
        toast.error('Failed to load product details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [id])

  // ─── Fetch reviews with filters ───
  const fetchReviews = useCallback(async (page = 1, sort = reviewSort, rating = reviewFilterRating) => {
    setLoadingReviews(true)
    try {
      let url = `/reviews/product/${id}?page=${page}&limit=5&sort=${sort}`
      if (rating > 0) url += `&rating=${rating}`
      const res = await api.get(url)
      setReviewsData((prev) => ({
        ...prev,
        items: res.data.reviews,
        total: res.data.total,
        page: res.data.currentPage || page,
        totalPages: res.data.totalPages,
        distribution: res.data.distribution || prev.distribution,
      }))
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoadingReviews(false)
    }
  }, [id, reviewSort, reviewFilterRating])

  useEffect(() => {
    if (activeTab === 'reviews' && product) {
      fetchReviews(reviewPage, reviewSort, reviewFilterRating)
    }
  }, [activeTab, reviewPage, reviewSort, reviewFilterRating, product, fetchReviews])

  // ─── Handlers ───
  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return }
    setAddingToCart(true)
    try {
      await dispatch(addToCart({ productId: id, quantity })).unwrap()
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err || 'Failed to add')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return }
    navigate('/checkout', {
      state: {
        directBuy: {
          product,
          quantity,
          selectedVariant: null,
        },
      },
    })
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login to add to wishlist'); return }
    try {
      await dispatch(toggleWishlist(product._id)).unwrap()
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!')
    } catch (err) {
      toast.error(err || 'Failed to update wishlist')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }) } catch { /* silent */ }
    } else {
      setShowShareModal(true)
    }
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    fetchReviews(1, reviewSort, reviewFilterRating)
  }

  // ─── Computed ───
  const discount = product && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  // Compute best applicable offer from offers list
  const bestOffer = useMemo(() => {
    if (!offers || !offers.length || !product) return null
    const now = new Date()
    const valid = offers.filter(o =>
      o.isActive !== false &&
      new Date(o.startDate) <= now &&
      new Date(o.endDate) >= now
    )
    // Pick the highest priority offer that gives max discount
    let best = null
    let bestDiscount = 0
    for (const offer of valid) {
      let discountAmt = 0
      if (offer.discountType === 'percentage') {
        discountAmt = (product.price * offer.discountValue) / 100
        if (offer.maxDiscount) discountAmt = Math.min(discountAmt, offer.maxDiscount)
      } else if (offer.discountType === 'flat' || offer.discountType === 'fixed') {
        discountAmt = offer.discountValue
      }
      if (discountAmt > bestDiscount) {
        bestDiscount = discountAmt
        best = {
          _id: offer._id,
          title: offer.title,
          description: offer.description,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          maxDiscount: offer.maxDiscount,
          discountAmount: Math.round(discountAmt * 100) / 100,
          discountedPrice: Math.round(Math.max(0, product.price - discountAmt) * 100) / 100,
          endDate: offer.endDate,
          minOrderAmount: offer.minOrderAmount,
        }
      }
    }
    return best
  }, [offers, product])

  const isLowStock = product && product.stock > 0 && product.stock <= (product.lowStockThreshold || 5)
  const inStock = product && product.stock > 0 && !product.outOfStock

  // ─── Loading ───
  if (isLoading) return <ProductDetailSkeleton />
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400">Product not found</h2>
        <Link to="/products" className="mt-4 inline-block px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
          Browse Products
        </Link>
      </div>
    </div>
  )

  const tabs = [
    { key: 'description', label: 'Description', icon: MessageSquare },
    { key: 'specifications', label: 'Specifications', icon: Info },
    { key: 'reviews', label: `Reviews (${reviewsData.total || product.numReviews})`, icon: Star },
    { key: 'shipping', label: 'Shipping & Returns', icon: Truck },
    { key: 'faqs', label: 'FAQs', icon: AlertCircle },
  ]

  const allImages = product.images?.length > 0 ? product.images : ['/placeholder.svg']

  return (
    <div className="min-h-screen bg-white dark:bg-dark">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 h-10 sm:h-12 overflow-hidden">
            <Link to="/" className="hover:text-primary whitespace-nowrap transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <Link to="/products" className="hover:text-primary whitespace-nowrap transition-colors">Products</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            {product.category && (
              <>
                <Link to={`/products?category=${product.category._id}`} className="hover:text-primary whitespace-nowrap transition-colors hidden sm:block">
                  {product.category.name}
                </Link>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 hidden sm:block" />
              </>
            )}
            <span className="text-gray-900 dark:text-white truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* ═══ MAIN GRID ═══ */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="flex flex-col lg:flex-row gap-6 lg:gap-10 xl:gap-14"
        >
          {/* ═══ LEFT: IMAGE GALLERY ═══ */}
          <motion.div variants={fadeUp} className="lg:w-[55%] lg:sticky lg:top-24 lg:self-start">
            <div className="relative bg-gray-50 dark:bg-dark-card rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border group">
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden">
                <ImageMagnifier
                  src={allImages[selectedImage]}
                  alt={product.name}
                  onZoom={setImageZoomed}
                />

                {/* Offer Badge */}
                {bestOffer && bestOffer.discountAmount > 0 && (
                  <div className="absolute top-3 left-3 z-10">
                    <OfferBadge offer={bestOffer} size="md" />
                  </div>
                )}
                {!bestOffer && discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-gradient-to-r from-danger to-red-600 text-white text-sm font-bold rounded-full shadow-lg">
                    {discount}% OFF
                  </span>
                )}

                {/* Trending Badge */}
                {product.isFeatured && (
                  <span className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-gradient-to-r from-warning to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Trending
                  </span>
                )}

                {/* Top right action buttons */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => { setFullscreenIndex(selectedImage); setFullscreenOpen(true) }}
                    className="w-9 h-9 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-dark-card transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Video badge */}
                {product.video && (
                  <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    <Play className="w-3.5 h-3.5 fill-white" /> Video Available
                  </div>
                )}

                {/* Image counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                    {selectedImage + 1}/{allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails + Navigation */}
              {allImages.length > 1 && (
                <div className="relative px-3 pb-3 pt-2">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === i
                            ? 'border-primary ring-2 ring-primary/30 shadow-md'
                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/placeholder.svg' }}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Thumbnail nav arrows */}
                  {allImages.length > 4 && (
                    <>
                      <button
                        onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 dark:bg-dark-card/90 rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-dark-card transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImage(Math.min(allImages.length - 1, selectedImage + 1))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 dark:bg-dark-card/90 rounded-full flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-dark-card transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Trust badges below gallery */}
            <div className="hidden lg:grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Truck, text: 'Free Delivery', sub: 'Orders above ₹499' },
                { icon: RotateCcw, text: 'Easy Returns', sub: '7 days return policy' },
                { icon: Shield, text: 'Secure Payment', sub: '100% secure' },
              ].map((feat) => (

                <div key={feat.text} className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                    <feat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{feat.text}</p>
                    <p className="text-[10px] text-gray-500">{feat.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ RIGHT: PRODUCT INFO ═══ */}
          <motion.div variants={fadeUp} className="lg:w-[45%] xl:w-[42%]">
            {/* Brand & Category */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {product.brand && (
                <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-full">
                  {typeof product.brand === 'object' ? product.brand.name : product.brand}
                </span>
              )}
              {product.category && (
                <Link
                  to={`/products?category=${product.category._id}`}
                  className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              {product.sku && (
                <span className="text-[10px] text-gray-400">SKU: {product.sku}</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating Summary */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 rounded-lg">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-bold text-sm text-warning">
                  {(reviewsData.total > 0
                    ? Object.entries(reviewsData.distribution).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / reviewsData.total
                    : product.ratings || 0
                  ).toFixed(1)}
                </span>
              </div>
              <button
                onClick={() => { setActiveTab('reviews'); setReviewFilterRating(0) }}
                className="text-xs sm:text-sm text-gray-500 hover:text-primary transition-colors"
              >
                ({reviewsData.total || product.numReviews || 0} reviews)
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-xs sm:text-sm text-gray-500">
                {reviewsData.total > 0
                  ? `${Object.values(reviewsData.distribution).reduce((a, b) => a + b, 0)} verified ratings`
                  : `${product.numReviews || 0} ratings`}
              </span>
            </div>

            {/* Price Section */}
            <div className="mb-4">
              {bestOffer && bestOffer.discountAmount > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-danger">
                      ₹{Number(bestOffer.discountedPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-400 line-through">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs sm:text-sm font-bold rounded-full">
                      Save ₹{Number(bestOffer.discountAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                      {getOfferLabel(bestOffer)} {bestOffer.title ? `• ${bestOffer.title}` : ''}
                    </span>
                  </div>
                  {product.comparePrice > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      MRP <span className="line-through">₹{Number(product.comparePrice).toLocaleString('en-IN')}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </span>
                    {product.comparePrice > 0 && (
                      <>
                        <span className="text-lg sm:text-xl text-gray-400 line-through">
                          ₹{product.comparePrice?.toLocaleString('en-IN')}
                        </span>
                        {discount > 0 && (
                          <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs sm:text-sm font-bold rounded-full">
                            Save ₹{(product.comparePrice - product.price)?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Flash Sale Timer */}
            {product.flashSaleEnd && <div className="mb-4"><FlashSaleTimer endTime={product.flashSaleEnd} /></div>}

            {/* Offers */}
            {offers.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <BadgePercent className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-xs sm:text-sm">Available Offers</span>
                </div>
                <div className="grid gap-2">
                  {offers.slice(0, expandedSection === 'offers' ? offers.length : 2).map((offer, i) => (
                    <OfferCard key={offer._id || i} offer={offer} />
                  ))}
                  {offers.length > 2 && (
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'offers' ? null : 'offers')}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {expandedSection === 'offers' ? 'Show less' : `Show ${offers.length - 2} more offers`}
                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedSection === 'offers' ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stock & Delivery */}
            <div className="space-y-2 mb-4 p-4 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${inStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-sm font-semibold ${inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {product.sku && <span className="text-[10px] text-gray-400">SKU: {product.sku}</span>}
              </div>

              {inStock && (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Package className="w-3.5 h-3.5" />
                    <span>{product.stock} units available</span>
                  </div>

                  {isLowStock && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Only {product.stock} left in stock — order soon</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>Free delivery by <strong className="text-gray-700 dark:text-gray-300">
                      {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </strong></span>
                  </div>

                  {product.weight > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Package className="w-3.5 h-3.5" />
                      <span>Weight: {product.weight}g</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-3 mb-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Qty:</span>
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-dark-card transition-colors disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    disabled={quantity >= (product.stock || 99)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-dark-card transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || addingToCart}
                  className="flex-1 py-3.5 sm:py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="flex-1 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Buy Now
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isInWishlist
                      ? 'border-danger text-danger bg-danger/5 hover:bg-danger/10'
                      : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-card'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-danger text-danger' : ''}`} />
                  {isInWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>
                <button
                  onClick={handleShare}
                  className="py-2.5 px-4 rounded-xl border-2 border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-card transition-all flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Share</span>
                </button>
              </div>
            </div>

            {/* ═══ TABS ═══ */}
            <div className="border-b border-gray-200 dark:border-dark-border">
              <div className="flex gap-0 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 sm:px-4 lg:px-5 py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="detailTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-light"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-4 sm:py-6">
              <AnimatePresence mode="wait">
                {/* ─── Description Tab ─── */}
                {activeTab === 'description' && (
                  <motion.div
                    key="desc"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {product.description || 'No description available.'}
                      </p>
                    </div>
                    {product.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {product.tags.map((tag, i) => (
                          <Link
                            key={i}
                            to={`/search?q=${tag}`}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ─── Specifications Tab ─── */}
                {activeTab === 'specifications' && (
                  <motion.div
                    key="specs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {product.specifications?.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-dark-border rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
                        {product.specifications.map((spec, i) => (
                          <div
                            key={i}
                            className={`flex justify-between py-3 px-4 text-sm ${
                              i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/30' : ''
                            }`}
                          >
                            <span className="text-gray-500 dark:text-gray-400 font-medium">{spec.key || spec.specKey?.key || spec.specKey?.label}</span>
                            <span className="text-gray-900 dark:text-white font-semibold text-right max-w-[60%]">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8 text-sm">No specifications available</p>
                    )}
                  </motion.div>
                )}

                {/* ─── Reviews Tab ─── */}
                {activeTab === 'reviews' && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Review Summary */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-6 p-5 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                      {/* Average rating */}
                      <div className="text-center sm:w-40 shrink-0">
                        <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                          {reviewsData.total > 0
                            ? (Object.entries(reviewsData.distribution).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / reviewsData.total).toFixed(1)
                            : product.ratings?.toFixed(1) || '0.0'}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 mt-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(reviewsData.total > 0
                                  ? Object.entries(reviewsData.distribution).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / reviewsData.total
                                  : product.ratings || 0)
                                  ? 'text-warning fill-warning'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{reviewsData.total || product.numReviews || 0} reviews</p>
                      </div>

                      {/* Rating Distribution */}
                      <div className="flex-1 min-w-0">
                        <RatingDistribution
                          distribution={reviewsData.total > 0 ? reviewsData.distribution : {}}
                          total={reviewsData.total || product.numReviews || 1}
                        />
                      </div>
                    </div>

                    {/* Review Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Write a Review
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Rating filter */}
                        <div className="flex items-center gap-1">
                          {[0, 5, 4, 3, 2, 1].map((r) => (
                            <button
                              key={r}
                              onClick={() => { setReviewFilterRating(r); setReviewPage(1) }}
                              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                reviewFilterRating === r
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              {r === 0 ? 'All' : r === 5 ? '5★' : `${r}★`}
                            </button>
                          ))}
                        </div>

                        {/* Sort */}
                        <select
                          value={reviewSort}
                          onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1) }}
                          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-dark-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="-createdAt">Most Recent</option>
                          <option value="-helpful">Most Helpful</option>
                          <option value="-rating">Highest Rated</option>
                          <option value="rating">Lowest Rated</option>
                        </select>
                      </div>
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <div className="mb-6">
                        <ReviewForm
                          productId={id}
                          onSuccess={handleReviewSuccess}
                          onCancel={() => setShowReviewForm(false)}
                        />
                      </div>
                    )}

                    {/* Review List */}
                    {loadingReviews ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 bg-gray-50 dark:bg-dark-card rounded-xl animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                              <SkeletonBlock className="w-10 h-10 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <SkeletonBlock className="h-4 w-32" />
                                <SkeletonBlock className="h-3 w-20" />
                              </div>
                            </div>
                            <SkeletonBlock className="h-4 w-full mb-2" />
                            <SkeletonBlock className="h-4 w-3/4" />
                          </div>
                        ))}
                      </div>
                    ) : reviewsData.items.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-10"
                      >
                        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-1">No reviews yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Be the first to review this product</p>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                        >
                          Write a Review
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {reviewsData.items.map((review) => (
                          <ReviewCard key={review._id} review={review} />
                        ))}

                        {/* Pagination */}
                        {reviewsData.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                              onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                              disabled={reviewPage <= 1}
                              className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(reviewsData.totalPages, 5) }, (_, i) => {
                              const start = Math.max(1, Math.min(reviewPage - 2, reviewsData.totalPages - 4))
                              const pageNum = start + i
                              if (pageNum > reviewsData.totalPages) return null
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setReviewPage(pageNum)}
                                  className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${
                                    reviewPage === pageNum
                                      ? 'bg-primary text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                            <button
                              onClick={() => setReviewPage((p) => Math.min(reviewsData.totalPages, p + 1))}
                              disabled={reviewPage >= reviewsData.totalPages}
                              className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ─── Shipping Tab ─── */}
                {activeTab === 'shipping' && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {[
                      {
                        icon: Truck,
                        title: 'Shipping Information',
                        items: [
                          'Free shipping on orders above ₹499',
                          'Standard delivery: 3-5 business days',
                          'Express delivery: 1-2 business days (extra charges apply)',
                          'Cash on Delivery available',
                          'Orders are processed within 24 hours',
                        ],
                      },
                      {
                        icon: RotateCcw,
                        title: 'Return Policy',
                        items: [
                          '7 days easy return policy',
                          'Items must be unused and in original packaging',
                          'Free pickup for eligible returns',
                          'Refund processed within 5-7 business days',
                          'Contact support for return initiation',
                        ],
                      },
                      {
                        icon: Shield,
                        title: 'Warranty & Support',
                        items: [
                          '1 year manufacturer warranty',
                          'Dedicated customer support',
                          'Extended warranty available at checkout',
                        ],
                      },
                    ].map((section) => (
                      <div key={section.title} className="p-4 bg-gray-50 dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <section.icon className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm">{section.title}</h3>
                        </div>
                        <ul className="space-y-1.5">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <Check className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* ─── FAQs Tab ─── */}
                {activeTab === 'faqs' && (
                  <motion.div
                    key="faqs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    {[
                      { q: 'How do I track my order?', a: 'You can track your order from the "My Orders" section in your account. You will also receive email updates with tracking information.' },
                      { q: 'Can I cancel my order?', a: 'Yes, you can cancel your order within 24 hours of placing it. Visit your orders page and click on cancel.' },
                      { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, Net Banking, and Cash on Delivery.' },
                      { q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days. Express delivery options are available at checkout for faster shipping.' },
                      { q: 'Is my payment information secure?', a: 'Yes, we use industry-standard encryption to protect your payment information. All transactions are 100% secure.' },
                    ].map((faq, i) => (
                      <motion.div
                        key={i}
                        className="border border-gray-100 dark:border-dark-border rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedSection(expandedSection === `faq-${i}` ? null : `faq-${i}`)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                        >
                          <span className="font-medium text-sm">{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === `faq-${i}` ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedSection === `faq-${i}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ RECOMMENDED PRODUCTS ═══ */}
        {(relatedProducts.length > 0 || alsoBought.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 sm:mt-16 lg:mt-20"
          >
            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mb-10 sm:mb-12">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Related Products</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Customers who viewed this also viewed</p>
                  </div>
                  <Link
                    to={`/products?category=${product.category?._id || ''}`}
                    className="text-sm text-primary hover:underline hidden sm:flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                  {relatedProducts.slice(0, 8).map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Also Bought */}
            {alsoBought.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Customers Also Bought</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Popular products our customers love</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                  {alsoBought.slice(0, 8).map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══ MOBILE STICKY BOTTOM BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border lg:hidden shadow-2xl">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            {bestOffer && bestOffer.discountAmount > 0 ? (
              <>
                <p className="font-bold text-lg sm:text-xl text-danger">₹{Number(bestOffer.discountedPrice).toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm text-gray-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-danger font-semibold">{getOfferLabel(bestOffer)}</span>
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">₹{product.price?.toLocaleString('en-IN')}</p>
                {product.comparePrice > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.comparePrice?.toLocaleString('en-IN')}</span>
                    {discount > 0 && <span className="text-xs text-green-600 font-semibold">{discount}% OFF</span>}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-xl border-2 transition-all ${
                isInWishlist
                  ? 'border-danger text-danger bg-danger/5'
                  : 'border-gray-200 dark:border-dark-border text-gray-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-danger' : ''}`} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className="px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              {addingToCart ? '...' : 'Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> Buy
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:h-0" />

      {/* ═══ FULLSCREEN MODAL ═══ */}
      {fullscreenOpen && (
        <FullscreenModal
          images={allImages}
          currentIndex={fullscreenIndex}
          onClose={() => setFullscreenOpen(false)}
          onNavigate={setFullscreenIndex}
        />
      )}

      {/* ═══ SHARE MODAL ═══ */}
      {showShareModal && (
        <ShareModal product={product} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  )
}

export default ProductDetailPage
