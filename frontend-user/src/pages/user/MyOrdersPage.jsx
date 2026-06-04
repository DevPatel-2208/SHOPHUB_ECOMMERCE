import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Download, Truck, Search, Filter, X, RefreshCw, ShoppingBag, Clock, IndianRupee, AlertCircle, BadgePercent, Tag } from 'lucide-react'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { formatCurrency } from '../../utils/offerUtils.js'
import { StatusBadge, OrderSkeletonList } from '../../components/user/OrderComponents.jsx'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const statusFilters = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const params = statusFilter ? { status: statusFilter } : {}
        const { data } = await api.get('/orders', { params })
        setOrders(data.orders || [])
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [statusFilter])

  const downloadInvoice = async (orderId) => {
    setDownloadingId(orderId)
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${orderId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Invoice download failed:', err)
      toast.error('Failed to download invoice')
    } finally {
      setDownloadingId(null)
    }
  }

  const isCancellable = (order) => {
    return ['pending', 'processing'].includes(order.status) && order.paymentMethod !== 'cod'
  }

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cashfree': return 'Online Payment'
      case 'cod': return 'Cash on Delivery'
      default: return method
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 lg:mb-8"
        >
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {orders.length > 0
                ? `Showing ${orders.length} order${orders.length > 1 ? 's' : ''}`
                : 'Track and manage your orders'}
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="sm:hidden inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
          >
            <Filter className="w-4 h-4" />
            {statusFilter ? `Filtered: ${statusFilter}` : 'Filter'}
          </button>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover border border-gray-200 dark:border-dark-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Mobile Filter Sheet ──────────────────────────────────────── */}
        {showMobileFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm sm:hidden"
            onClick={() => setShowMobileFilter(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-card rounded-t-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filter Orders</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setStatusFilter(f.value); setShowMobileFilter(false) }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      statusFilter === f.value
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-50 dark:bg-dark text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-dark-border'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ─── Loading State ────────────────────────────────────────────── */}
        {isLoading && <OrderSkeletonList count={4} />}

        {/* ─── Empty State ──────────────────────────────────────────────── */}
        {!isLoading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm text-center py-12 sm:py-16 lg:py-20 px-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-dark rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 ring-1 ring-gray-200 dark:ring-dark-border">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {statusFilter ? `No ${statusFilter} orders` : 'No orders yet'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {statusFilter
                ? `You don't have any orders with status "${statusFilter}". Try a different filter.`
                : 'Start shopping to see your orders here. Your order history will appear once you make your first purchase.'}
            </p>

            {statusFilter ? (
              <button
                onClick={() => setStatusFilter('')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors text-sm"
              >
                <X className="w-4 h-4" /> Clear Filter
              </button>
            ) : (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Products
              </Link>
            )}
          </motion.div>
        )}

        {/* ─── Orders List ──────────────────────────────────────────────── */}
        {!isLoading && orders.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 sm:space-y-4"
          >
            {orders.map((order, i) => {
              const isCancellable = ['pending', 'processing'].includes(order.status) && order.paymentMethod !== 'cod'

              return (
                <motion.div
                  key={order._id}
                  variants={cardVariants}
                  layout
                  className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* ── Order Header ──────────────────────────────────── */}
                  <div className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                          #{order._id.toString().slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge type="tracking" value={order.trackingStatus} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                            ₹{order.totalPrice?.toLocaleString()}
                          </span>
                          {order.discountPrice > 0 && (
                            <p className="text-[10px] text-gray-400 line-through">₹{(order.itemsPrice || 0).toLocaleString()}</p>
                          )}
                        </div>
                        <StatusBadge type="payment" value={order.paymentStatus} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </div>
                  </div>

                  {/* ── Order Items Preview ──────────────────────────── */}
                  <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                      {order.orderItems?.slice(0, 4).map((item) => (
                        <div key={item._id} className="flex-shrink-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden ring-1 ring-gray-100 dark:ring-dark-border">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-center truncate max-w-[56px] sm:max-w-[64px]">
                            {item.quantity}x
                          </p>
                        </div>
                      ))}
                      {(order.orderItems?.length || 0) > 4 && (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-dark rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200 dark:ring-dark-border">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            +{order.orderItems.length - 4}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Discount Breakdown */}
                    {(order.discountPrice > 0 || order.offerName) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {order.offerName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800/30">
                            <BadgePercent className="w-3 h-3" /> {order.offerName}
                          </span>
                        )}
                        {order.discountPrice > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/30">
                            <Tag className="w-3 h-3" /> Discount: ₹{formatCurrency(order.discountPrice)}
                          </span>
                        )}
                        {order.couponCode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/30">
                            <Tag className="w-3 h-3" /> Coupon: {order.couponCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Order Actions ────────────────────────────────── */}
                  <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-primary text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-primary-dark transition-all hover:shadow-md active:scale-[0.97]"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => downloadInvoice(order._id)}
                      disabled={downloadingId === order._id}
                      className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
                    >
                      {downloadingId === order._id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Invoice
                    </button>

                    {order.shipmentRef?.awb && (
                      <Link
                        to={`/track-order?awb=${order.shipmentRef.awb}`}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track
                      </Link>
                    )}

                    {isCancellable && (
                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 border border-red-200 dark:border-red-900/50 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default MyOrdersPage
