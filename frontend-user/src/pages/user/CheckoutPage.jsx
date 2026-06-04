import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { CreditCard, Truck, MapPin, ChevronRight, Shield, Loader2, AlertCircle, Plus, Banknote, Package, IndianRupee, BadgeCheck, Info, Sparkles, BadgePercent, Tag, Zap } from 'lucide-react'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { getOfferLabel, getOfferTag, formatCurrency } from '../../utils/offerUtils.js'
import toast from 'react-hot-toast'
import { load } from "@cashfreepayments/cashfree-js";

// ─── Inline SVG Icons for Payment Methods ────────────────────────────────────
const VisaIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 sm:h-7 w-auto" fill="none">
    <rect width="48" height="32" rx="4" fill="#1A1F71" />
    <path d="M18.5 22h-3l2-12h3l-2 12zm10.5-12h-2.5c-.8 0-1.4.4-1.7 1l-4 11h3l.6-1.7h3.7l.3 1.7h2.6L29 10zm-3 8.2l1.5-4.3.8 4.3h-2.3zm-9.5-8.2l-3 8.3-.3-1.5c-.6-1.8-2.2-3.8-4.1-4.7l2.7 9.4h3.2l5-12h-3.5zm-6.2 0l-.2.2c-2.2.8-3.6 2.2-3.6 2.2.4-.8 1-2.2 1-2.2l-1.8-2.2H4l2 12h3l-2.2-8.2z" fill="#FFFFFF" />
  </svg>
)

const UPIIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 sm:h-7 w-auto" fill="none">
    <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <text x="24" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1A1F71" fontFamily="Arial">UPI</text>
    <path d="M8 26h32" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const RuPayIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 sm:h-7 w-auto" fill="none">
    <rect width="48" height="32" rx="4" fill="#0033A0" />
    <text x="24" y="19" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">RuPay</text>
  </svg>
)

const NetBankingIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 sm:h-7 w-auto" fill="none">
    <rect width="48" height="32" rx="4" fill="#F59E0B" />
    <text x="24" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">NET</text>
    <text x="24" y="23" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">BANK</text>
  </svg>
)

// ─── Helper: Clean Address for Backend ───────────────────────────────────────
const cleanAddressForOrder = (addr) => ({
  fullName: addr.fullName,
  phone: addr.phone,
  addressLine1: addr.addressLine1,
  addressLine2: addr.addressLine2 || '',
  city: addr.city,
  state: addr.state,
  postalCode: addr.postalCode,
  country: addr.country || 'India',
})

