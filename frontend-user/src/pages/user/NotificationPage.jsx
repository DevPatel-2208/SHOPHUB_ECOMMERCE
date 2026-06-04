import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, Check, CheckCheck, Package, Gift, Shield,
  AlertTriangle, X, Clock, ArrowLeft, Loader2,
  Inbox, ChevronRight, Sparkles, Eye, EyeOff,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useNotifications } from '../../context/NotificationContext.jsx'

const typeConfig = {
  order: { icon: Package, label: 'Order', gradient: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-200 dark:border-emerald-800/40', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  promo: { icon: Gift, label: 'Promo', gradient: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-200 dark:border-purple-800/40', iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  system: { icon: Shield, label: 'System', gradient: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-200 dark:border-blue-800/40', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  alert: { icon: AlertTriangle, label: 'Alert', gradient: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-200 dark:border-amber-800/40', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
}

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  ...Object.entries(typeConfig).map(([id, cfg]) => ({ id, label: cfg.label })),
]

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
}

const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [markingIds, setMarkingIds] = useState(new Set())

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications.filter((n) => n.type === filter)

  const handleMarkAsRead = async (id) => {
    setMarkingIds((prev) => new Set(prev).add(id))
    try {
      await markAsRead(id)
    } catch {
      toast.error('Failed to mark as read')
    } finally {
      setMarkingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  useEffect(() => {
    if (notifications.length > 0 || unreadCount >= 0) setLoading(false)
  }, [notifications, unreadCount])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/profile"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>

          {/* ── Filters + Actions ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <div className="flex flex-wrap gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = filter === tab.id
                const count = tab.id === 'all'
                  ? notifications.length
                  : tab.id === 'unread'
                    ? unreadCount
                    : notifications.filter((n) => n.type === tab.id).length
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFilter(tab.id)}
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/50'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-5">
              {filter === 'unread' ? (
                <Check className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              ) : (
                <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              {filter === 'unread'
                ? 'You\'ve read everything. New notifications will appear here.'
                : 'When you get notifications, they\'ll show up here.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-sm text-primary hover:underline"
              >
                View all notifications
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((n, idx) => {
                const config = typeConfig[n.type] || typeConfig.system
                const Icon = config.icon
                const isMarking = markingIds.has(n._id)

                return (
                  <motion.div
                    key={n._id}
                    layout
                    variants={fadeSlide}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    onClick={() => handleMarkAsRead(n._id)}
                    className={`relative group cursor-pointer rounded-2xl border transition-all duration-300 ${
                      n.isRead
                        ? 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/30'
                        : `bg-gradient-to-r ${config.gradient} ${config.border} shadow-sm`
                    }`}
                  >
                    <div className="flex items-start gap-3.5 p-4 sm:p-5">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              n.isRead
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {n.title}
                            </p>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${
                              n.isRead
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {n.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!n.isRead && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n._id) }}
                                disabled={isMarking}
                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                                title="Mark as read"
                              >
                                {isMarking ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            n.isRead ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500' : `${config.iconBg} ${config.iconColor}`
                          }`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </div>
                          <span className={`text-[11px] ${n.isRead ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.link && (
                            <a
                              href={n.link}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 ml-auto"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!n.isRead && (
                        <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center pt-4 pb-2"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default NotificationPage
