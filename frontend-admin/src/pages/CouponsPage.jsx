import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Tag, Percent, Calendar, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    code: '', discountType: 'percentage', discountValue: '', maxDiscount: '',
    minOrderValue: '', maxUses: '', expiryDate: '',
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/coupons/admin')
      setCoupons(data.coupons)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      }
      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload)
      } else {
        await api.post('/coupons', payload)
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ code: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minOrderValue: '', maxUses: '', expiryDate: '' })
      fetchCoupons()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      fetchCoupons()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border"
        >
          <h2 className="font-semibold mb-4">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Coupon Code"
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none uppercase"
              required
            />
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              placeholder="Discount Value"
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
              required
            />
            <input
              type="number"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
              placeholder="Max Discount (optional)"
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
            />
            <input
              type="number"
              value={formData.minOrderValue}
              onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
              placeholder="Min Order Value"
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
            />
            <input
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              placeholder="Max Uses (optional)"
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
            />
            <input
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none"
              required
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Uses</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No coupons found</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <motion.tr key={coupon._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-dark/50">
                    <td className="px-6 py-4 text-sm font-bold">{coupon.code}</td>
                    <td className="px-6 py-4 text-sm capitalize">{coupon.discountType}</td>
                    <td className="px-6 py-4 text-sm">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-sm">{coupon.usesCount} / {coupon.maxUses || '∞'}</td>
                    <td className="px-6 py-4 text-sm">{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        coupon.isActive && new Date(coupon.expiryDate) > new Date()
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingId(coupon._id); setFormData(coupon); setShowForm(true) }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark text-gray-400 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
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

export default CouponsPage
