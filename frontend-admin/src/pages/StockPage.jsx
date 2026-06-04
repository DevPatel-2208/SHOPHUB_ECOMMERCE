import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Package, TrendingDown, Plus, Minus, Loader2 } from 'lucide-react'
import api from '../services/api.js'
import { getImageUrl } from '../utils/imageUrl.js'

const StockPage = () => {
  const [lowStock, setLowStock] = useState([])
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [lowRes, overviewRes] = await Promise.all([
        api.get('/stock/low'),
        api.get('/stock/overview'),
      ])
      setLowStock(lowRes.data.products)
      setOverview(overviewRes.data.overview)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStock = async (productId, newStock) => {
    if (newStock < 0) return
    try {
      await api.put(`/stock/${productId}`, { stock: newStock })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Management</h1>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: overview.totalProducts, icon: Package, color: 'bg-blue-500' },
            { label: 'Low Stock', value: overview.lowStock, icon: TrendingDown, color: 'bg-yellow-500' },
            { label: 'Out of Stock', value: overview.outOfStock, icon: AlertTriangle, color: 'bg-red-500' },
            { label: 'Total Units', value: overview.totalStockValue, icon: Package, color: 'bg-green-500' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Low Stock Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Low Stock Alerts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : lowStock.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No low stock alerts</td></tr>
              ) : (
                lowStock.map((product) => (
                  <motion.tr key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-dark/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={getImageUrl(product.images?.[0])} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        <span className="text-sm font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.lowStockThreshold}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStock(product._id, product.stock - 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{product.stock}</span>
                        <button
                          onClick={() => updateStock(product._id, product.stock + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
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

export default StockPage
