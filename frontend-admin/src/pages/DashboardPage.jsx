import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ShoppingBag, Users, ClipboardList, DollarSign, TrendingUp,
  TrendingDown, Package, Star, Eye, ArrowRight, AlertTriangle,
  Calendar, Gift, ChevronRight, Clock,
} from 'lucide-react'
import api from '../services/api.js'
import StatCard from '../components/ui/StatCard.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import { CardSkeleton } from '../components/ui/Skeleton.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { getImageUrl } from '../utils/imageUrl.js'

// ─── Shared chart colours ──────────────────────────────────────────
const BLUE = '#4F46E5'
const GREEN = '#10B981'
const VIOLET = '#8B5CF6'

// ─── Custom pie label (avoids overlap, shows %) ────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null
  const RAD = Math.PI / 180
  const radius = outerRadius + 22
  const x = cx + radius * Math.cos(-midAngle * RAD)
  const y = cy + radius * Math.sin(-midAngle * RAD)
  const isRight = x > cx
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={isRight ? 'start' : 'end'}
      fontSize={11}
      fontWeight={600}
      className="fill-gray-700 dark:fill-gray-300"
    >
      {name} {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Custom tooltip ─────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, formatter, valuePrefix = '₹' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color || entry.stroke || BLUE }} />
          {entry.name}: <span className="font-semibold text-gray-900 dark:text-white">
            {formatter ? formatter(entry.value) : `${valuePrefix}${entry.value?.toLocaleString()}`}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton loader ────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <CardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map(i => (
        <div key={i} className="card p-6">
          <div className="h-5 w-36 bg-gray-200 dark:bg-dark-border rounded mb-4" />
          <div className="h-[300px] bg-gray-100 dark:bg-dark rounded-xl" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map(i => (
        <div key={i} className="card p-6">
          <div className="h-5 w-36 bg-gray-200 dark:bg-dark-border rounded mb-4" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(j => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-dark-border rounded" />
                  <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ─── Empty state ────────────────────────────────────────────────────
const EmptyBlock = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
    {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>}
  </div>
)

// ─── Main component ─────────────────────────────────────────────────
const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isDark } = useTheme()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true)
        const { data } = await api.get('/admin/dashboard')
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Welcome back! Here's your store overview." />
        <DashboardSkeleton />
      </div>
    )
  }

  const {
    stats = {},
    monthlySalesData = [],
    salesData = [],
    orderStatusBreakdown = [],
    topSelling = [],
    recentReviews = [],
    latestCustomers = [],
    lowStockProducts = [],
    activeOffers = [],
    revenueByPayment = [],
    recentOrders = [],
  } = dashboardData || {}

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5 text-primary dark:text-primary-light" />,
      iconBgColor: 'bg-primary/10 dark:bg-primary/20',
      change: stats.revenueChange != null ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%` : null,
      changeType: stats.revenueChange >= 0 ? 'increase' : 'decrease',
      color: 'primary',
    },
    {
      title: 'Total Orders',
      value: (stats.totalOrders || 0).toLocaleString(),
      icon: <ClipboardList className="w-5 h-5 text-info" />,
      iconBgColor: 'bg-info/10 dark:bg-info/20',
      change: stats.ordersChange != null ? `${stats.ordersChange > 0 ? '+' : ''}${stats.ordersChange}%` : null,
      changeType: stats.ordersChange >= 0 ? 'increase' : 'decrease',
      color: 'info',
    },
    {
      title: 'Total Products',
      value: (stats.totalProducts || 0).toLocaleString(),
      icon: <ShoppingBag className="w-5 h-5 text-secondary" />,
      iconBgColor: 'bg-secondary/10 dark:bg-secondary/20',
      change: stats.productsChange != null ? `${stats.productsChange > 0 ? '+' : ''}${stats.productsChange}%` : null,
      changeType: stats.productsChange >= 0 ? 'increase' : 'decrease',
      color: 'success',
    },
    {
      title: 'Total Customers',
      value: (stats.totalUsers || 0).toLocaleString(),
      icon: <Users className="w-5 h-5 text-warning" />,
      iconBgColor: 'bg-warning/10 dark:bg-warning/20',
      change: stats.usersChange != null ? `${stats.usersChange > 0 ? '+' : ''}${stats.usersChange}%` : null,
      changeType: stats.usersChange >= 0 ? 'increase' : 'decrease',
      color: 'warning',
    },
  ]

  // ── Animation variants ────────────────────────────────────────────
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
  const itemAnim = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your store overview." />

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </motion.div>

      {/* ── Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Monthly Sales Area Chart */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Revenue Trend
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monthly revenue for the last 12 months</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              12 months
            </div>
          </div>
          {monthlySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySalesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip label="" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={BLUE}
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={{ r: 3, fill: BLUE, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: BLUE, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock icon={DollarSign} title="No revenue data" description="Orders with payments will appear here" />
          )}
        </motion.div>

        {/* Order Status Pie Chart */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Order Status
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Breakdown by current status</p>
            </div>
          </div>
          {orderStatusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {orderStatusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip label="" formatter={(v) => v.toLocaleString()} valuePrefix="" />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock icon={ClipboardList} title="No orders yet" description="Orders will appear here once placed" />
          )}
        </motion.div>
      </div>

      {/* ── Second Charts Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Daily Sales Bar (last 30 days) */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Daily Sales
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Revenue over the last 30 days</p>
            </div>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v?.slice(5) || ''}
                />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip label="" />} />
                <Bar dataKey="revenue" fill={BLUE} radius={[3, 3, 0, 0]} name="Revenue" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock icon={Calendar} title="No sales data" description="Daily revenue will appear here" />
          )}
        </motion.div>

        {/* Revenue by Payment Method */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Payment Methods
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Revenue split by payment method</p>
            </div>
          </div>
          {revenueByPayment.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByPayment} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} horizontal={false} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="method" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<ChartTooltip label="" />} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue" maxBarSize={24}>
                  {revenueByPayment.map((entry, i) => (
                    <Cell key={i} fill={entry.color || BLUE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock icon={ShoppingBag} title="No payment data" description="Paid orders will appear here" />
          )}
        </motion.div>
      </div>

      {/* ── Bottom Row: Top Products / Recent Reviews / Latest Customers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Top Selling Products */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
            <Link to="/products" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {topSelling.length > 0 ? (
            <div className="space-y-2">
              {topSelling.map((product, i) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.totalSold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{product.revenue?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={ShoppingBag} title="No sales yet" description="Top products will appear once orders are placed" />
          )}
        </motion.div>

        {/* Recent Reviews */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
            <Link to="/reviews" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentReviews.length > 0 ? (
            <div className="space-y-2">
              {recentReviews.map((review) => (
                <div key={review._id} className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= review.rating ? 'text-warning fill-warning' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <Badge variant={review.isActive ? 'success' : 'danger'} size="sm">
                      {review.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{review.comment || 'No comment'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {review.user?.name || 'Anonymous'} — {review.product?.name || 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Star} title="No reviews yet" description="Customer reviews will appear here" />
          )}
        </motion.div>

        {/* Latest Customers */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Latest Customers</h3>
            <Link to="/customers" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {latestCustomers.length > 0 ? (
            <div className="space-y-2">
              {latestCustomers.map((customer) => (
                <div
                  key={customer._id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{customer.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{customer.email}</p>
                  </div>
                  <Badge variant={customer.isActive ? 'success' : 'danger'} size="sm">
                    {customer.isActive ? 'Active' : 'Blocked'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Users} title="No customers yet" description="Customer list will populate as users register" />
          )}
        </motion.div>
      </div>

      {/* ── Low Stock & Active Offers ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Low Stock Products */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-5 text-warning" />
              Low Stock <Badge variant="danger" size="sm">{stats.lowStockCount || 0}</Badge>
            </h3>
            <Link to="/products" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark flex items-center justify-center overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Threshold: {product.lowStockThreshold || 0}</p>
                  </div>
                  <Badge variant={product.stock <= 0 ? 'danger' : 'warning'} size="sm">
                    {product.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Package} title="All stocked up" description="No products are below their low-stock threshold" />
          )}
        </motion.div>

        {/* Active Offers */}
        <motion.div variants={itemAnim} className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-5 text-secondary" />
              Active Offers <Badge variant="success" size="sm">{stats.activeOfferCount || 0}</Badge>
            </h3>
            <Link to="/offers" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {activeOffers.length > 0 ? (
            <div className="space-y-2">
              {activeOffers.map((offer) => {
                const expiryDate = offer.endDate ? new Date(offer.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'
                const discountLabel =
                  offer.discountType === 'percentage' ? `${offer.discountValue}% off`
                  : offer.discountType === 'fixed' ? `₹${offer.discountValue} off`
                  : `Flat ₹${offer.discountValue}`
                return (
                  <div
                    key={offer._id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 dark:from-secondary/30 dark:to-secondary/10 flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-secondary transition-colors">
                        {offer.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-secondary">
                          {discountLabel}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          Expires {expiryDate}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        offer.status === 'active' ? 'success'
                        : offer.status === 'upcoming' ? 'info'
                        : 'danger'
                      }
                      size="sm"
                    >
                      {offer.status === 'upcoming' ? 'Upcoming' : offer.status === 'expired' ? 'Expired' : 'Active'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyBlock icon={Gift} title="No active offers" description="Create an offer to start promoting your products" />
          )}
        </motion.div>
      </div>

      {/* ── Recent Orders (full-width table) ────────────────────────── */}
      {recentOrders.length > 0 && (
        <motion.div variants={itemAnim} className="card p-4 sm:p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link to="/orders" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-left py-3 px-4 sm:px-6 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3 px-4 sm:px-6 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Total</th>
                  <th className="text-right py-3 px-4 sm:px-6 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <span className="font-mono text-xs text-gray-900 dark:text-white">
                        #{order._id?.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                          {order.user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                          {order.user?.name || 'Guest'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{order.totalPrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <Badge
                        variant={
                          order.status === 'delivered' ? 'success'
                          : order.status === 'cancelled' || order.status === 'returned' ? 'danger'
                          : order.status === 'shipped' ? 'info'
                          : 'warning'
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default DashboardPage