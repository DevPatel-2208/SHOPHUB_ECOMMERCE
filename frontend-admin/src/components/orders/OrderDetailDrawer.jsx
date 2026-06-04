import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  X, Copy, CheckCircle, Clock, Package, Truck, Home, Ban, RotateCcw,
  Printer, Download, Mail, Phone, MapPin, ShoppingBag, Tag, IndianRupee,
  CreditCard, Hash, User, Shield, Percent, Receipt, ExternalLink, Loader
} from 'lucide-react'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import Badge from '../ui/Badge.jsx'
import OrderTimeline from './OrderTimeline.jsx'

const statusBadgeVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'danger',
  returned: 'danger',
}

const trackingStatuses = [
  { value: 'order_confirmed', label: 'Order Confirmed', icon: CheckCircle, color: 'green' },
  { value: 'processing', label: 'Processing', icon: Clock, color: 'blue' },
  { value: 'packed', label: 'Packed', icon: Package, color: 'indigo' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'purple' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'orange' },
  { value: 'delivered', label: 'Delivered', icon: Home, color: 'green' },
]

const actionableStatuses = ['order_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery']

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied!'))
}

const OrderDetailDrawer = ({ orderId, isOpen, onClose }) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/orders/${orderId}`)
      setOrder(data.order)
    } catch (err) {
      toast.error('Failed to load order details')
      onClose()
    } finally {
      setLoading(false)
    }
  }, [orderId, onClose])

  useEffect(() => {
    if (isOpen && orderId) fetchOrderDetail()
  }, [isOpen, orderId, fetchOrderDetail])

  const updateStatus = async (newStatus, trackingStatus) => {
    setActionLoading(trackingStatus || newStatus)
    try {
      const body = {}
      if (newStatus) body.status = newStatus
      if (trackingStatus) body.trackingStatus = trackingStatus
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, body)
      setOrder(data.order)
      toast.success(`Order ${trackingStatus || newStatus} successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const getNextAction = () => {
    if (!order) return null
    const currentIdx = actionableStatuses.indexOf(order.trackingStatus)
    if (currentIdx >= 0 && currentIdx < actionableStatuses.length - 1) {
      return actionableStatuses[currentIdx + 1]
    }
    return null
  }

  const hasNextAction = order && actionableStatuses.includes(order.trackingStatus) && order.trackingStatus !== 'delivered'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white dark:bg-dark shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-dark border-b border-gray-100 dark:border-dark-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Order #{order?.orderNumber || order?._id?.toString().slice(-6).toUpperCase() || ''}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Order Details</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading order details...</p>
                </div>
              </div>
            ) : order ? (
              <div className="p-6 space-y-6">
                {/* Quick Actions Bar */}
                {hasNextAction && (
                  <div className="flex items-center gap-2 flex-wrap p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="text-xs font-medium text-primary mr-1">Next:</span>
                    {(() => {
                      const next = getNextAction()
                      return trackingStatuses.filter(t => t.value === next).map(t => (
                        <button
                          key={t.value}
                          onClick={() => updateStatus(null, t.value)}
                          disabled={actionLoading === t.value}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === t.value ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <t.icon className="w-3 h-3" />
                          )}
                          {t.label}
                        </button>
                      ))
                    })()}
                    {order.trackingStatus !== 'cancelled' && order.trackingStatus !== 'delivered' && (
                      <button
                        onClick={() => updateStatus('cancelled', 'cancelled')}
                        disabled={actionLoading === 'cancelled'}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                      >
                        {actionLoading === 'cancelled' ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {/* Order Cancelled Banner */}
                {(order.status === 'cancelled' || order.trackingStatus === 'cancelled') && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-start gap-3">
                    <Ban className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
                      {order.cancelReason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {order.cancelReason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Row 1: Order Info + Customer Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Order Information */}
                  <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      Order Information
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Order ID</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                            #{order._id.toString().slice(-6).toUpperCase()}
                          </span>
                          <button onClick={() => copyToClipboard(order._id)} className="text-gray-400 hover:text-primary">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Payment</span>
                        <Badge variant={order.isPaid ? 'success' : 'warning'} size="sm">
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Method</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white capitalize">{order.paymentMethod}</span>
                      </div>
                      {order.paymentResult?.transactionId && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Transaction ID</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-gray-900 dark:text-white">{order.paymentResult.transactionId}</span>
                            <button onClick={() => copyToClipboard(order.paymentResult.transactionId)} className="text-gray-400 hover:text-primary">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <Badge variant={statusBadgeVariant[order.status] || 'default'} size="sm" dot>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Customer Information
                    </h3>
                    <div className="flex items-start gap-3 mb-3">
                      {order.user?.avatar ? (
                        <img src={getImageUrl(order.user.avatar)} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-dark-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{order.user?.name?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.user?.name || 'Guest'}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{order.user?.email || '—'}</span>
                        </div>
                        {order.user?.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{order.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          {order.shippingAddress?.addressLine1}
                          {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                          <br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          {order.shippingAddress?.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}
                          {order.shippingAddress?.landmark ? <><br />Landmark: {order.shippingAddress.landmark}</> : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Ordered Products */}
                <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Ordered Products ({order.orderItems?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {order.orderItems?.map((item, idx) => (
                      <div key={item._id || idx} className="flex items-center gap-3 p-2.5 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border">
                        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                          <img
                            src={getImageUrl(item.image || item.product?.images?.[0]) || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/placeholder.svg' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                            {item.variant?.size && <span>Size: {item.variant.size}</span>}
                            {item.variant?.color && <span>Color: {item.variant.color}</span>}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 line-through">₹{item.price}</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">₹{item.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 3: Pricing */}
                <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Pricing Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Items Total</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{order.itemsPrice || 0}</span>
                    </div>
                    {order.discountPrice > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Discount
                          {order.couponCode && <span className="text-xs text-gray-400">({order.couponCode})</span>}
                        </span>
                        <span className="font-medium text-green-600">-₹{order.discountPrice}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {order.shippingPrice > 0 ? `₹${order.shippingPrice}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{order.taxPrice || 0}</span>
                    </div>
                    {order.cashbackAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Cashback</span>
                        <span className="font-medium text-green-600">+₹{order.cashbackAmount}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 dark:border-dark-border pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="text-lg font-bold text-primary">₹{order.totalPrice || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 4: Timeline */}
                <OrderTimeline timeline={order.timeline || []} trackingStatus={order.trackingStatus} />

                {/* Row 5: Admin Actions */}
                <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Admin Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trackingStatuses.filter(t => {
                      const idx = actionableStatuses.indexOf(t.value)
                      const currentIdx = actionableStatuses.indexOf(order.trackingStatus)
                      return t.value === 'delivered' ? true : idx > currentIdx
                    }).map(t => (
                      <button
                        key={t.value}
                        onClick={() => updateStatus(null, t.value)}
                        disabled={actionLoading === t.value}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === t.value ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <t.icon className="w-3.5 h-3.5" />
                        )}
                        {t.label}
                      </button>
                    ))}
                    {(order.status !== 'cancelled' && order.status !== 'delivered') && (
                      <button
                        onClick={() => updateStatus('cancelled', 'cancelled')}
                        disabled={actionLoading === 'cancelled'}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-card border border-red-200 dark:border-red-800/30 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === 'cancelled' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        Cancel Order
                      </button>
                    )}
                    {(order.status === 'cancelled' && !order.isPaid) && (
                      <button
                        onClick={() => updateStatus('refunded')}
                        disabled={actionLoading === 'refunded'}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-card border border-orange-200 dark:border-orange-800/30 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === 'refunded' ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Refund Order
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/api/orders/${order._id}/invoice`, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-500">Order not found</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default OrderDetailDrawer