import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Truck, Package, CheckCircle, Clock, MapPin } from 'lucide-react'
import api from '../../services/api.js'
import toast from 'react-hot-toast'

const statusSteps = [
  { key: 'order_placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams()
  const initialAwb = searchParams.get('awb') || ''
  const [awb, setAwb] = useState(initialAwb)
  const [tracking, setTracking] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!awb.trim()) return
    setIsLoading(true)
    try {
      const { data } = await api.get(`/shipments/track/${awb}`)
      setTracking(data.shipment)
    } catch (err) {
      toast.error('Tracking number not found')
      setTracking(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStep = () => {
    if (!tracking) return -1
    const idx = statusSteps.findIndex((s) => s.key === tracking.status)
    return idx >= 0 ? idx : 0
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Track Your Order</h1>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              placeholder="Enter AWB / Order ID"
              className="w-full px-4 py-3 pl-12 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {tracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">AWB Number</p>
                <p className="text-lg font-bold">{tracking.awb}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Courier</p>
                <p className="font-medium">{tracking.courier || 'Standard Delivery'}</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="relative mb-8">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => {
                  const isActive = i <= getCurrentStep()
                  const isCurrent = i === getCurrentStep()
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs mt-2 text-center w-20 ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(getCurrentStep() / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold">Shipment History</h3>
              {tracking.timeline?.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{event.status}</p>
                    <p className="text-xs text-gray-500">{event.location && `${event.location} • `}{new Date(event.timestamp).toLocaleString('en-IN')}</p>
                    {event.remark && <p className="text-xs text-gray-400 mt-1">{event.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TrackOrderPage
