import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, RefreshCw, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchHomepageData, subscribeToNewsletter } from '../../services/homepageService.js'
import HeroBannerSection from '../../components/home/HeroBannerSection.jsx'
import HeroSection from '../../components/home/HeroSection.jsx'
import StatisticsSection from '../../components/home/StatisticsSection.jsx'
import FeaturesSection from '../../components/home/FeaturesSection.jsx'
import FeaturedCategoriesSection from '../../components/home/FeaturedCategoriesSection.jsx'
import TrendingProductsSection from '../../components/home/TrendingProductsSection.jsx'
import FlashDealsBanner from '../../components/home/FlashDealsBanner.jsx'
import BestSellersSection from '../../components/home/BestSellersSection.jsx'
import BrandsSection from '../../components/home/BrandsSection.jsx'
import WhyChooseUsSection from '../../components/home/WhyChooseUsSection.jsx'
import ProductsSection from '../../components/home/ProductsSection.jsx'
import TestimonialsSection from '../../components/home/TestimonialsSection.jsx'
import NewsletterSection from '../../components/home/NewsletterSection.jsx'
import CTASection from '../../components/home/CTASection.jsx'
import { Loader } from '../../components/common/Loader.jsx'

const TIMEOUT_DURATION = 20000

const HomePage = () => {
  const [homeData, setHomeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef(null)
  const loadingRef = useRef(false)

  const loadData = async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      setIsLoading(true)
      setError(null)
      setTimedOut(false)

      timeoutRef.current = setTimeout(() => {
        setTimedOut(true)
      }, TIMEOUT_DURATION)

      const data = await fetchHomepageData()
      clearTimeout(timeoutRef.current)
      setHomeData(data)
    } catch (err) {
      clearTimeout(timeoutRef.current)
      console.error('Failed to load homepage data:', err)
      setError(err.message || 'Failed to load data')
      try {
        const {
          fetchBanners, fetchCategories, fetchFeaturedProducts,
          fetchNewArrivals, fetchActiveOffers, fetchTestimonials
        } = await import('../../services/homepageService.js')
        const [banners, categories, featuredProducts, newArrivals, activeOffers, testimonials] = await Promise.all([
          fetchBanners().catch(() => []),
          fetchCategories().catch(() => []),
          fetchFeaturedProducts().catch(() => []),
          fetchNewArrivals().catch(() => []),
          fetchActiveOffers().catch(() => []),
          fetchTestimonials().catch(() => []),
        ])
        setHomeData({
          banners, categories, featuredProducts, newArrivals,
          activeOffers, testimonials, brands: [], bestSellers: [],
          trendingProducts: [], stats: {
            products: 0, brands: 0, categories: 0, orders: 0,
            reviews: 0, happyCustomers: 0, inStock: 0,
          },
        })
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr)
        setHomeData({
          banners: [], categories: [], featuredProducts: [],
          newArrivals: [], activeOffers: [], testimonials: [],
          brands: [], bestSellers: [], trendingProducts: [],
          stats: {
            products: 0, brands: 0, categories: 0, orders: 0,
            reviews: 0, happyCustomers: 0, inStock: 0,
          },
        })
      }
    } finally {
      clearTimeout(timeoutRef.current)
      setIsLoading(false)
      loadingRef.current = false
    }
  }

  useEffect(() => {
    loadData()
    return () => clearTimeout(timeoutRef.current)
  }, [])

  if (isLoading && timedOut) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center px-6 max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Server is waking up...
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
              The backend server takes about 30–40 seconds to start after a period of inactivity.
              Please wait or try refreshing.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-sm text-gray-400 dark:text-gray-500">Still loading...</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadData}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              Retry Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark transition-colors duration-300">
        <Loader fullScreen />
      </div>
    )
  }

  const {
    banners = [],
    categories = [],
    featuredProducts = [],
    newArrivals = [],
    activeOffers = [],
    testimonials = [],
    brands = [],
    bestSellers = [],
    trendingProducts = [],
    stats = null,
  } = homeData || {}

  return (
    <div className="min-h-screen bg-white dark:bg-dark transition-colors duration-300">
      <HeroBannerSection banners={banners} isLoading={isLoading} />
      <HeroSection stats={stats} categories={categories} featuredProducts={featuredProducts} />
      <StatisticsSection stats={stats} />
      <FeaturesSection />
      {categories.length > 0 && <FeaturedCategoriesSection categories={categories} isLoading={isLoading} />}
      {trendingProducts.length > 0 && (
        <TrendingProductsSection products={trendingProducts} title="Trending Now" subtitle="Most popular products right now" />
      )}
      <FlashDealsBanner offers={activeOffers} isLoading={isLoading} />
      {bestSellers.length > 0 && <BestSellersSection products={bestSellers} />}
      {brands.length > 0 && <BrandsSection brands={brands} />}
      <WhyChooseUsSection />
      {testimonials.length > 0 && <TestimonialsSection reviews={testimonials} isLoading={isLoading} />}
      <ProductsSection />
      <NewsletterSection />
      <CTASection />
    </div>
  )
}

export default HomePage
