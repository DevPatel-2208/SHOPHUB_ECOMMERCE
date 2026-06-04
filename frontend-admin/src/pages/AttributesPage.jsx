import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Upload, X, Sliders, Eye, EyeOff,
  Search, SlidersHorizontal, Image as ImageIcon, Package,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  ArrowUpDown, Sparkles, Grid3X3, Clock, AlertTriangle,
  RefreshCw, FolderOpen, Layers, ShoppingBag, Tag, Hash,
  Palette, Ruler, List, ToggleLeft, Type, Filter
} from 'lucide-react'
import { fetchAllCategories } from '../redux/slices/categorySlice.js'
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

// ─── Constants ───────────────────────────────────────────────────────────────
const ATTRIBUTE_TYPES = ['text', 'number', 'color', 'size', 'select', 'boolean']

const INITIAL_FORM = {
  name: '',
  category: '',
  subcategory: '',
  brand: '',
  type: 'text',
  values: [],
  unit: '',
  isFilterable: true,
  isActive: true,
  order: 0,
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

const TYPE_BADGE_VARIANTS = {
  text: 'info',
  number: 'warning',
  color: 'danger',
  size: 'secondary',
  select: 'primary',
  boolean: 'success',
}

const TYPE_ICONS = {
  text: Type,
  number: Hash,
  color: Palette,
  size: Ruler,
  select: List,
  boolean: ToggleLeft,
}

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
const AttributesPage = () => {
  const dispatch = useDispatch()
  const { allCategories } = useSelector((state) => state.categories)

  // ── Data state ──
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ── Filter/Sort state ──
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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

  // ── Values input ──
  const [valueInput, setValueInput] = useState('')

  // ── Cascade data ──
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])

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
  const fetchItems = useCallback(async (showRefreshIndicator = false) => {
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
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.isActive = statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : ''

      const { data } = await api.get('/admin/attributes', { params })
      setItems(data.attributes || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch attributes:', err)
      showToast(err.response?.data?.message || 'Failed to fetch attributes', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentPage, sortField, sortOrder, search, categoryFilter, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { dispatch(fetchAllCategories()) }, [dispatch])

  // ── Cascade fetchers ──
  const fetchSubcategoriesForForm = async (categoryId) => {
    if (!categoryId) { setSubcategories([]); return }
    try {
      const { data } = await api.get('/categories/subcategories/admin')
      const filtered = data.subcategories.filter(s => s.category?._id === categoryId || s.category === categoryId)
      setSubcategories(filtered)
    } catch (err) { console.error('Failed to fetch subcategories:', err) }
  }

  const fetchBrandsForForm = async (subcategoryId) => {
    if (!subcategoryId) { setBrands([]); return }
    try {
      const { data } = await api.get('/admin/brands', { params: { subcategory: subcategoryId, limit: 100 } })
      setBrands(data.brands || [])
    } catch (err) { console.error('Failed to fetch brands:', err) }
  }

  // ── Stats ──
  const totalItems = total
  const activeItems = items.filter(c => c.isActive).length
  const inactiveItems = totalItems - activeItems
  const filterableItems = items.filter(c => c.isFilterable).length

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
    setSubcategories([])
    setBrands([])
    setValueInput('')
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setEditingId(item._id)
    setForm({
      name: item.name || '',
      category: item.category?._id || item.category || '',
      subcategory: item.subcategory?._id || item.subcategory || '',
      brand: item.brand?._id || item.brand || '',
      type: item.type || 'text',
      values: item.values || [],
      unit: item.unit || '',
      isFilterable: item.isFilterable ?? true,
      isActive: item.isActive ?? true,
      order: item.order || 0,
    })
    setValueInput('')
    // Fetch cascade data
    const catId = item.category?._id || item.category
    if (catId) fetchSubcategoriesForForm(catId)
    const subId = item.subcategory?._id || item.subcategory
    if (subId) fetchBrandsForForm(subId)
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(INITIAL_FORM)
    setSubcategories([])
    setBrands([])
    setValueInput('')
    setFormErrors({})
  }

  // ── Cascade handlers ──
  const handleCategoryChangeInForm = async (categoryId) => {
    setForm(prev => ({ ...prev, category: categoryId, subcategory: '', brand: '' }))
    setBrands([])
    await fetchSubcategoriesForForm(categoryId)
  }

  const handleSubcategoryChangeInForm = async (subcategoryId) => {
    setForm(prev => ({ ...prev, subcategory: subcategoryId, brand: '' }))
    await fetchBrandsForForm(subcategoryId)
  }

  // ── Values management ──
  const addValue = () => {
    if (valueInput.trim() && !form.values.includes(valueInput.trim())) {
      setForm(prev => ({ ...prev, values: [...prev.values, valueInput.trim()] }))
      setValueInput('')
    }
  }

  const removeValue = (index) => {
    setForm(prev => ({ ...prev, values: prev.values.filter((_, i) => i !== index) }))
  }

  // ── Validation ──
  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Attribute name is required'
    if (form.name.length > 100) errors.name = 'Name must be under 100 characters'
    if (!form.category) errors.category = 'Category is required'
    if (form.type === 'select' && form.values.length === 0) errors.values = 'Select type requires at least one value'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        subcategory: form.subcategory || undefined,
        brand: form.brand || undefined,
        type: form.type,
        values: form.type === 'select' ? form.values : [],
        unit: form.unit,
        isFilterable: form.isFilterable,
        isActive: form.isActive,
        order: form.order,
      }

      if (editingId) {
        await api.put(`/admin/attributes/${editingId}`, payload)
        showToast('Attribute updated successfully', 'success')
      } else {
        await api.post('/admin/attributes', payload)
        showToast('Attribute created successfully', 'success')
      }
      closeModal()
      fetchItems()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save attribute'
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
      await api.delete(`/admin/attributes/${deleteTarget._id}`)
      showToast(`"${deleteTarget.name}" deleted successfully`, 'success')
      setDeleteTarget(null)
      fetchItems()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete attribute', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // ── Toggle status ──
  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setIsConfirming(true)
    try {
      await api.put(`/admin/attributes/${toggleTarget._id}`, { isActive: !toggleTarget.isActive })
      showToast(
        `"${toggleTarget.name}" ${toggleTarget.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      )
      setToggleTarget(null)
      fetchItems()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // ── Quick toggle (inline) ──
  const quickToggle = async (item) => {
    try {
      await api.put(`/admin/attributes/${item._id}`, { isActive: !item.isActive })
      showToast(`"${item.name}" ${item.isActive ? 'deactivated' : 'activated'}`, 'success')
      fetchItems()
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

  // ── Type helper ──
  const TypeIcon = ({ type }) => {
    const Icon = TYPE_ICONS[type] || Tag
    return <Icon size={12} className="mr-1 inline" />
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
        title="Attributes"
        subtitle="Manage product attributes and specifications"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Attributes' },
        ]}
        action={{
          label: 'Add Attribute',
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
        {/* Total Attributes */}
        <motion.div
          custom={0}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Attributes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
              <Sliders size={22} className="text-primary dark:text-primary-light" />
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
              <p className="text-2xl font-bold text-secondary mt-1">{activeItems}</p>
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
              <p className="text-2xl font-bold text-danger mt-1">{inactiveItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-danger/10 dark:bg-danger/20">
              <XCircle size={22} className="text-danger" />
            </div>
          </div>
        </motion.div>

        {/* Filterable */}
        <motion.div
          custom={3}
          variants={statCardVariant}
          className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-light-border dark:border-dark-border p-5 hover:shadow-lg hover:shadow-info/5 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent dark:from-info/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Filterable</p>
              <p className="text-2xl font-bold text-info mt-1">{filterableItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-info/10 dark:bg-info/20">
              <Filter size={22} className="text-info" />
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
                placeholder="Search attributes..."
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
                label="Category"
                options={[
                  { value: '', label: 'All Categories' },
                  ...allCategories.map(c => ({ value: c._id, label: c.name })),
                ]}
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val); setCurrentPage(1) }}
              />
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
            {(search || categoryFilter || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); setCurrentPage(1) }}
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
              <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span> attributes
            </span>
            <button
              onClick={() => fetchItems(true)}
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
                  label="Category"
                  options={[
                    { value: '', label: 'All Categories' },
                    ...allCategories.map(c => ({ value: c._id, label: c.name })),
                  ]}
                  value={categoryFilter}
                  onChange={(val) => { setCategoryFilter(val); setCurrentPage(1) }}
                />
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
        <TableSkeleton rows={6} cols={7} />
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            icon={<Sliders size={48} />}
            title="No attributes found"
            description={
              search || statusFilter || categoryFilter
                ? 'Try adjusting your search or filters'
                : 'Create your first attribute to start defining product specifications'
            }
            action={{
              label: 'Add Attribute',
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
                    Attribute
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subcategory
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Values
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Filterable
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
                  {items.map((item, index) => (
                    <motion.tr
                      key={item._id}
                      custom={index}
                      variants={rowVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="group hover:bg-gray-50 dark:hover:bg-dark-hover/50 transition-colors"
                    >
                      {/* Name + Unit */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-hover dark:to-dark-card flex items-center justify-center border border-light-border dark:border-dark-border">
                            <Sliders size={16} className="text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                              {item.name}
                            </p>
                            {item.unit && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] font-mono">
                                {item.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <Badge variant="primary" size="sm">
                          {item.category?.name || '—'}
                        </Badge>
                      </td>

                      {/* Subcategory */}
                      <td className="px-6 py-4">
                        <Badge variant="secondary" size="sm">
                          {item.subcategory?.name || '—'}
                        </Badge>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <Badge variant={TYPE_BADGE_VARIANTS[item.type] || 'info'} size="sm">
                          <TypeIcon type={item.type} />
                          {item.type}
                        </Badge>
                      </td>

                      {/* Values */}
                      <td className="px-6 py-4">
                        {item.values && item.values.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {item.values.slice(0, 3).map((v, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400 rounded-md text-xs font-mono"
                              >
                                {v}
                              </span>
                            ))}
                            {item.values.length > 3 && (
                              <span className="inline-block px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">
                                +{item.values.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">—</span>
                        )}
                      </td>

                      {/* Filterable */}
                      <td className="px-6 py-4 text-center">
                        {item.isFilterable ? (
                          <Badge variant="success" size="sm">Yes</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">No</Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setToggleTarget(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            item.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {item.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={14} className="flex-shrink-0" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => quickToggle(item)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              item.isActive
                                ? 'text-gray-400 hover:text-warning hover:bg-warning/10 dark:hover:bg-warning/20'
                                : 'text-gray-400 hover:text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20'
                            }`}
                            title={item.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
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
              {items.map((item, index) => (
                <motion.div
                  key={item._id}
                  custom={index}
                  variants={rowVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="p-4 hover:bg-gray-50 dark:hover:bg-dark-hover/50 transition-colors"
                >
                  {/* Top row: Icon + Name + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-hover dark:to-dark-card flex items-center justify-center border border-light-border dark:border-dark-border flex-shrink-0">
                        <Sliders size={16} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={TYPE_BADGE_VARIANTS[item.type] || 'info'} size="xs">
                            {item.type}
                          </Badge>
                          {item.unit && (
                            <span className="text-xs text-gray-400 font-mono">{item.unit}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {item.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Category</span>
                      <Badge variant="primary" size="sm">{item.category?.name || '—'}</Badge>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Subcategory</span>
                      <Badge variant="secondary" size="sm">{item.subcategory?.name || '—'}</Badge>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Filterable</span>
                      <span>{item.isFilterable ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-600 dark:text-gray-300 mb-0.5">Created</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Values */}
                  {item.values && item.values.length > 0 && (
                    <div className="mb-3">
                      <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Values</span>
                      <div className="flex flex-wrap gap-1">
                        {item.values.slice(0, 4).map((v, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400 rounded-md text-xs font-mono">
                            {v}
                          </span>
                        ))}
                        {item.values.length > 4 && (
                          <span className="inline-block px-2 py-0.5 text-xs text-gray-400">+{item.values.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-light-border dark:border-dark-border">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => quickToggle(item)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        item.isActive
                          ? 'text-warning bg-warning/5 hover:bg-warning/10 dark:bg-warning/10 dark:hover:bg-warning/20'
                          : 'text-secondary bg-secondary/5 hover:bg-secondary/10 dark:bg-secondary/10 dark:hover:bg-secondary/20'
                      }`}
                    >
                      {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
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
                  <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span> total attributes
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
            <span>{editingId ? 'Edit Attribute' : 'Create Attribute'}</span>
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
                  Attribute Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`input ${formErrors.name ? 'border-danger focus:ring-danger' : ''}`}
                  placeholder="e.g., Color"
                  autoFocus
                />
                {formErrors.name && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Attribute Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value, values: e.target.value === 'select' ? prev.values : [] }))}
                  className="select"
                >
                  {ATTRIBUTE_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Category (cascade trigger) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChangeInForm(e.target.value)}
                  className={`select ${formErrors.category ? 'border-danger focus:ring-danger' : ''}`}
                >
                  <option value="">Select Category</option>
                  {allCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {formErrors.category}
                  </p>
                )}
              </div>

              {/* Subcategory (cascade) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Subcategory
                </label>
                <select
                  value={form.subcategory}
                  onChange={(e) => handleSubcategoryChangeInForm(e.target.value)}
                  className="select"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand (cascade) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Brand
                </label>
                <select
                  value={form.brand}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="select"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Values (only for select type) */}
              {form.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Values <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue() } }}
                      className="input flex-1"
                      placeholder="Add a value..."
                    />
                    <button
                      type="button"
                      onClick={addValue}
                      disabled={!valueInput.trim()}
                      className="btn-primary btn-sm disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {formErrors.values && (
                    <p className="text-xs text-danger mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {formErrors.values}
                    </p>
                  )}
                  {form.values.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {form.values.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium group/value"
                        >
                          {v}
                          <button
                            type="button"
                            onClick={() => removeValue(i)}
                            className="text-gray-400 hover:text-danger transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="input"
                  placeholder="e.g., cm, kg, ml"
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  placeholder="0"
                />
              </div>

              {/* Filterable Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Allow Filtering
                </label>
                <div className="flex items-center gap-3 h-[42px]">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, isFilterable: !prev.isFilterable }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isFilterable ? 'bg-info' : 'bg-gray-300 dark:bg-dark-hover'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        form.isFilterable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${
                    form.isFilterable
                      ? 'text-info'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {form.isFilterable ? 'Filterable' : 'Not Filterable'}
                  </span>
                </div>
              </div>

              {/* Status Toggle */}
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
                  {editingId ? 'Update Attribute' : 'Create Attribute'}
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
        title="Delete Attribute"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to delete <strong className="text-gray-900 dark:text-white">"{deleteTarget?.name}"</strong>?</p>
            <p className="text-xs text-gray-400">This action cannot be undone. Products using this attribute may be affected.</p>
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
        title={toggleTarget?.isActive ? 'Deactivate Attribute' : 'Activate Attribute'}
        message={
          <div className="space-y-2">
            <p>Are you sure you want to <strong>{toggleTarget?.isActive ? 'deactivate' : 'activate'}</strong> <strong className="text-gray-900 dark:text-white">"{toggleTarget?.name}"</strong>?</p>
            <p className="text-xs text-gray-400">
              {toggleTarget?.isActive
                ? 'Deactivating will disable this attribute and hide it from filters.'
                : 'Activating will make this attribute available for use.'}
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

export default AttributesPage