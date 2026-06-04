import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ArrowUpDown, Tag, Calendar, Percent, IndianRupee, BarChart3, Clock, AlertCircle
} from 'lucide-react'
import {
  fetchOffers, deleteOffer, toggleOfferStatus, clearError
} from '../redux/slices/offerSlice.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterDropdown from '../components/ui/FilterDropdown.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmationDialog from '../components/ui/ConfirmationDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TableRowSkeleton } from '../components/ui/Skeleton.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import { getImageUrl } from '../utils/imageUrl.js'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'expired', label: 'Expired' },
  { value: 'inactive', label: 'Inactive' },
]

const APPLY_ON_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'all', label: 'All Products' },
  { value: 'category', label: 'Category' },
  { value: 'brand', label: 'Brand' },
  { value: 'product', label: 'Product' },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'priority', label: 'Priority Low→High' },
  { value: '-priority', label: 'Priority High→Low' },
  { value: '-discountValue', label: 'Highest Discount' },
  { value: 'discountValue', label: 'Lowest Discount' },
  { value: '-endDate', label: 'Expiring Soon' },
]

const discountTypeConfig = {
  percentage: { icon: Percent, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', label: '%' },
  fixed: { icon: IndianRupee, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: '₹' },
  flat: { icon: Tag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Flat ₹' },
}

const applyOnConfig = {
  all: { label: 'All Products', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  category: { label: 'Category', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  brand: { label: 'Brand', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  product: { label: 'Product', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

const statusBadgeConfig = {
  active: { variant: 'success', label: 'Active' },
  upcoming: { variant: 'info', label: 'Upcoming' },
  expired: { variant: 'warning', label: 'Expired' },
  inactive: { variant: 'danger', label: 'Inactive' },
}

const getOfferStatus = (offer) => {
  if (!offer.isActive) return 'inactive'
  const now = new Date()
  if (new Date(offer.startDate) > now) return 'upcoming'
  if (new Date(offer.endDate) < now) return 'expired'
  return 'active'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const OffersPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offers, stats, totalPages, currentPage, total, isLoading, error } = useSelector(state => state.offers)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [applyOnFilter, setApplyOnFilter] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)

  const [deleteId, setDeleteId] = useState(null)
  const [toggleId, setToggleId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)

  useEffect(() => {
    if (error) dispatch(clearError())
  }, [error, dispatch])

  useEffect(() => {
    dispatch(fetchOffers({ page, search, status: statusFilter, applyOn: applyOnFilter, sort }))
  }, [page, search, statusFilter, applyOnFilter, sort, dispatch])

  const handleDelete = async () => {
    if (!deleteId) return
    await dispatch(deleteOffer(deleteId))
    setShowDeleteDialog(false)
    setDeleteId(null)
  }

  const handleToggleStatus = async () => {
    if (!toggleId) return
    await dispatch(toggleOfferStatus(toggleId))
    setShowToggleDialog(false)
    setToggleId(null)
  }

  const handleSortChange = (value) => {
    setSort(value)
    setPage(1)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Offers"
        subtitle="Manage promotional offers and discounts"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Offers' }]}
        action={{
          label: 'Add Offer',
          icon: Plus,
          onClick: () => navigate('/offers/new'),
        }}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Offers"
            value={stats.total || 0}
            icon={Tag}
            color="primary"
          />
          <StatCard
            title="Active"
            value={stats.active || 0}
            icon={BarChart3}
            color="success"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcoming || 0}
            icon={Clock}
            color="info"
          />
          <StatCard
            title="Expired"
            value={stats.expired || 0}
            icon={AlertCircle}
            color="warning"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1) }} placeholder="Search offers..." />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
        />
        <FilterDropdown
          label="Apply On"
          options={APPLY_ON_OPTIONS}
          value={applyOnFilter}
          onChange={(val) => { setApplyOnFilter(val); setPage(1) }}
        />
        <FilterDropdown
          label="Sort"
          options={SORT_OPTIONS}
          value={sort}
          onChange={handleSortChange}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-hover">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Offer</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Apply On</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validity</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <TableRowSkeleton rows={5} cols={7} />
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Tag}
                      title="No offers found"
                      description="Create your first promotional offer to start attracting customers"
                      actionLabel="Add Offer"
                      onAction={() => navigate('/offers/new')}
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {offers.map((offer, index) => {
                    const offerStatus = getOfferStatus(offer)
                    const dtConfig = discountTypeConfig[offer.discountType] || discountTypeConfig.percentage
                    const aoConfig = applyOnConfig[offer.applyOn] || applyOnConfig.all
                    const sbConfig = statusBadgeConfig[offerStatus] || statusBadgeConfig.inactive
                    const DtIcon = dtConfig.icon

                    return (
                      <motion.tr
                        key={offer._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {offer.banner ? (
                              <img
                                src={getImageUrl(offer.banner)}
                                alt={offer.title}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-dark-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <Tag className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{offer.title}</p>
                              {offer.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{offer.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${dtConfig.bg} flex items-center justify-center`}>
                              <DtIcon className={`w-3.5 h-3.5 ${dtConfig.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {dtConfig.label}{offer.discountValue}
                              </p>
                              {offer.discountType === 'percentage' && offer.maxDiscount && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Max ₹{offer.maxDiscount}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${aoConfig.color}`}>
                            {aoConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(offer.startDate)}</span>
                            <span className="text-gray-400">→</span>
                            <span>{formatDate(offer.endDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="default" size="sm">{offer.priority || 0}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={sbConfig.variant} size="sm" dot>{sbConfig.label}</Badge>
                            <button
                              onClick={() => { setToggleId(offer._id); setShowToggleDialog(true) }}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                              title={offer.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {offer.isActive ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/offers/edit/${offer._id}`)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeleteId(offer._id); setShowDeleteDialog(true) }}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)} of {total} offers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        onConfirm={handleDelete}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone and the offer will be permanently removed."
        type="danger"
      />

      {/* Toggle Status Confirmation */}
      <ConfirmationDialog
        isOpen={showToggleDialog}
        onClose={() => { setShowToggleDialog(false); setToggleId(null) }}
        onConfirm={handleToggleStatus}
        title="Toggle Offer Status"
        message="Are you sure you want to change the active status of this offer? This will affect its visibility to customers."
        type="warning"
      />
    </motion.div>
  )
}

export default OffersPage