// ─── Helper: Sanitize Cashfree Session ID ────────────────────────────────────
const sanitizeSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') return null
  const match = sessionId.match(/^(session_[a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_SHIPPING_THRESHOLD = 499
const SHIPPING_CHARGE = 49
const GST_RATE = 0.18

// ─── Shipping Progress Bar Component ─────────────────────────────────────────
const ShippingProgressBar = ({ currentAmount, threshold }) => {
  const remaining = threshold - currentAmount
  const progress = Math.min((currentAmount / threshold) * 100, 100)
  const isQualified = currentAmount >= threshold

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
    >
      {/* Progress Track */}
      <div className="relative h-2.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full transition-all duration-500 ${
            isQualified
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
        />
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-full opacity-20 ${
            isQualified ? 'bg-green-400' : 'bg-amber-400'
          }`}
          style={{ filter: 'blur(4px)' }}
        />
      </div>

      {/* Status Message */}
      <div className="mt-2.5 flex items-start gap-2">
        <div className={`mt-0.5 shrink-0 ${isQualified ? 'text-green-500' : 'text-amber-500'}`}>
          {isQualified ? (
            <BadgeCheck className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isQualified ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400"
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Your order qualifies for FREE delivery!
              </span>
            </motion.p>
          ) : (
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
                Add <span className="font-bold">₹{remaining}</span> more for FREE delivery
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Free shipping on orders of ₹{threshold}+
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Checkout Page ──────────────────────────────────────────────────────
const CheckoutPage = () => {
  const { items, totalAmount, discountAmount, offerDiscount, finalAmount } = useSelector((state) => state.cart)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cashfree')
  const [isLoading, setIsLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState([])
  const navigate = useNavigate()

  // ── Shipping & Billing Calculations ──────────────────────────────────────
  const shipping = finalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
  const tax = Math.round(finalAmount * GST_RATE)
  const grandTotal = finalAmount + tax + shipping
  const amountForFreeDelivery = FREE_SHIPPING_THRESHOLD - finalAmount

  // ── Fetch Addresses on Mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/addresses')
        setAddresses(data.addresses || [])
        const defaultAddr = data.addresses?.find((a) => a.isDefault)
        if (defaultAddr) setSelectedAddress(defaultAddr._id)
        else if (data.addresses?.length > 0) setSelectedAddress(data.addresses[0]._id)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load addresses')
      }
    }
    fetchAddresses()
  }, [])

  // ── Place Order Handler ──────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setServerErrors([])

    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }

    setIsLoading(true)
    try {
      const address = addresses.find((a) => a._id === selectedAddress)
      const cleanedAddress = cleanAddressForOrder(address)

      const res = await api.post('/orders', {
        shippingAddress: cleanedAddress,
        paymentMethod,
      })

      const orderId = res.data.order._id

      if (paymentMethod === 'cashfree') {
        try {
          // Create Payment Order
          const paymentRes = await api.post('/payments/create', { orderId })
          const paymentData = paymentRes.data.paymentData

          // Validate Session
          if (!paymentData?.payment_session_id) {
            toast.error('Invalid payment session')
            navigate(`/orders/${orderId}`)
            return
          }

          // Sanitize Session ID
          const sanitizedSessionId = sanitizeSessionId(paymentData.payment_session_id)
          if (!sanitizedSessionId) {
            toast.error('Corrupted payment session')
            navigate(`/orders/${orderId}`)
            return
          }

          // Initialize Cashfree SDK
          const cashfree = await load({
            mode: import.meta.env.VITE_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox',
          })

          // Open Checkout
          await cashfree.checkout({
            paymentSessionId: sanitizedSessionId,
            redirectTarget: '_self',
          })
        } catch (paymentErr) {
          console.error('Cashfree Payment Error:', paymentErr)
          const errMsg = paymentErr.response?.data?.message || paymentErr.message || 'Payment initiation failed'
          toast.error(errMsg + '. Please retry payment.')
          navigate(`/orders/${orderId}`)
        }
      } else {
        // COD — redirect to PaymentSuccessPage so user sees "Order Placed Successfully! Pay on delivery"
        navigate(`/payment/success?order_id=${orderId}`)
      }
    } catch (err) {
      const response = err.response?.data
      if (response?.errors && Array.isArray(response.errors)) {
        setServerErrors(response.errors)
        toast.error(response.message || 'Validation error')
      } else {
        toast.error(response?.message || 'Failed to place order')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Empty Cart State ──────────────────────────────────────────────────────
  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-card rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-gray-200 dark:ring-dark-border">
            <Banknote className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-4">Add items to proceed with checkout</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97]"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ─── Breadcrumb ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 lg:mb-6">
          <button onClick={() => navigate('/cart')} className="hover:text-primary transition-colors cursor-pointer">Cart</button>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-primary font-medium">Checkout</span>
        </div>

        {/* ─── Page Title ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-card px-3 py-1.5 rounded-full border border-gray-100 dark:border-dark-border">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* ─── Server Error Banner ─────────────────────────────────────── */}
        <AnimatePresence>
          {serverErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-danger mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-danger">Order Validation Error</p>
                  <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc list-inside">
                    {serverErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Grid ────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* ═══ Left Column ═══════════════════════════════════════════ */}
          <div className="flex-1 space-y-4 sm:space-y-5 lg:space-y-6">
            {/* ── Delivery Address ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center ring-1 ring-indigo-100 dark:ring-indigo-800/30">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">Delivery Address</h2>
                </div>
                {addresses.length > 0 && (
                  <button
                    onClick={() => navigate('/addresses')}
                    className="text-xs sm:text-sm text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-dark rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ring-gray-200 dark:ring-dark-border">
                    <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-4">No addresses saved yet</p>
                  <button
                    onClick={() => navigate('/addresses')}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97]"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {addresses.map((addr, idx) => (
                    <motion.label
                      key={addr._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddress === addr._id
                          ? 'border-primary bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm'
                          : 'border-gray-100 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-hover hover:bg-gray-50/50 dark:hover:bg-dark/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                        className="mt-1 text-primary accent-primary w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-primary text-[10px] sm:text-xs rounded-full font-medium ring-1 ring-indigo-200/50 dark:ring-indigo-700/30">Default</span>
                          )}
                          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-dark text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs rounded-full capitalize">{addr.addressType}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{addr.phone}</p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Payment Method ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center ring-1 ring-indigo-100 dark:ring-indigo-800/30">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">Payment Method</h2>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {/* Cashfree / Online Payment */}
                <label
                  className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cashfree'
                      ? 'border-primary bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm'
                      : 'border-gray-100 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-hover hover:bg-gray-50/50 dark:hover:bg-dark/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cashfree'}
                    onChange={() => setPaymentMethod('cashfree')}
                    className="text-primary accent-primary w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Online Payment (Cashfree)</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pay securely via UPI, Card, or Net Banking</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <VisaIcon />
                    <UPIIcon />
                    <RuPayIcon />
                    <NetBankingIcon />
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm'
                      : 'border-gray-100 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-hover hover:bg-gray-50/50 dark:hover:bg-dark/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-primary accent-primary w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Cash on Delivery</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pay when you receive your order</p>
                  </div>
                  <div className="w-10 h-7 sm:w-12 sm:h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                  </div>
                </label>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 mt-3 sm:mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl ring-1 ring-green-100 dark:ring-green-800/20">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 leading-relaxed">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ═══ Order Summary - Right Column ═══════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:w-[28rem] shrink-0"
          >
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm lg:sticky lg:top-24 overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">
                    Price Details
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark px-2.5 py-1 rounded-full">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
              </div>

              {/* Cart Items Preview */}
              <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-dark-border">
                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-72 overflow-y-auto scrollbar-thin">
                  {items.map((item) => {
                    const hasOffer = item.offer && item.offer.discountAmount > 0
                    const itemTotal = item.price * item.quantity
                    const discountedTotal = hasOffer
                      ? item.offer.discountedPrice * item.quantity
                      : itemTotal
                    const savedAmount = hasOffer ? item.offer.discountAmount : 0

                    return (
                      <div key={item._id} className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-2.5 sm:p-3">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg overflow-hidden ring-1 ring-gray-100 dark:ring-dark-border">
                            <img
                              src={getImageUrl(item.product?.images?.[0])}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 leading-snug">
                              {item.product?.name || 'Product'}
                            </p>
                            {item.variant && (
                              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {item.variant}
                              </p>
                            )}
                            {/* Offer badge per item */}
                            {hasOffer && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] sm:text-[10px] font-medium rounded-full">
                                  <BadgePercent className="w-2.5 h-2.5" />
                                  {getOfferLabel(item.offer)}
                                </span>
                                {item.offer.title && (
                                  <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">
                                    {item.offer.title}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Price breakdown */}
                            <div className="flex items-baseline gap-1.5 mt-1">
                              {hasOffer ? (
                                <>
                                  <span className="text-xs sm:text-sm font-bold text-danger">
                                    ₹{formatCurrency(discountedTotal)}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                    ₹{formatCurrency(itemTotal)}
                                  </span>
                                  <span className="text-[9px] text-green-600 font-medium">
                                    Save ₹{formatCurrency(savedAmount)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  ₹{formatCurrency(itemTotal)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ═══ Shipping Progress Section ═══════════════════════════ */}
              {finalAmount < FREE_SHIPPING_THRESHOLD && (
                <div className="px-4 sm:px-5 lg:px-6 pt-3 sm:pt-4 pb-2 border-b border-gray-100 dark:border-dark-border bg-amber-50/30 dark:bg-amber-900/5">
                  <ShippingProgressBar
                    currentAmount={finalAmount}
                    threshold={FREE_SHIPPING_THRESHOLD}
                  />
                </div>
              )}

              {/* ═══ Price Breakdown ═══════════════════════════════════════ */}
              <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                {/* Total MRP */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Total MRP</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium tabular-nums">₹{formatCurrency(totalAmount)}</span>
                </div>

                {/* Offer Discount - Show per-offer breakdown */}
                {offerDiscount > 0 && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between items-center"
                    >
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5" /> Offer Discount
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium tabular-nums">-₹{formatCurrency(offerDiscount)}</span>
                    </motion.div>
                    {/* Applied offers detail */}
                    <div className="pl-5 space-y-1">
                      {items.filter(i => i.offer?.discountAmount > 0).map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-[10px] sm:text-[11px] text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1 truncate max-w-[70%]">
                            <BadgePercent className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.offer.title || getOfferLabel(item.offer)}</span>
                          </span>
                          <span className="shrink-0">-₹{formatCurrency(item.offer.discountAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Coupon Discount */}
                {discountAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon Discount
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium tabular-nums">-₹{formatCurrency(discountAmount)}</span>
                  </motion.div>
                )}

                {/* Shipping */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Shipping
                  </span>
                  <AnimatePresence mode="wait">
                    {shipping === 0 ? (
                      <motion.span
                        key="free"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Free
                      </motion.span>
                    ) : (
                      <motion.span
                        key="paid"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-gray-900 dark:text-gray-100 font-medium tabular-nums"
                      >
                        ₹{formatCurrency(shipping)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tax (18% GST) */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Tax (18% GST)
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium tabular-nums">₹{formatCurrency(tax)}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 dark:border-dark-border pt-2 sm:pt-3" />

                {/* Grand Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Order Total</span>
                  <span className="text-sm sm:text-base font-bold text-primary tabular-nums">₹{formatCurrency(grandTotal)}</span>
                </div>

                {/* You Saved Message */}
                {(offerDiscount > 0 || discountAmount > 0 || shipping === 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 p-2 sm:p-2.5 bg-green-50 dark:bg-green-900/10 rounded-lg ring-1 ring-green-100 dark:ring-green-800/20"
                  >
                    <p className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 text-center font-medium flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      You saved ₹{formatCurrency(offerDiscount + discountAmount + shipping)} on this order!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* ═══ Place Order Button ════════════════════════════════════ */}
              <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6">
                <motion.button
                  onClick={handlePlaceOrder}
                  disabled={isLoading || !selectedAddress}
                  whileHover={!isLoading && selectedAddress ? { scale: 1.01 } : {}}
                  whileTap={!isLoading && selectedAddress ? { scale: 0.98 } : {}}
                  className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> Place Order · <IndianRupee className="w-3.5 h-3.5" />{grandTotal}
                    </>
                  )}
                </motion.button>

                {!selectedAddress && addresses.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-danger text-center mt-2 flex items-center justify-center gap-1"
                  >
                    <Info className="w-3 h-3" /> Please select a delivery address
                  </motion.p>
                )}

                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] sm:text-xs text-gray-400 dark:text-gray-500">
                  <Shield className="w-3 h-3" /> Secure SSL Encrypted
                </div>

                {/* Trust badges */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                  <div className="flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Safe & Secure
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" /> Easy Returns
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Fast Delivery
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
