import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ShoppingBag, Home, ChevronRight, Loader2, AlertCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import api from '../../services/api.js'
import toast from 'react-hot-toast'

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState(null) // 'success' | 'pending' | 'failed'
  const navigate = useNavigate()

  const orderId = searchParams.get('order_id') || searchParams.get('orderId')

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (orderId) {
          // First fetch the order to see current status
          const { data } = await api.get(`/orders/${orderId}`)
          const order = data.order

          // If payment is already marked as paid, show success
          if (order.paymentStatus === 'paid') {
            setOrderData(order)
            setVerifyStatus('success')
          } else if (order.paymentStatus === 'failed') {
            // Payment failed
            setOrderData(order)
            setVerifyStatus('failed')
          } else {
            // Payment still pending — try backend verification
            setVerifying(true)
            try {
              const verifyRes = await api.post(`/payments/verify`, { orderId })
              if (verifyRes.data.success) {
                // Re-fetch updated order
                const { data: updatedData } = await api.get(`/orders/${orderId}`)
                setOrderData(updatedData.order)
                setVerifyStatus('success')
                toast.success('Payment verified successfully!')
              } else {
                setOrderData(order)
                setVerifyStatus('pending')
              }
            } catch (verifyErr) {
              console.error('Verification failed:', verifyErr)
              setOrderData(order)
              setVerifyStatus('pending')
            } finally {
              setVerifying(false)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setVerifyStatus('pending')
      } finally {
        setLoading(false)
      }
    }
    verifyPayment()
  }, [orderId])

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {verifying ? 'Verifying your payment...' : 'Loading order details...'}
          </p>
          {verifying && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Please wait while we confirm your payment
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Payment Pending (Not yet verified) ────────────────────────────────────────
  if (verifyStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark py-8 sm:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-dark-border shadow-sm text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
            >
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-400" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Pending
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
              Your payment is being processed. This may take a few moments.
            </p>

            {orderData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 dark:bg-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm break-all">
                      #{orderData._id}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-dark-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                      ₹{orderData.totalPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-dark-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Payment Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                      Verifying
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4 mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-primary text-sm font-medium mb-1">
                    Payment confirmation may take a moment
                  </p>
                  <p className="text-primary/70 text-xs">
                    Your order has been placed. We're waiting for payment confirmation from the gateway.
                    You can check your order status later in "My Orders".
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Check Again
              </button>
              <button
                onClick={() => orderId ? navigate(`/orders/${orderId}`) : navigate('/orders')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> View Order
              </button>
            </div>

            <div className="text-center mt-6">
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
                <Home className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Payment Failed ──────────────────────────────────────────────────────────
  if (verifyStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark py-8 sm:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-dark-border shadow-sm text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
            >
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
              Unfortunately, your payment was not successful. You haven't been charged.
            </p>

            {orderData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 dark:bg-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 text-left"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Order ID</span>
                    <span className="font-semibold text-gray-900 text-sm break-all">#{orderData._id}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-dark-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-bold text-gray-900 text-lg">₹{orderData.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-dark-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Payment Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      Failed
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => orderId && navigate(`/payment/failure?order_id=${orderId}`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry Payment
              </button>
              <Link
                to="/orders"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> My Orders
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Payment Success ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-8 sm:py-12 lg:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Success Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-dark-border shadow-sm text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
          >
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
          </motion.div>

          {/* Title - Conditional for COD vs Online */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {orderData?.paymentMethod === 'cod' ? 'Order Placed Successfully!' : 'Payment Successful!'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8"
          >
            {orderData?.paymentMethod === 'cod'
              ? 'Thank you for your order. You can pay when your order is delivered.'
              : 'Your payment has been verified successfully. Your order is confirmed.'
            }
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
                <div className="border-t border-gray-200 dark:border-dark-border" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                    ₹{orderData.totalPrice?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-dark-border" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Payment Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {orderData.paymentMethod === 'cod' ? 'Pending (COD)' : 'Paid'}
                  </span>
                </div>
                {orderData.paymentMethod && (
                  <>
                    <div className="border-t border-gray-200 dark:border-dark-border" />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {orderData.paymentMethod === 'cashfree' ? 'Online Payment' : orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod}
                      </span>
                    </div>
                  </>
                )}
                {orderData.paymentMethod === 'cod' && (
                  <>
                    <div className="border-t border-gray-200 dark:border-dark-border" />
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 -mx-1">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Pay ₹{orderData.totalPrice?.toLocaleString()} when your order is delivered
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Confirmation Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className={`rounded-xl p-4 mb-6 sm:mb-8 ${
              orderData?.paymentMethod === 'cod'
                ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30'
                : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30'
            }`}
          >
            <p className={`text-sm ${
              orderData?.paymentMethod === 'cod'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-green-700 dark:text-green-400'
            }`}>
              {orderData?.paymentMethod === 'cod'
                ? 'Your order has been placed. Please keep the exact change ready at the time of delivery.'
                : 'A confirmation email has been sent to your registered email address with order details.'
              }
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={() => orderId ? navigate(`/orders/${orderId}`) : navigate('/orders')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors text-sm sm:text-base"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              View Order
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom link */}
        <div className="text-center mt-6 sm:mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage