import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import {
  Search, ShoppingCart, Heart, User, Menu, X, Moon, Sun,
  ChevronDown, LogOut, Package, MapPin, Bell, Home, ShoppingBag,
  ClipboardList, LayoutDashboard, LogIn, UserPlus, Info, Phone,
  Grid3X3, BellDot, Sparkles, Gift, Star, Shield, Truck,
  CreditCard, Brain, HeadphonesIcon, RefreshCcw, TrendingUp,
  ArrowRight, ChevronRight, Loader
} from 'lucide-react'
import { logout } from '../../redux/slices/authSlice.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import Logo from '../ui/Logo.jsx'
import api from '../../services/api.js'
import { useNotifications } from '../../context/NotificationContext.jsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [showSearchBar, setShowSearchBar] = useState(false)

  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)
  const debounceTimer = useRef(null)
  const mountedRef = useRef(true)

  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { items } = useSelector((state) => state.cart)
  const wishlistProducts = useSelector((state) => state.wishlist.products)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories')
        setCategories(data.categories?.slice(0, 6) || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchCategories()
  }, [])

  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications()

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsProfileOpen(false)
    setIsNotifOpen(false)
    setShowSuggestions(false)
  }, [location.pathname])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false)
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }
    setSuggestionsLoading(true)
    try {
      const { data } = await api.get(`/products/search?q=${encodeURIComponent(query.trim())}&limit=6`)
      if (!mountedRef.current) return
      setSuggestions(data.products || [])
      setShowSuggestions(true)
    } catch {
      if (!mountedRef.current) return
      setSuggestions([])
    } finally {
      if (mountedRef.current) setSuggestionsLoading(false)
    }
  }, [])

  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (value.trim().length >= 2) {
      setSuggestionsLoading(true)
      debounceTimer.current = setTimeout(() => fetchSuggestions(value), 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSuggestions(false)
      setIsMobileMenuOpen(false)
    }
  }

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product._id}`)
    setSearchQuery('')
    setShowSuggestions(false)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setIsProfileOpen(false)
    setIsMobileMenuOpen(false)
  }

  // Navigation links based on auth status
  const publicLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Categories', path: '/products', icon: Grid3X3 },
    { name: 'Contact', path: '/contact', icon: Phone },
  ]

  const authLinks = [
    { name: 'Dashboard', path: '/profile', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Orders', path: '/orders', icon: ClipboardList },
  ]

  const bottomNavLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop', path: '/products', icon: ShoppingBag },
    { name: 'Cart', path: '/cart', icon: ShoppingCart, badge: true },
    { name: 'Wishlist', path: '/wishlist', icon: Heart, badge: true },
    { name: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: User },
  ]

  const cartCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const unreadNotifs = unreadCount

  return (
    <>
      {/* ===================== DESKTOP & MOBILE TOP NAVBAR ===================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/85 dark:bg-dark/85 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-white/5 border-b border-gray-100/50 dark:border-dark-border/50'
            : 'bg-white dark:bg-dark'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-[70px]">
            <div className="flex items-center gap-2 sm:gap-4">
              <Logo />
              <Link to="/products" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full text-xs font-semibold text-primary border border-primary/20 hover:from-primary hover:to-primary-dark hover:text-white transition-all duration-300">
                <ShoppingBag className="w-3.5 h-3.5" />
                Shop
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-10 relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                    placeholder="Search products, categories..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-12 pr-12 py-2.5 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary/50 focus:bg-white dark:focus:bg-dark focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  {suggestionsLoading ? (
                    <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-dark-hover rounded-md border border-gray-300 dark:border-dark-border">
                      <span>⌘</span>K
                    </kbd>
                  )}
                </div>
              </form>

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-2 w-full bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      {suggestions.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => handleSuggestionClick(product)}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                            <img
                              src={getImageUrl(product.thumbnail || product.images?.[0]) || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/placeholder.svg' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.category?.name || 'Product'}
                            </p>
                          </div>
                          <div className="text-sm font-bold text-primary shrink-0">
                            ₹{product.price}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 dark:border-dark-border p-2">
                      <button
                        onClick={handleSearch}
                        className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary font-medium text-sm transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.85 }}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors overflow-hidden"
                aria-label="Toggle theme"
              >
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                </motion.div>
              </motion.button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors"
                    aria-label="Notifications"
                  >
                    {unreadNotifs > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[8px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-dark">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button onClick={() => markAllAsRead()} className="text-xs text-primary hover:underline">Mark all read</button>
                            )}
                            <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="text-xs text-primary hover:underline">View All</Link>
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center">
                              <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                              <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((notif) => (
                              <div
                                key={notif._id}
                                onClick={() => { if (!notif.isRead) markAsRead(notif._id); setIsNotifOpen(false) }}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer border-b border-gray-50 dark:border-dark-border/50 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                              >
                                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-primary to-secondary text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-dark shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User / Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card transition-colors pl-2"
                  >
                    {user?.avatar ? (
                      <img src={getImageUrl(user.avatar)} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-border" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hidden lg:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden"
                      >
                        <div className="p-5 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-gray-50 to-white dark:from-dark dark:to-dark-card">
                          <div className="flex items-center gap-3">
                            {user?.avatar ? (
                              <img src={getImageUrl(user.avatar)} alt="avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user?.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-colors text-sm">
                            <LayoutDashboard className="w-4 h-4 text-primary" /> Dashboard
                          </Link>
                          <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-colors text-sm">
                            <Package className="w-4 h-4 text-secondary" /> My Orders
                          </Link>
                          <Link to="/wishlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-colors text-sm">
                            <Heart className="w-4 h-4 text-danger" /> Wishlist
                          </Link>
                          <Link to="/addresses" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-colors text-sm">
                            <MapPin className="w-4 h-4 text-info" /> Addresses
                          </Link>
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-dark-border">
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-danger w-full text-left transition-colors text-sm font-medium">
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium text-sm">
                  <User className="w-4 h-4" /> Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 dark:text-gray-400 transition-colors ml-1"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (collapsible) */}
          <AnimatePresence>
            {showSearchBar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
              >
                <form onSubmit={handleSearch} className="pb-3 pt-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search products..."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary/50 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Bar - Desktop */}
        <div className="hidden lg:block border-t border-gray-100/80 dark:border-dark-border/50 bg-white/50 dark:bg-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 h-11">
              {categories.map((cat, i) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="relative px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Link to="/products" className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors whitespace-nowrap rounded-lg hover:bg-primary/5">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ===================== MOBILE FULL-SCREEN DRAWER ===================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Glass Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-dark shadow-2xl overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 p-4 border-b border-gray-100 dark:border-dark-border bg-white/95 dark:bg-dark/95 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <Link to="/" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary-light to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ShopHub</span>
                  </Link>
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    whileTap={{ scale: 0.85 }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mt-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-lg" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search products..."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary/50 focus:bg-white dark:focus:bg-dark-hover outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm transition-all"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </form>
              </div>

              {/* User Info (if logged in) */}
              {isAuthenticated && (
                <div className="mx-3 mt-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 border border-primary/10 dark:border-primary/20">
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img src={getImageUrl(user.avatar)} alt="avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-3 py-4"
              >
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                  Navigation
                </p>
                {(isAuthenticated ? authLinks : publicLinks).map((link) => (
                  <motion.div key={link.path} variants={itemVariants}>
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                        location.pathname === link.path
                          ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-semibold shadow-sm'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-card'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        location.pathname === link.path
                          ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        <link.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{link.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${
                        location.pathname === link.path ? 'text-primary' : 'text-gray-300 dark:text-gray-600'
                      }`} />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="px-3 py-2">
                  <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                    Categories
                  </p>
                  <div className="grid grid-cols-2 gap-2 px-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/products?category=${cat._id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-primary/5 dark:hover:bg-primary/10 text-gray-600 dark:text-gray-300 hover:text-primary transition-all text-sm font-medium border border-gray-100 dark:border-dark-border"
                      >
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="px-3 py-2 mt-2">
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2 px-2">
                  <button
                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false) }}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-all text-sm border border-gray-100 dark:border-dark-border"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-700 dark:text-gray-200 transition-all text-sm border border-gray-100 dark:border-dark-border"
                  >
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <span>Cart ({cartCount})</span>
                  </Link>
                </div>
              </div>

              {/* Auth Footer */}
              {!isAuthenticated && (
                <div className="px-3 py-4 border-t border-gray-100 dark:border-dark-border mt-4">
                  <div className="flex gap-3 px-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                      <LogIn className="w-4 h-4" /> Login
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-200 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-dark-hover transition-all border border-gray-200 dark:border-dark-border"
                    >
                      <UserPlus className="w-4 h-4" /> Register
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away overlays */}
      {isProfileOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />}
      {isNotifOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />}

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-[114px]" />

      {/* ===================== BOTTOM NAVIGATION (MOBILE) ===================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-dark-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                location.pathname === link.path
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <link.icon className="w-5 h-5" />
                {link.badge && link.name === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-gradient-to-br from-primary to-secondary text-white text-[8px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-dark">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
                {link.badge && link.name === 'Wishlist' && wishlistProducts?.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-danger text-white text-[8px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-dark">
                    {wishlistProducts.length > 9 ? '9+' : wishlistProducts.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom nav spacer */}
      <div className="h-16 md:hidden" />
    </>
  )
}

export default Navbar