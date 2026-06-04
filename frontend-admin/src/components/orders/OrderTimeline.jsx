import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Package, Truck, Home, X, Ban, RotateCcw } from 'lucide-react'

const timelineSteps = [
  { key: 'order_confirmed', label: 'Order Confirmed', icon: Check, color: 'green' },
  { key: 'processing', label: 'Processing', icon: Clock, color: 'blue' },
  { key: 'packed', label: 'Packed', icon: Package, color: 'indigo' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'purple' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'orange' },
  { key: 'delivered', label: 'Delivered', icon: Home, color: 'green' },
]

const cancelSteps = [
  { key: 'cancelled', label: 'Cancelled', icon: X, color: 'red' },
  { key: 'returned', label: 'Returned', icon: RotateCcw, color: 'red' },
]

const colorMap = {
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500', line: 'bg-green-400 dark:bg-green-600' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500', line: 'bg-blue-400 dark:bg-blue-600' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500', line: 'bg-indigo-400 dark:bg-indigo-600' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500', line: 'bg-purple-400 dark:bg-purple-600' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500', line: 'bg-orange-400 dark:bg-orange-600' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500', line: 'bg-red-400 dark:bg-red-600' },
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const OrderTimeline = ({ timeline = [], trackingStatus }) => {
  const completedKeys = new Set(timeline.map(t => t.status))
  const cancelledOrReturned = completedKeys.has('cancelled') || completedKeys.has('returned')

  const steps = cancelledOrReturned ? cancelSteps : timelineSteps

  const getStepStatus = (stepKey) => {
    if (completedKeys.has(stepKey)) return 'completed'
    return 'pending'
  }

  const getTimelineEntry = (stepKey) => {
    return timeline.find(t => t.status === stepKey)
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Order Timeline
      </h3>
      <div className="relative">
        {cancelledOrReturned && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              This order was {completedKeys.has('cancelled') ? 'cancelled' : 'returned'}
            </p>
            {(() => {
              const entry = getTimelineEntry('cancelled') || getTimelineEntry('returned')
              return entry?.timestamp ? (
                <p className="text-xs text-red-500 mt-1">{formatDateTime(entry.timestamp)}</p>
              ) : null
            })()}
          </div>
        )}
        <div className="space-y-0">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key)
            const entry = getTimelineEntry(step.key)
            const isCompleted = status === 'completed'
            const colors = colorMap[step.color]
            const Icon = step.icon

            if (status === 'pending' && cancelledOrReturned) return null

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="relative flex items-start gap-4 pb-6 last:pb-0"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2 ${
                    isCompleted ? 'bg-green-400 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}

                {/* Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 ring-offset-2 dark:ring-offset-dark-card transition-all duration-300 ${
                  isCompleted
                    ? `${colors.bg} ${colors.ring}`
                    : 'bg-gray-100 dark:bg-gray-800 ring-gray-300 dark:ring-gray-600'
                }`}>
                  {isCompleted ? (
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-semibold ${
                    isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {entry?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.description}</p>
                  )}
                  {entry?.timestamp && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
                      {formatDateTime(entry.timestamp)}
                    </p>
                  )}
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0"
                  >
                    <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
                      <Check className={`w-3 h-3 ${colors.text}`} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OrderTimeline