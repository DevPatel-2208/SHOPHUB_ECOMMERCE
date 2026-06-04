import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from './context/ThemeContext.jsx'
import { fetchCart } from './redux/slices/cartSlice.js'
import { fetchWishlist } from './redux/slices/wishlistSlice.js'
import Navbar from './components/user/Navbar.jsx'
import Footer from './components/user/Footer.jsx'
import HomePage from './pages/user/HomePage.jsx'
import ProductListPage from './pages/user/ProductListPage.jsx'
import ProductDetailPage from './pages/user/ProductDetailPage.jsx'
import CartPage from './pages/user/CartPage.jsx'
import CheckoutPage from './pages/user/CheckoutPage.jsx'
import PaymentSuccessPage from './pages/user/PaymentSuccessPage.jsx'
import PaymentFailurePage from './pages/user/PaymentFailurePage.jsx'
import MyOrdersPage from './pages/user/MyOrdersPage.jsx'
import OrderDetailPage from './pages/user/OrderDetailPage.jsx'
import WishlistPage from './pages/user/WishlistPage.jsx'
import ProfilePage from './pages/user/ProfilePage.jsx'
import AddressBookPage from './pages/user/AddressBookPage.jsx'
import LoginPage from './pages/user/LoginPage.jsx'
import ForgotPasswordPage from './pages/user/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/user/ResetPasswordPage.jsx'
import AuthSuccessPage from './pages/user/AuthSuccessPage.jsx'
import SearchResultsPage from './pages/user/SearchResultsPage.jsx'
import TrackOrderPage from './pages/user/TrackOrderPage.jsx'
import NotificationPage from './pages/user/NotificationPage.jsx'
import PageNotFound from './pages/common/PageNotFound.jsx'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
)

function App() {
  const location = useLocation()
  const { isDark } = useTheme()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Fetch cart and wishlist when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
      dispatch(fetchWishlist())
    }
  }, [isAuthenticated, dispatch])

  const noNavFooter = ['/login', '/forgot-password', '/auth/success'].some((p) => location.pathname.startsWith(p))

  const toastStyle = isDark
    ? { borderRadius: '12px', background: '#1F2937', color: '#F3F4F6', border: '1px solid #374151' }
    : { borderRadius: '12px', background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }

  return (
    <div className="min-h-screen bg-white dark:bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: toastStyle,
          success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
        }}
      />
      {!noNavFooter && <Navbar />}
      <main className="min-h-[calc(100vh-200px)]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/products" element={<PageWrapper><ProductListPage /></PageWrapper>} />
            <Route path="/product/:id" element={<PageWrapper><ProductDetailPage /></PageWrapper>} />
            <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
            <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
            <Route path="/payment/success" element={<PageWrapper><PaymentSuccessPage /></PageWrapper>} />
            <Route path="/payment/failure" element={<PageWrapper><PaymentFailurePage /></PageWrapper>} />
            <Route path="/orders" element={<PageWrapper><MyOrdersPage /></PageWrapper>} />
            <Route path="/orders/:id" element={<PageWrapper><OrderDetailPage /></PageWrapper>} />
            <Route path="/wishlist" element={<PageWrapper><WishlistPage /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
            <Route path="/addresses" element={<PageWrapper><AddressBookPage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
            <Route path="/reset-password/:token" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route path="/search" element={<PageWrapper><SearchResultsPage /></PageWrapper>} />
            <Route path="/track-order" element={<PageWrapper><TrackOrderPage /></PageWrapper>} />
            <Route path="/notifications" element={<PageWrapper><NotificationPage /></PageWrapper>} />
            <Route path="*" element={<PageWrapper><PageNotFound /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!noNavFooter && <Footer />}
    </div>
  )
}

export default App
