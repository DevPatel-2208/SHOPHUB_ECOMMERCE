import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../services/api.js'
import ProductCard from '../../components/user/ProductCard.jsx'
import { SkeletonGrid } from '../../components/common/Loader.jsx'

const ITEMS_PER_PAGE = 12

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || '-createdAt',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') || '',
  })

  // Sync filters when URL params change (browser back/forward)
  useEffect(() => {
    setFilters({
      sort: searchParams.get('sort') || '-createdAt',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStock: searchParams.get('inStock') || '',
    })
  }, [searchParams])

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setIsLoading(false)
      setProducts([])
      setTotalResults(0)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        search: query.trim(),
        page,
        limit: ITEMS_PER_PAGE,
        sort: filters.sort,
      })
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.inStock === 'true') params.set('inStock', 'true')

      const { data } = await api.get(`/products?${params.toString()}`)
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [query, page, filters])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (e) => {
    const value = e.target.value
    setFilters(prev => ({ ...prev, sort: value }))
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    params.set('page', '1')
    setSearchParams(params)
  }

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    else params.delete('minPrice')
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    else params.delete('maxPrice')
    params.set('page', '1')
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({ sort: '-createdAt', minPrice: '', maxPrice: '', inStock: '' })
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    setSearchParams(params)
  }

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.inStock || filters.sort !== '-createdAt'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Search className="w-6 h-6 text-gray-400 mt-1 shrink-0" />
          <div className="flex-1">
            {query ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Search results for "{query}"
                </h1>
                <p className="text-gray-500 mt-1">
                  {isLoading ? 'Searching...' : `${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold">Search</h1>
                <p className="text-gray-500 mt-1">Enter a keyword to search products</p>
              </>
            )}
          </div>
        </div>

        {/* Sort & Filter Bar */}
        {query && !isLoading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={filters.sort}
                onChange={handleSortChange}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-dark-hover border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="-createdAt">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-xl transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
            <span className="text-sm text-gray-500 hidden sm:block">
              Page {page} of {totalPages}
            </span>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    placeholder="₹0"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-dark-hover border border-gray-200 dark:border-dark-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    placeholder="₹99999"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-dark-hover border border-gray-200 dark:border-dark-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-dark-hover border border-gray-200 dark:border-dark-border cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={filters.inStock === 'true'}
                      onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked ? 'true' : '' }))}
                      className="accent-primary"
                    />
                    In Stock Only
                  </label>
                  <button
                    onClick={applyPriceFilter}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {!query.trim() ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Search for products</h2>
            <p className="text-gray-500">Type in the search box above to find products</p>
          </div>
        ) : isLoading ? (
          <SkeletonGrid count={ITEMS_PER_PAGE} />
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchResults}
              className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No results found</h2>
            <p className="text-gray-500 mb-6">We couldn't find any products matching "{query}"</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Suggestions:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>Check your spelling</li>
                <li>Try more general keywords</li>
                <li>Try different keywords</li>
                <li>Browse our <Link to="/products" className="text-primary hover:underline">product catalog</Link></li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (page <= 4) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SearchResultsPage