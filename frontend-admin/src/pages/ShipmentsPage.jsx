import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Truck, Package, CheckCircle, Clock, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const shipmentStatuses = ['pending', 'label_generated', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled']

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchShipments()
  }, [])

  const fetchShipments = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/shipments')
      setShipments(data.shipments)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateShipment = async (orderId, updates) => {
    try {
      await api.put(`/shipments/${orderId}`, updates)
      fetchShipments()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by AWB..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:border-primary outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">AWB</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Courier</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No shipments found</td></tr>
              ) : (
                shipments.map((shipment) => (
                  <motion.tr key={shipment._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-dark/50">
                    <td className="px-6 py-4 text-sm font-medium">
                      #{shipment.order?._id?.toString().slice(-6).toUpperCase() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">{shipment.awb || 'Not assigned'}</td>
                    <td className="px-6 py-4 text-sm">{shipment.courier || '-'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={shipment.status}
                        onChange={(e) => updateShipment(shipment.order, { status: e.target.value })}
                        className="px-2 py-1 text-xs font-medium rounded-full border-0 outline-none cursor-pointer bg-gray-100 dark:bg-dark"
                      >
                        {shipmentStatuses.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const awb = prompt('Enter AWB number:')
                          const courier = prompt('Enter courier name:')
                          if (awb) updateShipment(shipment.order, { awb, courier })
                        }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
                      >
                        {shipment.awb ? 'Update' : 'Assign AWB'}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ShipmentsPage
