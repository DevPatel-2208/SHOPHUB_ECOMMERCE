import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Download, Truck, MapPin, CreditCard, RefreshCw, ShoppingBag, AlertCircle, X, Shield, BadgeCheck, Percent, Package, IndianRupee, Calendar, Clock, HelpCircle, Loader2 } from 'lucide-react'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { StatusBadge, OrderTimeline } from '../../components/user/OrderComponents.jsx'
import toast from 'react-hot-toast'

const OrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [returning, setReturning] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [returnReason, setReturnReason] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data.order)
      } catch (err) {
        console.error('Failed to fetch order:', err)
        toast.error('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const downloadInvoice = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Invoice download failed:', err)
      toast.error('Failed to download invoice')
    } finally {
      setDownloading(false)
    }
  }

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason || 'Cancelled by customer' })
      toast.success('Order cancelled successfully')
      setShowCancelModal(false)
      // Refresh order data
      const { data } = await api.get(`/orders/${id}`)
      setOrder(data.order)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleReturnRequest = async () => {
    setReturning(true)
    try {
      await api.post(`/orders/${id}/return`, { reason: returnReason || 'Return requested by customer' })
      toast.success('Return request submitted successfully')
      setShowReturnModal(false)
      const { data } = await api.get(`/orders/${id}`)
      setOrder(data.order)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request')
    } finally {
      setReturning(false)
    }
  }

  const canCancel = order && ['pending', 'processing'].includes(order.status) && order.paymentMethod !== 'cod'
  const canReturn = order && order.status === 'delivered' && !order.returnRequested
  const isPaid = order?.isPaid

  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Not Found ────────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-card rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-gray-200 dark:ring-dark-border">
            <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order not found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  // Remove duplicate variable declaration
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ─── Back Button ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-4 sm:mb-5"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </motion.div>

        {/* ─── Order Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6 mb-4 sm:mb-5 lg:mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  Order #{order._id.toString().slice(-8).toUpperCase()}
                </h1>
                <StatusBadge type="tracking" value={order.trackingStatus} />
                <StatusBadge type="payment" value={order.paymentStatus} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className="capitalize flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {order.paymentMethod === 'cashfree' ? 'Online Payment' : 'Cash on Delivery'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={downloadInvoice}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Invoice</span>
              </button>
              {order.shipmentRef?.awb && (
                <Link
                  to={`/track-order?awb=${order.shipmentRef.awb}`}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Track</span>
                </Link>
              )}
            </div>
          </div>

          {/* Delivery estimate */}
          {order.deliveryEstimate && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl ring-1 ring-indigo-100 dark:ring-indigo-800/20">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-primary">Estimated Delivery</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {new Date(order.deliveryEstimate).toLocaleDateString('en-IN', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Main Content Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* ═══ Left Column (2/3) ════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            {/* ── Order Timeline ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
            >
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Order Timeline
              </h2>
              <OrderTimeline timeline={order.timeline} />
            </motion.div>

            {/* ── Order Items ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Ordered Items ({order.orderItems?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-dark-border">
                {order.orderItems?.map((item) => (
                  <div key={item._id} className="flex items-start gap-3 sm:gap-4 py-3 sm:py-4 first:pt-0 last:pb-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden ring-1 ring-gray-100 dark:ring-dark-border shrink-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-1">
                        {item.name}
                      </h3>
                      {item.sku && (
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                      {item.variant && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.variant.color && <span>Color: {item.variant.color}</span>}
                          {item.variant.color && item.variant.size && <span> | </span>}
                          {item.variant.size && <span>Size: {item.variant.size}</span>}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 sm:mt-2">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          ₹{item.price}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white ml-auto">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Cancel / Return Request Section ────────────────────────── */}
            {(canCancel || canReturn) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
              >
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Order Actions
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {canCancel && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-900/50"
                    >
                      <X className="w-4 h-4" /> Cancel Order
                    </button>
                  )}
                  {canReturn && (
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-900/50"
                    >
                      <RefreshCw className="w-4 h-4" /> Request Return
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* ═══ Right Column (1/3) ═══════════════════════════════════════ */}
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* ── Payment Details ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
            >
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Payment Details
              </h2>
              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {order.paymentMethod === 'cashfree' ? 'Online Payment (Cashfree)' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Payment Status</span>
                  <StatusBadge type="payment" value={order.paymentStatus} />
                </div>
                {order.paymentResult?.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                    <span className="font-medium text-gray-900 dark:text-white text-[11px] sm:text-xs break-all text-right max-w-[160px]">
                      {order.paymentResult.transactionId}
                    </span>
                  </div>
                )}
                {order.paymentResult?.gateway && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Gateway</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{order.paymentResult.gateway}</span>
                  </div>
                )}
                {order.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Paid on</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(order.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {order.paymentResult?.refundStatus === 'processing' && (
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg ring-1 ring-blue-100 dark:ring-blue-800/20 mt-2">
                    <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" />
                      Refund is being processed
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Shipping Address ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
            >
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Shipping Address
              </h2>
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-500 dark:text-gray-400">{order.shippingAddress?.phone}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {order.shippingAddress?.addressLine1}
                  {order.shippingAddress?.addressLine2 && <>, {order.shippingAddress.addressLine2}</>}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </p>
                {order.shippingAddress?.landmark && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
                <p className="text-gray-500 dark:text-gray-400">{order.shippingAddress?.country}</p>
              </div>
            </motion.div>

            {/* ── Order Summary ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm p-4 sm:p-5 lg:p-6"
            >
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Order Summary
              </h2>
              <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">₹{(order.itemsPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                  <span className={`font-medium tabular-nums ${order.shippingPrice === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tax (18% GST)</span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">₹{(order.taxPrice || 0).toLocaleString()}</span>
                </div>

                {/* Discount Section */}
                {(order.discountPrice > 0 || order.couponCode || order.offerName) && (
                  <div className="border-t border-gray-100 dark:border-dark-border pt-2 sm:pt-2.5 space-y-2">
                    {order.discountPrice > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Discount
                        </span>
                        <span className="font-medium tabular-nums">-₹{(order.discountPrice || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {order.couponCode && (
                      <div className="flex justify-between text-primary">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Coupon
                        </span>
                        <span className="font-medium text-xs">{order.couponCode}</span>
                      </div>
                    )}
                    {order.offerName && (
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Offer
                        </span>
                        <span className="font-medium text-xs">{order.offerName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 dark:border-dark-border pt-2 sm:pt-2.5" />

                {/* Total */}
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                    ₹{(order.totalPrice || 0).toLocaleString()}
                  </span>
                </div>

                {/* Savings message */}
                {(order.discountPrice > 0 || order.shippingPrice === 0) && (
                  <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-900/10 rounded-lg ring-1 ring-green-100 dark:ring-green-800/20">
                    <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium flex items-center justify-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      You saved ₹{(order.discountPrice || 0) + (order.shippingPrice || 0)} on this order!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Cancel Order Modal ───────────────────────────────────────────── */}
      {showCancelModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              Cancel Order?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
              {isPaid && ' Your refund will be processed.'}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reason for cancellation (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">Select a reason...</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Product not needed anymore">Product not needed anymore</option>
                <option value="Delivery takes too long">Delivery takes too long</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Yes, Cancel</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Return Request Modal ──────────────────────────────────────────── */}
      {showReturnModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowReturnModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              Return Order?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Submit a return request for this order. We'll review it and get back to you.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reason for return (optional)
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">Select a reason...</option>
                <option value="Product is damaged">Product is damaged</option>
                <option value="Wrong item delivered">Wrong item delivered</option>
                <option value="Size or fit issue">Size or fit issue</option>
                <option value="Item not as described">Item not as described</option>
                <option value="Defective product">Defective product</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnRequest}
                disabled={returning}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {returning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default OrderDetailPage
