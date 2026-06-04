import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import { ArrowRight, Sparkles, ShoppingBag, ChevronRight } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import { SectionSkeleton } from './ReusableComponents.jsx'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

const HeroBannerSection = ({ banners, isLoading }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (isLoading) return <SectionSkeleton type="banner" />

  if (!banners || banners.length === 0) return null

  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        effect="fade"
        fadeEffect={{ crossFade: true }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="hero-swiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner._id || index}>
            <div className="relative h-[300px] sm:h-[420px] md:h-[500px] lg:h-[560px] overflow-hidden">
              {/* Background Image */}
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet={getImageUrl(banner.mobileImage || banner.image)}
                />
                <img
                  src={getImageUrl(banner.image)}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </picture>

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient || 'from-gray-900/90 to-gray-900/50'} opacity-90`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="max-w-xl text-white relative z-10"
                  >
                    {banner.badge && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4 border border-white/30"
                      >
                        <Sparkles className="w-4 h-4" /> {banner.badge}
                      </motion.div>
                    )}

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight"
                    >
                      {banner.title}
                    </motion.h1>

                    {banner.subtitle && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 opacity-90 font-light"
                      >
                        {banner.subtitle}
                      </motion.p>
                    )}

                    {banner.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-sm sm:text-base mb-6 sm:mb-8 opacity-75 max-w-lg hidden sm:block"
                      >
                        {banner.description}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                      className="flex flex-wrap gap-3 sm:gap-4"
                    >
                      <Link
                        to={banner.link || '/products'}
                        className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-sm sm:text-base"
                      >
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                        {banner.ctaText || 'Shop Now'}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-white dark:from-dark to-transparent pointer-events-none z-10" />
    </section>
  )
}

export default HeroBannerSection