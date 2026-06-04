import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Trash2, Eye, EyeOff, Download, UserPlus, Users, UserCheck, UserX, Search as SearchIcon, AtSign
} from 'lucide-react'
import {
  fetchSubscribers, addSubscriber, toggleSubscriberStatus, deleteSubscriber, exportSubscribers, clearSubscriberMessages
} from '../redux/slices/subscriberSlice.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterDropdown from '../components/ui/FilterDropdown.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmationDialog from '../components/ui/ConfirmationDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TableRowSkeleton } from '../components/ui/Skeleton.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Toast from '../components/ui/Toast.jsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const INITIAL_ADD_FORM = { email: '' }

const SubscribersPage = () => {
  const dispatch = useDispatch()
  const { subscribers, totalPages, currentPage, total, isLoading, isExporting, error, success } = useSelector(state => state.subscribers)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [deleteId, setDeleteId] = useState(null)
  const [toggleId, setToggleId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM)
  const [addError, setAddError] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (error || success) {
      if (success) setToast({ type: 'success', message: success })
      if (error) setToast({ type: 'error', message: error })
      dispatch(clearSubscriberMessages())
    }
  }, [error, success, dispatch])

  useEffect(() => {
    dispatch(fetchSubscribers({ page, search, status: statusFilter }))
  }, [page, search, statusFilter, dispatch])

  const handleAddSubscriber = async (e) => {
    e.preventDefault()
    if (!addForm.email.trim()) {
      setAddError('Email is required')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addForm.email)) {
      setAddError('Please enter a valid email address')
      return
    }
    setAddError('')
    const result = await dispatch(addSubscriber({ email: addForm.email }))
    if (result.meta.requestStatus === 'fulfilled') {
      setShowAddModal(false)
      setAddForm(INITIAL_ADD_FORM)
      setToast({ type: 'success', message: 'Subscriber added successfully' })
    } else {
      setAddError(result.payload || 'Failed to add subscriber')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await dispatch(deleteSubscriber(deleteId))
    setShowDeleteDialog(false)
    setDeleteId(null)
    setToast({ type: 'success', message: 'Subscriber deleted successfully' })
  }

  const handleToggleStatus = async () => {
    if (!toggleId) return
    await dispatch(toggleSubscriberStatus(toggleId))
    setShowToggleDialog(false)
    setToggleId(null)
    setToast({ type: 'success', message: 'Subscriber status updated' })
  }

  const handleExport = async () => {
    const result = await dispatch(exportSubscribers())
    if (result.meta.requestStatus === 'fulfilled') {
      const blob = result.payload
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'subscribers.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Subscribers exported successfully' })
    } else {
      setToast({ type: 'error', message: result.payload || 'Failed to export subscribers' })
    }
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

  const activeCount = subscribers.filter(s => s.isActive).length || 0
  const inactiveCount = total - activeCount

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Subscribers"
        subtitle="Manage newsletter subscribers and email lists"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Subscribers' }]}
        action={{
          label: 'Add Subscriber',
          icon: UserPlus,
          onClick: () => setShowAddModal(true),
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribers"
          value={total || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="Inactive"
          value={inactiveCount}
          icon={UserX}
          color="danger"
        />
        <div className="col-span-2 md:col-span-1">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full h-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1) }} placeholder="Search subscribers..." />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-hover">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscriber</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscribed On</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <TableRowSkeleton rows={5} cols={4} />
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={Mail}
                      title="No subscribers found"
                      description="No subscribers match your current filters. Add subscribers or adjust your search."
                      actionLabel="Add Subscriber"
                      onAction={() => setShowAddModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {subscribers.map((subscriber, index) => (
                    <motion.tr
                      key={subscriber._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <AtSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{subscriber.email}</p>
                            {subscriber.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{subscriber.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(subscriber.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={subscriber.isActive ? 'success' : 'danger'}
                            size="sm"
                            dot
                          >
                            {subscriber.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <button
                            onClick={() => { setToggleId(subscriber._id); setShowToggleDialog(true) }}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                            title={subscriber.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {subscriber.isActive ? (
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
                            onClick={() => { setDeleteId(subscriber._id); setShowDeleteDialog(true) }}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)} of {total} subscribers
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

      {/* Add Subscriber Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddForm(INITIAL_ADD_FORM); setAddError('') }}
        title="Add Subscriber"
        size="sm"
      >
        <form onSubmit={handleAddSubscriber} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="input pl-10"
                autoFocus
              />
            </div>
            {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setAddForm(INITIAL_ADD_FORM); setAddError('') }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Subscriber'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        onConfirm={handleDelete}
        title="Delete Subscriber"
        message="Are you sure you want to remove this subscriber? They will no longer receive newsletters."
        type="danger"
      />

      {/* Toggle Status Confirmation */}
      <ConfirmationDialog
        isOpen={showToggleDialog}
        onClose={() => { setShowToggleDialog(false); setToggleId(null) }}
        onConfirm={handleToggleStatus}
        title="Toggle Subscriber Status"
        message="Are you sure you want to change this subscriber's status? Inactive subscribers won't receive newsletters."
        type="warning"
      />

      {/* Toast */}
      <Toast
        type={toast?.type}
        message={toast?.message}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </motion.div>
  )
}

export default SubscribersPage