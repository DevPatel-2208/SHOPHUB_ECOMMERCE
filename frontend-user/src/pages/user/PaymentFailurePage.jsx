import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCw, ShoppingBag, Home, HelpCircle, Loader2 } from 'lucide-react'
import api from '../../services/api.js'
import toast from 'react-hot-toast'

const PaymentFailurePage = () => {
  const [searchParams] = useSearchParams()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const navigate = useNavigate()

  const orderId = searchParams.get('order_id') || searchParams.get('orderId')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (orderId) {
          const { data } = await api.get(`/orders/${orderId}`)
          setOrderData(data.order)
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  /**
   * Sanitize a Cashfree payment_session_id by stripping any extraneous characters
   * that may be appended due to API response corruption (e.g., "paymentpayment").
   */
  const sanitizeSessionId = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') return null;
    const match = sessionId.match(/^(session_[a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleRetry = async () => {
    if (!orderId) return
    setRetrying(true)
    try {
      const paymentRes = await api.post('/payments/create', { orderId })
      const paymentData = paymentRes.data.paymentData
      // Use checkout_url (from backend) or construct from payment_session_id
      if (paymentData?.checkout_url) {
        window.location.href = paymentData.checkout_url
      } else if (paymentData?.payment_session_id) {
        // Fallback: sanitize the session_id then construct the Cashfree checkout URL manually
        const sanitizedSessionId = sanitizeSessionId(paymentData.payment_session_id)
        if (!sanitizedSessionId) {
          toast.error('Invalid payment session. Please try again.')
          return
        }
        const isProduction = import.meta.env.VITE_CASHFREE_ENVIRONMENT === 'PRODUCTION'
        const baseUrl = isProduction
          ? 'https://payments.cashfree.com/order/#'
          : 'https://payments-test.cashfree.com/order/#'
        window.location.href = `${baseUrl}${sanitizedSessionId}`
      } else {
        toast.error('Could not initiate payment. Please try again.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry payment')
    } finally {
      setRetrying(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!orderId) return
    try {
      await api.post(`/orders/${orderId}/cancel`)
      toast.success('Order cancelled successfully')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-8 sm:py-12 lg:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Failure Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-dark-border shadow-sm text-center"
        >
          {/* Failure Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
          >
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Payment Failed
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8"
          >
            Unfortunately, your payment could not be processed. Don't worry — you haven't been charged.
          </motion.p>

          {/* Order Info */}
          {orderData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-50 dark:bg-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left"
            >
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-all">
                    #{orderData._id}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-dark-border"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                    ₹{orderData.totalPrice?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-dark-border"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Payment Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    Failed
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 mb-6 sm:mb-8"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium mb-1">
                  Common reasons for payment failure:
                </p>
                <ul className="text-yellow-600 dark:text-yellow-500 text-xs sm:text-sm space-y-1 list-disc list-inside">
                  <li>Insufficient balance in your account</li>
                  <li>Bank server timeout or connectivity issue</li>
                  <li>Incorrect card details or expired card</li>
                  <li>Payment cancelled during processing</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {retrying ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Try Again
                </>
              )}
            </button>
            {orderId && (
              <button
                onClick={handleCancelOrder}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm sm:text-base"
              >
                Cancel Order
              </button>
            )}
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              Shop More
            </Link>
          </motion.div>
        </motion.div>

        {/* Support Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          Need help?{' '}
          <Link to="/" className="text-primary hover:underline">
            Contact Support
          </Link>
        </motion.p>
      </div>
    </div>
  )
}

export default PaymentFailurePage