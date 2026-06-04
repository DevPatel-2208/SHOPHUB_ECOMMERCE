import { motion } from 'framer-motion'
import { Clock, CheckCircle, Package, Truck, CreditCard, XCircle, RefreshCw, ShieldAlert } from 'lucide-react'

// ─── Status Badge Component ───────────────────────────────────────────────────
export const StatusBadge = ({ type = 'tracking', value }) => {
  const trackingConfig = {
    payment_pending: { label: 'Payment Pending', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400', icon: Clock },
    payment_verified: { label: 'Payment Verified', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', icon: CheckCircle },
    order_confirmed: { label: 'Confirmed', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', icon: CheckCircle },
    processing: { label: 'Processing', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', icon: Package },
    packed: { label: 'Packed', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', icon: Package },
    shipped: { label: 'Shipped', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500', icon: Truck },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', icon: Truck },
    delivered: { label: 'Delivered', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', icon: CheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', icon: XCircle },
    returned: { label: 'Returned', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500', icon: RefreshCw },
  }

  const paymentConfig = {
    pending: { label: 'Pending', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
    paid: { label: 'Paid', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
    failed: { label: 'Failed', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    refunded: { label: 'Refunded', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  }

  const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
    processing: { label: 'Processing', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
    shipped: { label: 'Shipped', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
    delivered: { label: 'Delivered', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    refunded: { label: 'Refunded', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    returned: { label: 'Returned', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
  }

  const config = type === 'tracking' ? trackingConfig : type === 'payment' ? paymentConfig : statusConfig
  const current = config[value]

  if (!current) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full capitalize">
        {value}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${current.bg} ${current.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  )
}

// ─── Order Timeline Component ─────────────────────────────────────────────────
export const OrderTimeline = ({ timeline = [] }) => {
  const getIcon = (status) => {
    switch (status) {
      case 'payment_pending': return Clock
      case 'payment_verified':
      case 'order_confirmed':
      case 'delivered': return CheckCircle
      case 'processing':
      case 'packed': return Package
      case 'shipped':
      case 'out_for_delivery': return Truck
      case 'cancelled': return XCircle
      case 'return_requested':
      case 'returned': return RefreshCw
      default: return Clock
    }
  }

  const getIconBg = (status, idx, total) => {
    if (idx === 0 && status !== 'cancelled' && status !== 'returned') return 'bg-primary text-white'
    if (status === 'cancelled' || status === 'returned') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    return 'bg-gray-100 dark:bg-dark text-gray-500'
  }

  if (!timeline.length) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No timeline events yet</p>
      </div>
    )
  }

  const sortedTimeline = [...timeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="relative">
      {sortedTimeline.map((event, i) => {
        const Icon = getIcon(event.status)
        const isFirst = i === 0
        const isCancelledOrReturned = event.status === 'cancelled' || event.status === 'returned'

        return (
          <div key={i} className="flex items-start gap-3 pb-6 last:pb-0 relative">
            {/* Connector line */}
            {i < sortedTimeline.length - 1 && (
              <div className={`absolute left-4 top-8 w-0.5 h-full -z-0 ${
                isFirst && !isCancelledOrReturned
                  ? 'bg-primary/30'
                  : 'bg-gray-200 dark:bg-dark-border'
              }`} />
            )}

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getIconBg(event.status, i, sortedTimeline.length)}`}
            >
              <Icon className="w-4 h-4" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`font-medium text-sm ${isFirst && !isCancelledOrReturned ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
              >
                {event.description || event.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </motion.p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {new Date(event.timestamp).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Status dot for latest */}
            {isFirst && !isCancelledOrReturned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="shrink-0"
              >
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Latest
                </span>
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Order Skeleton Loader ────────────────────────────────────────────────────
export const OrderSkeletonCard = () => (
  <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden animate-pulse">
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
      </div>

      {/* Items preview */}
      <div className="flex gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" />
      </div>
    </div>
  </div>
)

export const OrderSkeletonList = ({ count = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <OrderSkeletonCard key={i} />
    ))}
  </div>
)