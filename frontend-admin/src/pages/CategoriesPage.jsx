import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Upload, X, FolderOpen, Eye, EyeOff,
  Search, SlidersHorizontal, Image as ImageIcon, Package,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowUpDown, Sparkles, Grid3X3, Clock, AlertTriangle,
  Download, RefreshCw
} from 'lucide-react'
import {
  fetchAllCategories
} from '../redux/slices/categorySlice.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterDropdown from '../components/ui/FilterDropdown.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmationDialog from '../components/ui/ConfirmationDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import Toast from '../components/ui/Toast.jsx'
import api from '../services/api.js'
import { getImageUrl } from '../utils/imageUrl.js'

// ─── Constants ───────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: '',
  description: '',
  order: 0,
  isActive: true,
}

const ITEMS_PER_PAGE = 10

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'order_asc', label: 'Order Low-High' },
  { value: 'order_desc', label: 'Order High-Low' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const statCardVariant = {
  initial: { opacity: 0, y: 20 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

const rowVariant = {
  initial: { opacity: 0, x: -10 },
  animate: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.03, duration: 0.3 } }),
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
}

// ─── Component ───────────────────────────────────────────────────────────────
const CategoriesPage = () => {
  const dispatch = useDispatch()
  const { allCategories } = useSelector(state => state.categories)
  const fileInputRef = useRef(null)

  // ── Data state ──
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ── Filter/Sort state ──
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Image state ──
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // ── Confirmations ──
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type })
  }

  // ── Data fetching ──
  const fetchCategories = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true)
      else setIsLoading(true)

      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort: sortField,
        order: sortOrder,
      }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter === 'active' ? 'active' : statusFilter === 'inactive' ? 'inactive' : ''

      const { data } = await api.get('/admin/categories', { params })
      setCategories(data.categories || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      showToast(err.response?.data?.message || 'Failed to fetch categories', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentPage, sortField, sortOrder, search, statusFilter])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { dispatch(fetchAllCategories()) }, [dispatch])

  // ── Stats ──
  const totalCategories = allCategories.length || total
  const activeCategories = allCategories.filter(c => c.isActive).length || categories.filter(c => c.isActive).length
  const inactiveCategories = totalCategories - activeCategories

  // ── Sort handler ──
  const handleSortChange = (value) => {
    const [field, order] = value.split('_')
    setSortField(field)
    setSortOrder(order)
    setCurrentPage(1)
  }

  // ── Modal handlers ──
  const openCreateModal = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setImageFile(null)
    setImagePreview(null)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (category) => {
    setEditingId(category._id)
    setForm({
      name: category.name || '',
      description: category.description || '',
      order: category.order ?? 0,
      isActive: category.isActive ?? true,
    })
    setImageFile(null)
    setImagePreview(category.image ? getImageUrl(category.image) : null)
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(INITIAL_FORM)
    setImageFile(null)
    setImagePreview(null)
    setFormErrors({})
  }

  // ── Image handlers ──
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Validation ──
  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Category name is required'
    if (form.name.length > 100) errors.name = 'Name must be under 100 characters'
    if (form.order < 0) errors.order = 'Order must be a positive number'
    if (form.description && form.description.length > 500) errors.description = 'Description must be under 500 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('order', form.order)
      formData.append('isActive', form.isActive)
      if (imageFile) formData.append('image', imageFile)

      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Category updated successfully', 'success')
      } else {
        await api.post('/admin/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        showToast('Category created successfully', 'success')
      }
      closeModal()
      fetchCategories()
      dispatch(fetchAllCategories())
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save category'
      setFormErrors({ general: msg })
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsConfirming(true)
    try {
      await api.delete(`/admin/categories/${deleteTarget._id}`)
      showToast(`"${deleteTarget.name}" deleted successfully`, 'success')
      setDeleteTarget(null)
      fetchCategories()
      dispatch(fetchAllCategories())
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // ── Toggle status ──
  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setIsConfirming(true)
    try {
      await api.patch(`/admin/categories/${toggleTarget._id}/status`)
      showToast(
        `"${toggleTarget.name}" ${toggleTarget.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      )
      setToggleTarget(null)
      fetchCategories()
      dispatch(fetchAllCategories())
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // ── Quick toggle (inline) ──
  const quickToggle = async (category) => {
    try {
      await api.patch(`/admin/categories/${category._id}/status`)
      showToast(`"${category.name}" ${category.isActive ? 'deactivated' : 'activated'}`, 'success')
      fetchCategories()
      dispatch(fetchAllCategories())
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status', 'error')
    }
  }

  // ── Pagination ──
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  // ── Format date ──
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // ── Render ──
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {/* Page Header */}
      <PageHeader
        title="Categories"
        subtitle="Manage your product categories"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Categories' },
        ]}
        action={{
          label: 'Add Category',
          icon: Plus,
          onClick: openCreateModal,
        }}
      />

      {/* ── Stats Cards ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Total Categories */}
        <motion.div
          custom={0}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCategories}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
              <Grid3X3 size={22} className="text-primary dark:text-primary-light" />
            </div>
          </div>
        </motion.div>

        {/* Active */}
        <motion.div
          custom={1}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent dark:from-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-secondary mt-1">{activeCategories}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 dark:bg-secondary/20">
              <CheckCircle size={22} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        {/* Inactive */}
        <motion.div
          custom={2}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-danger/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-danger/5 to-transparent dark:from-danger/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-danger mt-1">{inactiveCategories}</p>
            </div>
            <div className="p-3 rounded-xl bg-danger/10 dark:bg-danger/20">
              <XCircle size={22} className="text-danger" />
            </div>
          </div>
        </motion.div>

        {/* Products in Categories */}
        <motion.div
          custom={3}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-info/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent dark:from-info/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Products</p>
              <p className="text-2xl font-bold text-info mt-1">
                {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-info/10 dark:bg-info/20">
              <Package size={22} className="text-info" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Filters Section ── */}
      <motion.div
        className="bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-4 sm:p-5"
        {...fadeUp}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="w-full sm:w-64">
              <SearchBar
                value={search}
                onChange={(val) => { setSearch(val); setCurrentPage(1) }}
                placeholder="Search categories..."
              />
            </div>

            {/* Filter Toggle - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden btn-secondary text-sm"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-3">
              <FilterDropdown
                label="Status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(1) }}
              />
              <FilterDropdown
                label="Sort"
                options={SORT_OPTIONS}
                value={`${sortField}_${sortOrder}`}
                onChange={handleSortChange}
              />
            </div>

            {/* Clear Filters */}
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setCurrentPage(1) }}
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span> categories
            </span>
            <button
              onClick={() => fetchCategories(true)}
              disabled={isRefreshing}
              className="btn-ghost p-2"
              title="Refresh"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pt-4 border-t border-light-border dark:border-dark-border mt-4">
                <FilterDropdown
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1) }}
                />
                <FilterDropdown
                  label="Sort"
                  options={SORT_OPTIONS}
                  value={`${sortField}_${sortOrder}`}
                  onChange={handleSortChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Table Section ── */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            icon={<FolderOpen size={48} />}
            title="No categories found"
            description={
              search || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Create your first category to start organizing your products'
            }
            action={{
              label: 'Add Category',
              icon: Plus,
              onClick: openCreateModal,
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          className="bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                <AnimatePresence mode="popLayout">
                  {categories.map((category, index) => (
                    <motion.tr
                      key={category._id}
                      custom={index}
                      variants={rowVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="group hover:bg-gray-50 dark:hover:bg-dark-hover/50 transition-colors"
                    >
                      {/* Name + Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {category.image ? (
                              <img
                                src={getImageUrl(category.image)}
                                alt={category.name}
                                className="w-11 h-11 rounded-xl object-cover border border-light-border dark:border-dark-border shadow-sm"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-hover dark:to-dark-card flex items-center justify-center border border-light-border dark:border-dark-border">
                                <ImageIcon size={18} className="text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-dark-card flex items-center justify-center shadow-sm">
                              {category.isActive ? (
                                <CheckCircle size={12} className="text-secondary" />
                              ) : (
                                <XCircle size={12} className="text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] font-mono">
                              /{category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px] truncate">
                          {category.description || <span className="italic text-gray-300 dark:text-gray-600">No description</span>}
                        </p>
                      </td>

                      {/* Product Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-light text-sm font-semibold">
                          {category.productCount || 0}
                        </span>
                      </td>

                      {/* Order */}
                      <td className="px-6 py-4 text-center">
                        <Badge variant="info" size="sm">
                          {category.order ?? 0}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setToggleTarget(category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            category.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {category.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          {category.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={14} className="flex-shrink-0" />
                          <span>{formatDate(category.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => quickToggle(category)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              category.isActive
                                ? 'text-gray-400 hover:text-warning hover:bg-warning/10 dark:hover:bg-warning/20'
                                : 'text-gray-400 hover:text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20'
                            }`}
                            title={category.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(category)}
                            className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 dark:hover:bg-danger/20 transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-light-border dark:divide-dark-border">
            <AnimatePresence mode="popLayout">
              {categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  custom={index}
                  variants={rowVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="p-4 hover:bg-gray-50 dark:hover:bg-dark-hover/50 transition-colors"
                >
                  {/* Top row: Image + Name + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {category.image ? (
                        <img
                          src={getImageUrl(category.image)}
                          alt={category.name}
                          className="w-10 h-10 rounded-lg object-cover border border-light-border dark:border-dark-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-hover dark:to-dark-card flex items-center justify-center border border-light-border dark:border-dark-border flex-shrink-0">
                          <ImageIcon size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                          /{category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {category.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Products</span>
                      <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-light font-semibold">
                        {category.productCount || 0}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Order</span>
                      <Badge variant="info" size="sm">{category.order ?? 0}</Badge>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 col-span-2">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Created</span>
                      <span>{formatDate(category.createdAt)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-light-border dark:border-dark-border">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => quickToggle(category)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        category.isActive
                          ? 'text-warning bg-warning/5 hover:bg-warning/10 dark:bg-warning/10 dark:hover:bg-warning/20'
                          : 'text-secondary bg-secondary/5 hover:bg-secondary/10 dark:bg-secondary/10 dark:hover:bg-secondary/20'
                      }`}
                    >
                      {category.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {category.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-danger bg-danger/5 hover:bg-danger/10 dark:bg-danger/10 dark:hover:bg-danger/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-light-border dark:border-dark-border bg-gray-50/50 dark:bg-dark/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page <span className="font-medium text-gray-700 dark:text-gray-300">{currentPage}</span> of{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{totalPages}</span>
                  {' · '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> total categories
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {getPageNumbers().map(page => (
                      <motion.button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                          page === currentPage
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary-light'
                        }`}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>
                  <div className="sm:hidden flex items-center gap-1">
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-primary text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${editingId ? 'bg-primary/10' : 'bg-secondary/10'}`}>
              {editingId ? (
                <Pencil size={18} className="text-primary" />
              ) : (
                <Plus size={18} className="text-secondary" />
              )}
            </div>
            <span>{editingId ? 'Edit Category' : 'Create Category'}</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error */}
          {formErrors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
            >
              <AlertTriangle size={16} className="flex-shrink-0" />
              {formErrors.general}
            </motion.div>
          )}

          {/* Two column layout on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`input ${formErrors.name ? 'border-danger focus:ring-danger' : ''}`}
                  placeholder="e.g., Electronics"
                  autoFocus
                />
                {formErrors.name && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`input min-h-[100px] resize-none ${formErrors.description ? 'border-danger focus:ring-danger' : ''}`}
                  placeholder="Enter category description..."
                  rows={4}
                />
                {formErrors.description && (
                  <p className="text-xs text-danger mt-1">{formErrors.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {(form.description || '').length}/500
                </p>
              </div>

              {/* Order + Active Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className={`input ${formErrors.order ? 'border-danger focus:ring-danger' : ''}`}
                    min="0"
                    placeholder="0"
                  />
                  {formErrors.order && (
                    <p className="text-xs text-danger mt-1">{formErrors.order}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        form.isActive ? 'bg-secondary' : 'bg-gray-300 dark:bg-dark-hover'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          form.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${
                      form.isActive
                        ? 'text-secondary'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category Image
              </label>

              {imagePreview ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-xl overflow-hidden border-2 border-light-border dark:border-dark-border"
                >
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 p-2 bg-danger text-white rounded-full hover:bg-red-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white">
                    {imageFile ? imageFile.name : 'Current image'}
                  </div>
                </motion.div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 h-48 flex flex-col items-center justify-center gap-2 ${
                    isDragOver
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-light-border dark:border-dark-border hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-dark-hover/50'
                  }`}
                >
                  <div className={`p-3 rounded-full transition-colors ${
                    isDragOver ? 'bg-primary/20' : 'bg-gray-100 dark:bg-dark-hover'
                  }`}>
                    <Upload size={24} className={isDragOver ? 'text-primary' : 'text-gray-400 dark:text-gray-500'} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isDragOver ? 'Drop image here' : 'Upload category image'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Drag & drop or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary min-w-[140px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {editingId ? <Pencil size={16} /> : <Sparkles size={16} />}
                  {editingId ? 'Update Category' : 'Create Category'}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to delete <strong className="text-gray-900 dark:text-white">"{deleteTarget?.name}"</strong>?</p>
            <p className="text-xs text-gray-400">This action cannot be undone. Products linked to this category will need reassignment.</p>
          </div>
        }
        confirmText="Delete"
        type="danger"
        isLoading={isConfirming}
      />

      {/* ── Status Toggle Confirmation ── */}
      <ConfirmationDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? 'Deactivate Category' : 'Activate Category'}
        message={
          <div className="space-y-2">
            <p>Are you sure you want to <strong>{toggleTarget?.isActive ? 'deactivate' : 'activate'}</strong> <strong className="text-gray-900 dark:text-white">"{toggleTarget?.name}"</strong>?</p>
            <p className="text-xs text-gray-400">
              {toggleTarget?.isActive
                ? 'Deactivating will hide this category and its products from customers.'
                : 'Activating will make this category and its products visible to customers.'}
            </p>
          </div>
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        type="warning"
        isLoading={isConfirming}
      />
    </motion.div>
  )
}

export default CategoriesPage
