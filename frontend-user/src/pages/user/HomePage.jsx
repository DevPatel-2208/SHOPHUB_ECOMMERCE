import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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

const HomePage = () => {
  const [homeData, setHomeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchHomepageData()
        setHomeData(data)
      } catch (err) {
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
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

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
