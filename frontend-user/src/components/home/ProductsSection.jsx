import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, SlidersHorizontal, X, ChevronDown, ShoppingBag, ArrowRight } from 'lucide-react'
import ProductCard from '../user/ProductCard.jsx'
import api from '../../services/api.js'

const categories = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Sports', 'Books', 'Beauty']

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
]

const ProductsSection = () => {
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeSort, setActiveSort] = useState('newest')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const params = { limit: 8 }
        if (activeCategory !== 'All') params.category = activeCategory.toLowerCase()
        if (activeSort === 'newest') params.sort = '-createdAt'
        else if (activeSort === 'price_asc') params.sort = 'price'
        else if (activeSort === 'price_desc') params.sort = '-price'
        else if (activeSort === 'popular') params.sort = '-sold'

        const { data } = await api.get('/products', { params })
        setProducts(data.products || [])
      } catch (err) {
        console.error(err)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [activeCategory, activeSort])

  // Skeleton loader
  const Skeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border animate-pulse">
          <div className="aspect-square bg-gray-200 dark:bg-dark-hover" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-dark-hover rounded-full w-20" />
            <div className="h-4 bg-gray-200 dark:bg-dark-hover rounded-full w-3/4" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-3 h-3 bg-gray-200 dark:bg-dark-hover rounded-full" />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 dark:bg-dark-hover rounded-full w-16" />
              <div className="w-9 h-9 bg-gray-200 dark:bg-dark-hover rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 bg-gray-50 dark:bg-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 sm:mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border border-primary/10 dark:border-primary/20 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary dark:text-primary-light">Featured Products</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Top Picks For You
            </h2>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group"
          >
            View All Products
            <ChevronDown className="w-4 h-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Category Tabs & Sort - Desktop */}
        <div className="hidden sm:flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover border border-gray-200 dark:border-dark-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary/30 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {sortOptions.find(o => o.value === activeSort)?.label || 'Sort'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-100 dark:border-dark-border z-20 overflow-hidden"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setActiveSort(option.value); setShowSort(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        activeSort === option.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden mb-4"
            >
              <div className="bg-white dark:bg-dark-card rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-dark-border">
                {/* Mobile Categories */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeCategory === cat
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Sort */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort By</p>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setActiveSort(option.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeSort === option.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2 rounded-full bg-gray-100 dark:bg-dark-hover text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Close Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        {isLoading ? (
          <Skeleton />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No products found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </motion.div>
        )}

        {/* Mobile View All */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center sm:hidden"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default ProductsSection