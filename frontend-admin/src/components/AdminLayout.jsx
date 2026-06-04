import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext.jsx'
import {
  LayoutDashboard, PackagePlus, ShoppingBag, Star, FolderTree,
  Layers, Award, SlidersHorizontal, Box, Percent, ListChecks,
  ClipboardList, Users, Mail, MailPlus, LogOut, Menu, X,
  Search, Sun, Moon, ChevronLeft, ChevronDown, Settings
} from 'lucide-react'
import { logout } from '../redux/slices/authSlice.js'
import Logo from './ui/Logo.jsx'
import NotificationBell from './notifications/NotificationBell.jsx'
import NotificationToast from './notifications/NotificationToast.jsx'

const sidebarSections = [
  {
    title: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    title: 'PRODUCT MANAGEMENT',
    items: [
      { icon: PackagePlus, label: 'Add Product', path: '/products/new' },
      { icon: ShoppingBag, label: 'All Products', path: '/products' },
      { icon: Star, label: 'Product Reviews', path: '/reviews' },
    ],
  },
  {
    title: 'CATEGORY MANAGEMENT',
    items: [
      { icon: FolderTree, label: 'Categories', path: '/categories' },
      { icon: Layers, label: 'Subcategories', path: '/subcategories' },
    ],
  },
  {
    title: 'BRAND MANAGEMENT',
    items: [
      { icon: Award, label: 'Brands', path: '/brands' },
    ],
  },
  {
    title: 'ATTRIBUTE MANAGEMENT',
    items: [
      { icon: SlidersHorizontal, label: 'Attributes', path: '/attributes' },
      { icon: Box, label: 'Product Attributes', path: '/product-attributes' },
    ],
  },
  {
    title: 'OFFER MANAGEMENT',
    items: [
      { icon: Percent, label: 'Add Offer', path: '/offers/new' },
      { icon: ListChecks, label: 'Offer List', path: '/offers' },
    ],
  },
  {
    title: 'ORDER MANAGEMENT',
    items: [
      { icon: ClipboardList, label: 'Orders', path: '/orders' },
    ],
  },
  {
    title: 'CUSTOMER MANAGEMENT',
    items: [
      { icon: Users, label: 'Customers', path: '/customers' },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      { icon: Mail, label: 'Subscribers', path: '/subscribers' },
      { icon: MailPlus, label: 'Send Newsletter', path: '/newsletter' },
    ],
  },
]

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const { user } = useSelector((state) => state.auth)
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const toggleSection = (title) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const isSectionCollapsed = (title) => collapsedSections[title] || false

  const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-[70px]'
  const sidebarMargin = isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]'

  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      {/* ====== DESKTOP SIDEBAR (lg and above) ====== */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border transition-all duration-300 ease-in-out ${sidebarWidth}`}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center border-b border-light-border dark:border-dark-border px-4 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size="md" showText={isSidebarOpen} linkTo="/" />
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 dark:text-gray-500 transition-colors shrink-0"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto sidebar-scroll">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-1">
              {/* Section Title */}
              <AnimatePresence mode="wait">
                {isSidebarOpen ? (
                  <motion.button
                    key="full-title"
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    <span className="whitespace-nowrap overflow-hidden">{section.title}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isSectionCollapsed(section.title) ? '-rotate-90' : ''}`} />
                  </motion.button>
                ) : (
                  <motion.div
                    key="mini-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-2"
                  >
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {section.title.charAt(0)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Items */}
              <AnimatePresence initial={false}>
                {!isSectionCollapsed(section.title) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={isSidebarOpen ? 'space-y-0.5' : 'space-y-1'}>
                      {section.items.map((item) => {
                        const active = isActive(item.path)
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            title={!isSidebarOpen ? item.label : undefined}
                            className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${!isSidebarOpen ? 'sidebar-item-mini' : ''}`}
                          >
                            <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary dark:text-primary-light' : ''}`} />
                            <AnimatePresence mode="wait">
                              {isSidebarOpen && (
                                <motion.span
                                  key="label"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="whitespace-nowrap overflow-hidden"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Bottom Section: Theme + Logout */}
        <div className="p-2 border-t border-light-border dark:border-dark-border shrink-0">
          <button
            onClick={toggleTheme}
            title={!isSidebarOpen ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
            className={`sidebar-item sidebar-item-inactive w-full ${!isSidebarOpen ? 'sidebar-item-mini' : ''}`}
          >
            {isDark ? <Sun className="w-5 h-5 shrink-0 text-yellow-500" /> : <Moon className="w-5 h-5 shrink-0 text-indigo-400" />}
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span
                  key="theme-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={handleLogout}
            title={!isSidebarOpen ? 'Logout' : undefined}
            className={`sidebar-item text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full ${!isSidebarOpen ? 'sidebar-item-mini' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span
                  key="logout-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* ====== MAIN CONTENT AREA ====== */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarMargin}`}>
        {/* ====== HEADER ====== */}
        <header className="h-16 bg-white dark:bg-dark-card border-b border-light-border dark:border-dark-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          {/* Left side: Mobile menu + Desktop toggle + Search */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button (below lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop sidebar toggle (lg and above) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-600 dark:text-gray-300 transition-colors items-center justify-center"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-xl bg-light dark:bg-dark border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm w-40 lg:w-64 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>
          </div>

          {/* Right side: Theme + Notifications + User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-600 dark:text-gray-300 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-light-border dark:border-dark-border">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* ====== MOBILE SIDEBAR OVERLAY (below lg) ====== */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Slide-in Panel */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white dark:bg-dark-card shadow-2xl flex flex-col"
              >
                {/* Mobile Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-light-border dark:border-dark-border shrink-0">
                  <Logo size="md" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-600 dark:text-gray-300 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 py-2 px-2 overflow-y-auto sidebar-scroll">
                  {sidebarSections.map((section) => (
                    <div key={section.title} className="mb-2">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {section.title}
                      </div>
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const active = isActive(item.path)
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                            >
                              <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary dark:text-primary-light' : ''}`} />
                              <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                {/* Mobile Bottom */}
                <div className="p-2 border-t border-light-border dark:border-dark-border shrink-0">
                  <button
                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false) }}
                    className="sidebar-item sidebar-item-inactive w-full"
                  >
                    {isDark ? <Sun className="w-5 h-5 text-yellow-500 shrink-0" /> : <Moon className="w-5 h-5 text-indigo-400 shrink-0" />}
                    <span className="whitespace-nowrap">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }}
                    className="sidebar-item text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== PAGE CONTENT ====== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-light dark:bg-dark">
          <Outlet />
        </main>
      </div>

      {/* ====== GLOBAL NOTIFICATION TOAST ====== */}
      <NotificationToast />
    </div>
  )
}

export default AdminLayout
