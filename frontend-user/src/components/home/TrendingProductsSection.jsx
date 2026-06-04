import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { Star, ShoppingBag, Eye } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import { SectionSkeleton, DiscountBadge } from './ReusableComponents.jsx'
import { formatCurrency } from '../../utils/offerUtils.js'
import 'swiper/css'

const TrendingProductsSection = ({ products, isLoading, title = 'Trending Now', subtitle = 'Most popular products this week' }) => {
  if (isLoading) return <SectionSkeleton />
  if (!products || products.length === 0) return null

  const topRated = [...products].sort((a, b) => b.ratings - a.ratings).slice(0, 8)

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-white dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">{subtitle}</p>
            </div>
          </div>
          <Link
            to="/products?sort=rating"
            className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium text-sm"
          >
            View All <span aria-hidden="true">&rarr;</span>
          </Link>
        </motion.div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={2}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
            1280: { slidesPerView: 5, spaceBetween: 24 },
          }}
          className="trending-swiper"
        >
          {topRated.map((product, i) => {
            const offer = product.offer
            const hasOffer = offer && offer.discountAmount > 0
            const displayPrice = hasOffer ? offer.discountedPrice : product.price
            const compareDisc = product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0

            return (
              <SwiperSlide key={product._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/product/${product._id}`}
                    className="group block bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={getImageUrl(product.images?.[0]) || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/placeholder.svg' }}
                      />

                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <DiscountBadge discount={compareDisc} offer={offer} />
                      </div>

                      {product.ratings > 0 && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold rounded-full">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {product.ratings.toFixed(1)}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex gap-2">
                          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-gray-900 hover:bg-primary hover:text-white transition-colors shadow-lg">
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                          </span>
                          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-gray-900 hover:bg-primary hover:text-white transition-colors shadow-lg">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {product.brand.name || product.brand}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                        <span className={`font-bold text-sm sm:text-base ${hasOffer ? 'text-danger' : 'text-gray-900 dark:text-white'}`}>
                          ₹{formatCurrency(displayPrice)}
                        </span>
                        {product.comparePrice > product.price && (
                          <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                            ₹{formatCurrency(product.comparePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </section>
  )
}

export default TrendingProductsSection
