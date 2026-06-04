import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  SlidersHorizontal, Grid3X3, LayoutList, ChevronDown, X, Search, Tag, Zap,
  Gift, ArrowRight, AlertCircle, Loader2, Star, Truck, Clock, TrendingUp,
  ArrowUpDown, FilterX, Package, ShoppingBag, ChevronLeft, ChevronRight, Check, Minus, Plus,
  BadgePercent, ShieldCheck, RotateCcw, Sparkles,
} from 'lucide-react'
import api from '../../services/api.js'
import ProductCard from '../../components/user/ProductCard.jsx'
import { SkeletonCard } from '../../components/common/Loader.jsx'
import { getDiscountText } from '../../utils/offerUtils.js'

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'price_asc', label: 'Price: Low to High', icon: TrendingUp },
  { value: 'price_desc', label: 'Price: High to Low', icon: TrendingUp },
  { value: 'rating', label: 'Highest Rated', icon: Star },
  { value: 'name_asc', label: 'Name A-Z', icon: ArrowUpDown },
]

const pricePresets = [
  { label: 'Under \u20B9500', min: '', max: '500' },
  { label: '\u20B9500 - \u20B91K', min: '500', max: '1000' },
  { label: '\u20B91K - \u20B95K', min: '1000', max: '5000' },
  { label: '\u20B95K - \u20B910K', min: '5000', max: '10000' },
  { label: 'Over \u20B910K', min: '10000', max: '' },
]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 16 } },
}

const StarRating = ({ filled }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} className={`w-3.5 h-3.5 ${i <= filled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600 fill-gray-300 dark:fill-gray-600'}`} viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </span>
)

