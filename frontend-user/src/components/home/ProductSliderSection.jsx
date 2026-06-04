import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import ProductCard from '../user/ProductCard.jsx'
import { SectionSkeleton } from './ReusableComponents.jsx'
import 'swiper/css'
import 'swiper/css/navigation'

const ProductSliderSection = ({
  title,
  subtitle,
  products = [],
  isLoading,
  viewAllLink = '/products',
  slidesPerView = { desktop: 5, tablet: 3, mobile: 2 },
  autoplayDelay = 4000,
}) => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const getSlidesPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return slidesPerView.desktop
      if (window.innerWidth >= 768) return slidesPerView.tablet
    }
    return slidesPerView.mobile
  }

  if (isLoading) return <SectionSkeleton />

  if (!products || products.length === 0) return null

  // Check if all products are the same (empty/placeholder)
  const hasProducts = products.length > 0

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-gray-50 dark:bg-dark-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Custom Navigation */}
            <div className="hidden sm:flex gap-2">
              <button
                ref={prevRef}
                className="w-9 h-9 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                ref={nextRef}
                className="w-9 h-9 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to={viewAllLink}
              className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium text-sm whitespace-nowrap"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Products Slider */}
        {hasProducts && (
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={16}
            slidesPerView={2}
            autoplay={{ delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: slidesPerView.tablet, spaceBetween: 20 },
              1024: { slidesPerView: slidesPerView.tablet, spaceBetween: 24 },
              1280: { slidesPerView: slidesPerView.desktop, spaceBetween: 24 },
            }}
            className="product-slider"
          >
            {products.map((product, index) => (
              <SwiperSlide key={product._id}>
                <ProductCard product={product} index={index} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  )
}

export default ProductSliderSection