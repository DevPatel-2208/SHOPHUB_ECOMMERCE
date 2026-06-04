import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Search, Filter, Eye, Truck, CheckCircle, XCircle, Clock, Package,
  Users, IndianRupee, ShoppingBag, Ban, ArrowUpDown, ChevronLeft, ChevronRight,
  Download, RefreshCw
} from 'lucide-react'
import api from '../services/api.js'
import Badge from '../components/ui/Badge.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import OrderDetailDrawer from '../components/orders/OrderDetailDrawer.jsx'
import { TableRowSkeleton } from '../components/ui/Skeleton.jsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const PAYMENT_OPTIONS = [
  { value: '', label: 'All Payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-totalPrice', label: 'Highest Amount' },
  { value: 'totalPrice', label: 'Lowest Amount' },
]

const statusBadgeVariant = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'danger',
  returned: 'danger',
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/orders/stats')
      setStats(data.stats)
    } catch {}
  }, [])

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', '10')
      params.set('sort', sort.replace('-', ''))
      if (sort.startsWith('-')) params.set('order', 'desc')
      else params.set('order', 'asc')
      if (statusFilter) params.set('status', statusFilter)
      if (paymentFilter) params.set('isPaid', paymentFilter === 'paid' ? 'true' : 'false')
      if (search) params.set('search', search)

      const { data } = await api.get(`/admin/orders?${params.toString()}`)
      setOrders(data.orders)
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, paymentFilter, sort])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const openDetail = (orderId) => {
    setSelectedOrderId(orderId)
    setDrawerOpen(true)
  }

  const closeDetail = () => {
    setDrawerOpen(false)
    setTimeout(() => {
      setSelectedOrderId(null)
      fetchOrders()
      fetchStats()
    }, 300)
  }

  const handleFilterChange = (setter) => (val) => {
    setter(val)
    setPage(1)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage and track all customer orders"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Orders' }]}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} color="primary" delay={0} />
          <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} color="success" delay={0.05} />
          <StatCard title="Pending" value={stats.pendingOrders} icon={Clock} color="warning" delay={0.1} />
          <StatCard title="Processing" value={stats.processingOrders} icon={Package} color="info" delay={0.15} />
          <StatCard title="Shipped" value={stats.shippedOrders} icon={Truck} color="info" delay={0.2} />
          <StatCard title="Delivered" value={stats.deliveredOrders} icon={CheckCircle} color="success" delay={0.25} />
          <StatCard title="Cancelled" value={stats.cancelledOrders} icon={Ban} color="danger" delay={0.3} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary/50 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => handleFilterChange(setPaymentFilter)(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => handleFilterChange(setSort)(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => { fetchOrders(); fetchStats() }}
            className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-hover">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <TableRowSkeleton rows={8} cols={8} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No orders found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer"
                      onClick={() => openDetail(order._id)}
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                          #{order._id.toString().slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {order.user?.avatar ? (
                            <img src={getImageUrl(order.user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-dark-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{order.user?.name?.charAt(0) || 'G'}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{order.user?.name || 'Guest'}</p>
                            {order.shippingAddress?.phone && (
                              <p className="text-[10px] text-gray-500">{order.shippingAddress.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.totalPrice)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={order.isPaid ? 'success' : order.paymentStatus === 'refunded' ? 'danger' : 'warning'} size="sm" dot>
                          {order.isPaid ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusBadgeVariant[order.status] || 'default'} size="sm" dot>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(order._id) }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 hover:text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-dark-border">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        isOpen={drawerOpen}
        onClose={closeDetail}
      />
    </motion.div>
  )
}

export default OrdersPage
