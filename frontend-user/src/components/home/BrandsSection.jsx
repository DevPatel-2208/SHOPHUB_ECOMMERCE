import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { ChevronRight, Building2 } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import 'swiper/css'

const BrandsSection = ({ brands }) => {
  if (!brands || brands.length === 0) return null

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-gray-50 dark:bg-dark-card/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Featured Brands
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                Shop from top brands
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium text-sm"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={2}
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            480: { slidesPerView: 3, spaceBetween: 20 },
            640: { slidesPerView: 4, spaceBetween: 20 },
            768: { slidesPerView: 5, spaceBetween: 24 },
            1024: { slidesPerView: 6, spaceBetween: 24 },
            1280: { slidesPerView: 7, spaceBetween: 24 },
          }}
          className="brands-swiper"
        >
          {brands.map((brand, i) => (
            <SwiperSlide key={brand._id}>
              <Link
                to={`/products?brand=${brand._id}`}
                className="group block"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="relative bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border overflow-hidden group cursor-pointer"
                >
                  {brand.logo ? (
                    <div className="aspect-square flex items-center justify-center p-1 sm:p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors duration-300">
                      <img
                        src={getImageUrl(brand.logo)}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 brightness-110 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg">
                      <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400/50" />
                    </div>
                  )}
                  <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate group-hover:text-primary transition-colors">
                    {brand.name}
                  </p>
                  {brand.productCount > 0 && (
                    <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">
                      {brand.productCount} items
                    </p>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}

export default BrandsSection
