import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import { StarRating, SectionSkeleton } from './ReusableComponents.jsx'
import 'swiper/css'
import 'swiper/css/pagination'

const TestimonialsSection = ({ reviews, isLoading }) => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  if (isLoading) return <SectionSkeleton type="testimonial" />

  if (!reviews || reviews.length === 0) return null

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-white dark:bg-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            What Our Customers Say
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Real reviews from real customers
          </p>
        </motion.div>

        <div className="relative">
          {/* Custom Navigation */}
          <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between z-10 pointer-events-none">
            <button
              ref={prevRef}
              className="w-10 h-10 rounded-full bg-white dark:bg-dark-card shadow-lg border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 -translate-x-5 pointer-events-auto"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              ref={nextRef}
              className="w-10 h-10 rounded-full bg-white dark:bg-dark-card shadow-lg border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 translate-x-5 pointer-events-auto"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="testimonial-swiper pb-12"
          >
            {reviews.map((review, i) => (
              <SwiperSlide key={review._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-8 h-full hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border"
                >
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Quote className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating rating={review.rating} size="md" />
                  </div>

                  {/* Comment */}
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed line-clamp-3 sm:line-clamp-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  {/* User Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex-shrink-0">
                      {review.user?.avatar ? (
                        <img
                          src={getImageUrl(review.user.avatar)}
                          alt={review.user.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                        {review.user?.name || 'Anonymous'}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {review.isVerifiedPurchase ? '✓ Verified Purchase' : 'Customer'}
                      </p>
                    </div>
                  </div>

                  {/* Hover accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection