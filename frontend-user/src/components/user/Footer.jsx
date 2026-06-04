import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext.jsx'
import {
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin,
  Sun, Moon, ArrowUp, Heart, ChevronDown, ChevronRight
} from 'lucide-react'
import api from '../../services/api.js'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { isDark, toggleTheme } = useTheme()
  const [categories, setCategories] = useState([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories')
        if (data.categories) setCategories(data.categories.slice(0, 5))
      } catch (err) { /* silent */ }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const footerLinks = [
    {
      title: 'Quick Links',
      key: 'quick',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms & Conditions', path: '/terms' },
        { name: 'Help Center', path: '/help' },
      ],
    },
    {
      title: 'Categories',
      key: 'categories',
      links: categories.length > 0
        ? categories.map(cat => ({ name: cat.name, path: `/products?category=${cat._id}` }))
        : [{ name: 'Electronics', path: '/products' }, { name: 'Fashion', path: '/products' }, { name: 'Home & Living', path: '/products' }, { name: 'Sports', path: '/products' }, { name: 'Books', path: '/products' }],
    },
    {
      title: 'Contact',
      key: 'contact',
      links: [
        { name: '123 Business Park, Tech City, India - 110001', icon: MapPin, href: null },
        { name: '+91 98765 43210', icon: Phone, href: 'tel:+919876543210' },
        { name: 'support@shophubx.com', icon: Mail, href: 'mailto:support@shophubx.com' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 dark:bg-[#0a0a0f] text-gray-300 transition-colors duration-300 relative">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column - spans full width on mobile */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
ShopHubX
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm">
              Your one-stop destination for premium products. Quality guaranteed with fast delivery across India. Smart shopping with AI recommendations.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2.5 mb-6">
              {[
                { icon: Facebook, href: '#', color: 'hover:bg-blue-600' },
                { icon: Twitter, href: '#', color: 'hover:bg-sky-500' },
                { icon: Instagram, href: '#', color: 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-600' },
                { icon: Youtube, href: '#', color: 'hover:bg-red-600' },
              ].map(({ icon: Icon, href, color }, i) => (
                <a
                  key={i}
                  href={href}
                  className={`w-10 h-10 rounded-full bg-gray-800 dark:bg-dark flex items-center justify-center hover:scale-110 transition-all duration-200 ${color}`}
                  aria-label={`Social media ${i}`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>


          </div>

          {/* Footer Link Sections */}
          {footerLinks.map((section) => (
            <div key={section.key} className="lg:col-span-1">
              {/* Desktop Header */}
              <h3 className="hidden lg:block text-white font-semibold mb-5 text-sm uppercase tracking-wider">
                {section.title}
              </h3>

              {/* Mobile Collapsible Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="lg:hidden flex items-center justify-between w-full py-3 text-white font-semibold text-sm uppercase tracking-wider border-b border-gray-800 dark:border-dark-border"
              >
                {section.title}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedSections[section.key] ? 'rotate-180' : ''}`} />
              </button>

              {/* Links (always visible on desktop, collapsible on mobile) */}
              <div className={`lg:block ${expandedSections[section.key] ? 'block' : 'hidden'} mt-3 lg:mt-0`}>
                <ul className="space-y-2.5 lg:space-y-3">
                  {section.links.map((item) => (
                    <li key={item.name}>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                        >
                          {item.icon && <item.icon className="w-4 h-4 text-primary shrink-0" />}
                          <span>{item.name}</span>
                          {!item.icon && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </a>
                      ) : item.icon ? (
                        <div className="flex items-start gap-2.5 text-sm text-gray-400">
                          <item.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item.name}</span>
                        </div>
                      ) : (
                        <Link
                          to={item.path}
                          className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                        >
                          <span>{item.name}</span>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              © {currentYear} ShopHubX. Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 dark:bg-dark hover:bg-gray-700 dark:hover:bg-dark-card/80 text-gray-400 transition-colors text-sm"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </motion.button>

              {/* Payment Methods */}
              <div className="flex items-center gap-2">
                {['Visa', 'MC', 'UPI'].map((pm, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] font-bold text-gray-500 bg-gray-800 dark:bg-dark rounded-md border border-gray-700 dark:border-dark-border">
                    {pm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-110 transition-all duration-200 z-40"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  )
}

export default Footer