const PriceSlider = ({ min, max, value, onChange }) => {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])

  const adjustedMax = max <= min ? min + 1000 : max
  const adjustedMin = min
  const range = adjustedMax - adjustedMin || 1000
  const leftPercent = ((local[0] - adjustedMin) / range) * 100
  const rightPercent = ((local[1] - adjustedMin) / range) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-medium">
        {min === max ? (
          <span className="text-gray-900 dark:text-white mx-auto">{'\u20B9'}{Number(min).toLocaleString('en-IN')}</span>
        ) : (
          <>
            <span className="text-gray-900 dark:text-white">{'\u20B9'}{Number(local[0]).toLocaleString('en-IN')}</span>
            <span className="text-gray-400">—</span>
            <span className="text-gray-900 dark:text-white">{'\u20B9'}{Number(local[1]).toLocaleString('en-IN')}</span>
          </>
        )}
      </div>
      {min !== max && (
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
          />
          <input
            type="range" min={adjustedMin} max={adjustedMax}
            value={local[0]}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), local[1] - 100)
              setLocal([v, local[1]])
            }}
            onMouseUp={() => onChange(local)}
            onTouchEnd={() => onChange(local)}
            className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          />
          <input
            type="range" min={adjustedMin} max={adjustedMax}
            value={local[1]}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), local[0] + 100)
              setLocal([local[0], v])
            }}
            onMouseUp={() => onChange(local)}
            onTouchEnd={() => onChange(local)}
            className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab"
          />
        </div>
      )}
    </div>
  )
}

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [offers, setOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [offersError, setOffersError] = useState(null)
  const [mobileSortOpen, setMobileSortOpen] = useState(false)
  const [filterMeta, setFilterMeta] = useState(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [brandSearch, setBrandSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})

  const filters = useMemo(() => ({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
    inStock: searchParams.get('inStock') || '',
    rating: searchParams.get('rating') || '',
    hasOffer: searchParams.get('hasOffer') || '',
    availability: searchParams.get('availability') || '',
  }), [searchParams])

  // Fetch filter metadata (category counts, brand counts, price range, etc.)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true)
        const [metaRes, catRes] = await Promise.all([
          api.get('/products/filters/metadata'),
          api.get('/categories'),
        ])
        setFilterMeta(metaRes.data.filters)
        setCategories(catRes.data.categories || [])
      } catch (err) { console.error(err) }
      finally { setMetaLoading(false) }
    }
    fetchMeta()
  }, [])

  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await api.get('/products?limit=1')
        setBrands(data.filters?.brands || [])
      } catch (err) { console.error(err) }
    }
    fetchBrands()
  }, [])

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setOffersLoading(true); setOffersError(null)
        const res = await api.get('/offers/active')
        setOffers(res.data.offers || [])
      } catch (err) {
        setOffersError(err.message || 'Failed to load offers')
        setOffers([])
      } finally { setOffersLoading(false) }
    }
    fetchOffers()
  }, [])

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error,
  } = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      params.set('page', pageParam)
      const res = await api.get(`/products?${params.toString()}`)
      return res.data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) return lastPage.currentPage + 1
      return undefined
    },
  })

  const products = useMemo(() => data?.pages.flatMap((p) => p.products) || [], [data])
  const totalProducts = data?.pages[0]?.total || 0

  const updateFilter = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) newParams.set(key, value)
    else newParams.delete(key)
    newParams.set('page', '1')
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  // Toggle category in multi-select
  const toggleCategory = (catId) => {
    const current = filters.category ? filters.category.split(',') : []
    const idx = current.indexOf(catId)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(catId)
    updateFilter('category', current.join(','))
  }

  // Toggle brand in multi-select
  const toggleBrand = (brandId) => {
    const current = filters.brand ? filters.brand.split(',') : []
    const idx = current.indexOf(brandId)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(brandId)
    updateFilter('brand', current.join(','))
  }

  const selectedCategories = filters.category ? filters.category.split(',').filter(Boolean) : []
  const selectedBrands = filters.brand ? filters.brand.split(',').filter(Boolean) : []

  const activeFilterList = useMemo(() => {
    const list = []
    if (filters.search) list.push({ key: 'q', label: `"${filters.search}"`, onRemove: () => updateFilter('search', '') })
    selectedCategories.forEach((catId) => {
      const cat = categories.find((c) => c._id === catId)
      if (cat) list.push({ key: `cat-${catId}`, label: cat.name, onRemove: () => toggleCategory(catId) })
    })
    selectedBrands.forEach((brId) => {
      const br = brands.find((b) => b._id === brId || b.slug === brId)
      if (br) list.push({ key: `brand-${brId}`, label: br.name, onRemove: () => toggleBrand(brId) })
    })
    if (filters.minPrice) list.push({ key: 'minPrice', label: `Min \u20B9${Number(filters.minPrice).toLocaleString('en-IN')}`, onRemove: () => updateFilter('minPrice', '') })
    if (filters.maxPrice) list.push({ key: 'maxPrice', label: `Max \u20B9${Number(filters.maxPrice).toLocaleString('en-IN')}`, onRemove: () => updateFilter('maxPrice', '') })
    if (filters.rating) list.push({ key: 'rating', label: `${filters.rating}\u2605 & above`, onRemove: () => updateFilter('rating', '') })
    if (filters.hasOffer) list.push({ key: 'hasOffer', label: 'With Offers', onRemove: () => updateFilter('hasOffer', '') })
    if (filters.inStock) list.push({ key: 'inStock', label: 'In Stock', onRemove: () => updateFilter('inStock', '') })
    if (filters.availability === 'in_stock') list.push({ key: 'avail-in', label: 'In Stock', onRemove: () => updateFilter('availability', '') })
    if (filters.availability === 'out_of_stock') list.push({ key: 'avail-out', label: 'Out of Stock', onRemove: () => updateFilter('availability', '') })
    return list
  }, [filters, categories, brands, selectedCategories, selectedBrands, updateFilter, toggleCategory, toggleBrand])

  const currentSort = sortOptions.find((o) => o.value === filters.sort) || sortOptions[0]
  const SortIcon = currentSort.icon
  const hasActiveFilters = activeFilterList.length > 0

  const priceMin = filterMeta?.priceRange?.min || 0
  const priceMax = filterMeta?.priceRange?.max || 100000
  const priceValue = [
    filters.minPrice ? Number(filters.minPrice) : priceMin,
    filters.maxPrice ? Number(filters.maxPrice) : priceMax,
  ]

  const handlePriceChange = (vals) => {
    updateFilter('minPrice', vals[0] > priceMin ? String(vals[0]) : '')
    updateFilter('maxPrice', vals[1] < priceMax ? String(vals[1]) : '')
  }

  const handleBrandSearchChange = (e) => {
    setBrandSearch(e.target.value)
  }

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return filterMeta?.brands || brands
    return (filterMeta?.brands || brands).filter((b) =>
      b.name?.toLowerCase().includes(brandSearch.toLowerCase())
    )
  }, [brandSearch, filterMeta, brands])

  const toggleSection = (section) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const filterCount = hasActiveFilters ? activeFilterList.length : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Breadcrumb */}
      <div className="relative z-10 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-white font-medium">Products</span>
            {selectedCategories.length === 1 && (() => {
              const cat = categories.find((c) => c._id === selectedCategories[0])
              return cat ? <><ChevronRight className="w-3 h-3" /><span className="text-primary">{cat.name}</span></> : null
            })()}
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 dark:from-primary/10 dark:via-primary/5 dark:to-transparent border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Shop</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {filters.search ? (
                      <>Results for "<span className="text-primary">{filters.search}</span>"</>
                    ) : selectedCategories.length === 1 ? (
                      categories.find((c) => c._id === selectedCategories[0])?.name || 'Products'
                    ) : selectedCategories.length > 1 ? (
                      'Selected Categories'
                    ) : (
                      'All Products'
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {isLoading ? 'Searching...' : totalProducts > 0 ? `${totalProducts} product${totalProducts !== 1 ? 's' : ''} found` : 'Browse our collection'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/" className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Trending
                </Link>
                <Link to="/products?hasOffer=true" className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  Offers
                </Link>
                {filters.search && (
                  <Link to="/products" className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:text-danger hover:border-danger/50 transition-all">
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Offers */}
        {offers.length > 0 && !offersLoading && !offersError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BadgePercent className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Active Offers</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0">
              {offers.map((offer, idx) => (
                <motion.div
                  key={offer._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                  className="flex-shrink-0 w-72 rounded-2xl p-4 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-200">Limited Time</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{offer.title}</h4>
                    <p className="text-xs text-white/80 mb-3">{getDiscountText(offer)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/70">
                      <Clock className="w-3 h-3" />
                      {offer.endDate ? `Ends ${new Date(offer.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Limited stock'}
                    </span>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ============== DESKTOP SIDEBAR ============== */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:w-72 xl:w-80 shrink-0"
          >
            <div className="sticky top-24 space-y-4">
              <div className="bg-white dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      Filters
                      {filterCount && <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">{filterCount}</span>}
                    </h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-danger hover:underline font-medium">Clear All</button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-5 divide-y divide-gray-100 dark:divide-gray-700/50">
                  {/* ── CATEGORIES ── */}
                  <div className={collapsed.categories ? 'pt-0' : 'pt-5'}>
                    <button onClick={() => toggleSection('categories')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Categories</h4>
                      {collapsed.categories ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.categories && (
                      <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                        {(categories || []).map((cat) => {
                          const metaCat = filterMeta?.categories?.find((c) => c._id === cat._id)
                          const isSelected = selectedCategories.includes(cat._id)
                          const count = metaCat?.count ?? 0
                          return (
                            <label key={cat._id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isSelected ? 'bg-primary/5' : ''}`}>
                              <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(cat._id)} className="sr-only" />
                              </div>
                              <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{cat.name}</span>
                              {count > 0 && <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">({count})</span>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── BRANDS ── */}
                  <div className="pt-5">
                    <button onClick={() => toggleSection('brands')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Brands</h4>
                      {collapsed.brands ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.brands && (
                      <>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text" placeholder="Search brands..." value={brandSearch} onChange={handleBrandSearchChange}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {(filteredBrands || []).map((brand) => {
                            const metaBrand = filterMeta?.brands?.find((b) => b._id === brand._id)
                            const isSelected = selectedBrands.includes(brand._id)
                            const count = metaBrand?.count ?? 0
                            return (
                              <label key={brand._id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isSelected ? 'bg-primary/5' : ''}`}>
                                <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                  <input type="checkbox" checked={isSelected} onChange={() => toggleBrand(brand._id)} className="sr-only" />
                                </div>
                                <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{brand.name}</span>
                                {count > 0 && <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">({count})</span>}
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── PRICE RANGE ── */}
                  <div className="pt-5">
                    <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Price Range</h4>
                      {collapsed.price ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.price && (
                      <>
                        {!metaLoading && (
                          <PriceSlider min={priceMin} max={priceMax} value={priceValue} onChange={handlePriceChange} />
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{'\u20B9'}</span>
                            <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                          </div>
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{'\u20B9'}</span>
                            <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {pricePresets.map((p) => {
                            const isActive = filters.minPrice === p.min && filters.maxPrice === p.max
                            return (
                              <button key={p.label} onClick={() => { updateFilter('minPrice', p.min); updateFilter('maxPrice', p.max) }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                              >
                                {p.label}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── CUSTOMER RATING ── */}
                  <div className="pt-5">
                    <button onClick={() => toggleSection('rating')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Customer Rating</h4>
                      {collapsed.rating ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.rating && (
                      <div className="space-y-1">
                        {[
                          { value: '4', stars: 4, label: '4★ & Above' },
                          { value: '3', stars: 3, label: '3★ & Above' },
                          { value: '2', stars: 2, label: '2★ & Above' },
                          { value: '1', stars: 1, label: '1★ & Above' },
                        ].map((opt) => {
                          const isSelected = filters.rating === opt.value
                          const count = filterMeta?.ratings
                            ? opt.value === '4' ? filterMeta.ratings.fourAndAbove
                              : opt.value === '3' ? filterMeta.ratings.threeAndAbove
                                : opt.value === '2' ? filterMeta.ratings.twoAndAbove
                                  : filterMeta.ratings.oneAndAbove
                            : 0
                          return (
                            <label key={opt.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                              <div className={`relative w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                <input type="radio" name="rating-desktop" checked={isSelected} onChange={() => updateFilter('rating', isSelected ? '' : opt.value)} className="sr-only" />
                              </div>
                              <span className={`flex items-center gap-2 flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                <StarRating filled={opt.stars} />
                                {opt.label}
                              </span>
                              {count > 0 && <span className="text-[11px] text-gray-400 font-medium">({count})</span>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── OFFERS ── */}
                  <div className="pt-5">
                    <button onClick={() => toggleSection('offers')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Offers</h4>
                      {collapsed.offers ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.offers && (
                      <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${filters.hasOffer === 'true' ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                        <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${filters.hasOffer === 'true' ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                          {filters.hasOffer === 'true' && <Check className="w-3 h-3 text-white" />}
                          <input type="checkbox" checked={filters.hasOffer === 'true'} onChange={(e) => updateFilter('hasOffer', e.target.checked ? 'true' : '')} className="sr-only" />
                        </div>
                        <span className={`flex-1 text-sm ${filters.hasOffer === 'true' ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>Products With Offers</span>
                        {filterMeta?.offers?.count > 0 && <span className="text-[11px] text-gray-400 font-medium">({filterMeta.offers.count})</span>}
                      </label>
                    )}
                  </div>

                  {/* ── AVAILABILITY ── */}
                  <div className="pt-5">
                    <button onClick={() => toggleSection('availability')} className="flex items-center justify-between w-full mb-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Availability</h4>
                      {collapsed.availability ? <Plus className="w-3.5 h-3.5 text-gray-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {!collapsed.availability && (
                      <div className="space-y-1">
                        {[
                          { value: 'in_stock', label: 'In Stock', count: filterMeta?.availability?.inStock },
                          { value: 'out_of_stock', label: 'Out of Stock', count: filterMeta?.availability?.outOfStock },
                        ].map((opt) => {
                          const isSelected = filters.availability === opt.value
                          return (
                            <label key={opt.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                              <div className={`relative w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                <input type="radio" name="avail-desktop" checked={isSelected} onChange={() => updateFilter('availability', isSelected ? '' : opt.value)} className="sr-only" />
                              </div>
                              <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{opt.label}</span>
                              {opt.count !== undefined && <span className="text-[11px] text-gray-400 font-medium">({opt.count})</span>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* ============== PRODUCTS AREA ============== */}
          <div className="flex-1 min-w-0">
            {/* Sort & View Bar */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-primary/50 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {filterCount && <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">{filterCount}</span>}
                </button>
                <div className="hidden sm:flex items-center bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Grid view"><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="List view"><LayoutList className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isLoading && <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{products.length} of {totalProducts} results</span>}
                <div className="hidden sm:relative sm:block">
                  <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-10 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
                <button onClick={() => setMobileSortOpen(true)} className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                  <ArrowUpDown className="w-4 h-4" />
                  {currentSort.label}
                </button>
              </div>
            </motion.div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-1.5 mb-4">
                {activeFilterList.map((af) => (
                  <span key={af.key} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {af.label}
                    <button onClick={af.onRemove} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <FilterX className="w-3 h-3" />
                  Clear All
                </button>
              </motion.div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : isError ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Something went wrong</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error?.message || 'Failed to load products'}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all">Try Again</button>
              </motion.div>
            ) : products.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  {filters.search ? `We couldn't find any products matching "${filters.search}". Try different keywords.` : 'Try adjusting your filters.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={clearFilters} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Clear All Filters</button>
                  <Link to="/products" className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-primary transition-all">View All Products</Link>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                  className={`grid gap-3 sm:gap-4 lg:gap-5 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
                >
                  {products.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
                </motion.div>

                {hasNextPage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8 sm:mt-10">
                    <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                      className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30"
                    >
                      {isFetchingNextPage ? <><Loader2 className="w-5 h-5 animate-spin" /> Loading...</> : <><RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Load More Products</>}
                    </button>
                    <p className="text-xs text-gray-400 mt-3">Showing {products.length} of {totalProducts} products</p>
                  </motion.div>
                )}

                {!hasNextPage && products.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-8 sm:mt-10 pb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800/60 rounded-full">
                      <Check className="w-4 h-4 text-secondary" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">You've viewed all {products.length} products</span>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============== MOBILE FILTER DRAWER (Left) ============== */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-white dark:bg-gray-900 shadow-2xl lg:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  Filters
                  {filterCount && <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">{filterCount}</span>}
                </h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-danger font-medium hover:underline">Clear All</button>
                  )}
                  <button onClick={() => setIsFilterOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filters */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Categories</h4>
                  <div className="space-y-1">
                    {(categories || []).map((cat) => {
                      const isSelected = selectedCategories.includes(cat._id)
                      const metaCat = filterMeta?.categories?.find((c) => c._id === cat._id)
                      return (
                        <label key={cat._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <input type="checkbox" checked={isSelected} onChange={() => toggleCategory(cat._id)} className="sr-only" />
                          </div>
                          <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{cat.name}</span>
                          {metaCat?.count > 0 && <span className="text-xs text-gray-400">({metaCat.count})</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Brands */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Brands</h4>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search brands..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {(filteredBrands || []).map((brand) => {
                      const isSelected = selectedBrands.includes(brand._id)
                      const metaBrand = filterMeta?.brands?.find((b) => b._id === brand._id)
                      return (
                        <label key={brand._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <input type="checkbox" checked={isSelected} onChange={() => toggleBrand(brand._id)} className="sr-only" />
                          </div>
                          <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{brand.name}</span>
                          {metaBrand?.count > 0 && <span className="text-xs text-gray-400">({metaBrand.count})</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Price Range</h4>
                  {!metaLoading && <PriceSlider min={priceMin} max={priceMax} value={priceValue} onChange={handlePriceChange} />}
                  <div className="flex items-center gap-2 mt-3">
                    <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pricePresets.map((p) => {
                      const isActive = filters.minPrice === p.min && filters.maxPrice === p.max
                      return (
                        <button key={p.label} onClick={() => { updateFilter('minPrice', p.min); updateFilter('maxPrice', p.max) }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                        >{p.label}</button>
                      )
                    })}
                  </div>
                </div>

                {/* Customer Rating */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer Rating</h4>
                  <div className="space-y-1">
                    {[
                      { value: '4', stars: 4, label: '4★ & Above' },
                      { value: '3', stars: 3, label: '3★ & Above' },
                      { value: '2', stars: 2, label: '2★ & Above' },
                      { value: '1', stars: 1, label: '1★ & Above' },
                    ].map((opt) => {
                      const isSelected = filters.rating === opt.value
                      return (
                        <label key={opt.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <div className={`relative w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            <input type="radio" name="rating-mobile" checked={isSelected} onChange={() => updateFilter('rating', isSelected ? '' : opt.value)} className="sr-only" />
                          </div>
                          <span className={`flex items-center gap-2 flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            <StarRating filled={opt.stars} /> {opt.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Offers */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Offers</h4>
                  <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${filters.hasOffer === 'true' ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <div className={`relative w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${filters.hasOffer === 'true' ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                      {filters.hasOffer === 'true' && <Check className="w-3 h-3 text-white" />}
                      <input type="checkbox" checked={filters.hasOffer === 'true'} onChange={(e) => updateFilter('hasOffer', e.target.checked ? 'true' : '')} className="sr-only" />
                    </div>
                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">Products With Offers</span>
                    {filterMeta?.offers?.count > 0 && <span className="text-xs text-gray-400">({filterMeta.offers.count})</span>}
                  </label>
                </div>

                {/* Availability */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Availability</h4>
                  <div className="space-y-1">
                    {[
                      { value: 'in_stock', label: 'In Stock', count: filterMeta?.availability?.inStock },
                      { value: 'out_of_stock', label: 'Out of Stock', count: filterMeta?.availability?.outOfStock },
                    ].map((opt) => {
                      const isSelected = filters.availability === opt.value
                      return (
                        <label key={opt.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <div className={`relative w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            <input type="radio" name="avail-mobile" checked={isSelected} onChange={() => updateFilter('availability', isSelected ? '' : opt.value)} className="sr-only" />
                          </div>
                          <span className={`flex-1 text-sm ${isSelected ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{opt.label}</span>
                          {opt.count !== undefined && <span className="text-xs text-gray-400">({opt.count})</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky Apply Button */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button onClick={() => setIsFilterOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  Apply Filters
                  {filterCount && <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">{filterCount}</span>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============== MOBILE SORT SHEET ============== */}
      <AnimatePresence>
        {mobileSortOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSortOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl sm:hidden"
            >
              <div className="pt-3 pb-2 px-5 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Sort By</h3>
              </div>
              <div className="p-3">
                {sortOptions.map((opt) => {
                  const OptIcon = opt.icon
                  const isActive = filters.sort === opt.value
                  return (
                    <button key={opt.value} onClick={() => { updateFilter('sort', opt.value); setMobileSortOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <OptIcon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {opt.label}
                      {isActive && <Check className="w-4 h-4 ml-auto text-primary" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductListPage
