import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Power, Eye, EyeOff, Link2, ArrowUpDown, Search as SearchIcon,
  Package, CheckCircle, XCircle, Layers, Clock, Filter, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'
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

const INITIAL_FORM = {
  product: '',
  attribute: '',
  value: '',
  category: '',
  subcategory: '',
  isActive: true,
}

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'value_asc', label: 'Value A-Z' },
  { value: 'value_desc', label: 'Value Z-A' },
]

// ─── Animation Constants ────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const statCardVariant = {
  initial: { opacity: 0, y: 25, scale: 0.95 },
  animate: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
  }),
  whileHover: { y: -4, scale: 1.02, transition: { duration: 0.2 } },
}

const rowVariant = {
  initial: { opacity: 0, x: -15 },
  animate: (i) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: 'easeOut' },
  }),
  exit: { opacity: 0, x: 15, transition: { duration: 0.2 } },
}

// ─── Page Component ──────────────────────────────────────────────
const ProductAttributesPage = () => {
  // ── Data State ──
  const [productAttributes, setProductAttributes] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // ── Filter & Pagination ──
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // ── Modal State ──
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Dynamic Dropdowns ──
  const [subcategories, setSubcategories] = useState([])
  const [attributes, setAttributes] = useState([])
  const [products, setProducts] = useState([])

  // ── Dialogs ──
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [isToggling, setIsToggling] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState(null)
  const showToast = useCallback((type, message) => {
    setToast({ type, message })
  }, [])

  // ── Fetch categories on mount ──
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/admin/categories/all')
        if (data.success) setAllCategories(data.categories || [])
        else if (data.categories) setAllCategories(data.categories)
      } catch {
        // silently fail
      }
    }
    loadCategories()
  }, [])

  // ── Fetch product attributes ──
  const fetchProductAttributes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = { page: currentPage, limit: 10, sort: sortField, order: sortOrder }
      if (search.trim()) params.search = search.trim()
      if (categoryFilter) params.category = categoryFilter
      const { data } = await api.get('/admin/product-attributes', { params })
      if (data.success) {
        setProductAttributes(data.productAttributes || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      } else {
        setProductAttributes(data.productAttributes || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      }
    } catch (err) {
      showToast('error', 'Failed to fetch product attributes')
      setProductAttributes([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, sortField, sortOrder, search, categoryFilter, showToast])

  useEffect(() => {
    fetchProductAttributes()
  }, [fetchProductAttributes])

  // ── Cascade fetchers ──
  const fetchSubcategoriesForForm = async (categoryId) => {
    if (!categoryId) { setSubcategories([]); return }
    try {
      const { data } = await api.get('/categories/subcategories/admin')
      const filtered = data.subcategories
        ? data.subcategories.filter(s => s.category?._id === categoryId || s.category === categoryId)
        : []
      setSubcategories(filtered)
    } catch { setSubcategories([]) }
  }

  const fetchAttributesForForm = async (categoryId) => {
    if (!categoryId) { setAttributes([]); return }
    try {
      const { data } = await api.get('/admin/attributes', { params: { category: categoryId, limit: 200 } })
      setAttributes(data.attributes || [])
    } catch { setAttributes([]) }
  }

  const fetchProductsForForm = async (categoryId) => {
    if (!categoryId) { setProducts([]); return }
    try {
      const { data } = await api.get('/admin/products', { params: { category: categoryId, limit: 200 } })
      setProducts(data.products || [])
    } catch { setProducts([]) }
  }

  // ── Modal handlers ──
  const openCreateModal = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setSubcategories([])
    setAttributes([])
    setProducts([])
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (pa) => {
    setEditingId(pa._id)
    setForm({
      product: pa.product?._id || pa.product || '',
      attribute: pa.attribute?._id || pa.attribute || '',
      value: pa.value || '',
      category: pa.category?._id || pa.category || '',
      subcategory: pa.subcategory?._id || pa.subcategory || '',
      isActive: pa.isActive ?? true,
    })
    const catId = pa.category?._id || pa.category
    if (catId) {
      fetchSubcategoriesForForm(catId)
      fetchAttributesForForm(catId)
      fetchProductsForForm(catId)
    }
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(INITIAL_FORM)
    setFormErrors({})
  }

  const handleCategoryChangeInForm = async (categoryId) => {
    setForm(prev => ({ ...prev, category: categoryId, subcategory: '', product: '', attribute: '' }))
    await Promise.all([
      fetchSubcategoriesForForm(categoryId),
      fetchAttributesForForm(categoryId),
      fetchProductsForForm(categoryId),
    ])
  }

  // ── Validation ──
  const validateForm = () => {
    const errors = {}
    if (!form.product) errors.product = 'Product is required'
    if (!form.attribute) errors.attribute = 'Attribute is required'
    if (!form.value.trim()) errors.value = 'Value is required'
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
        product: form.product,
        attribute: form.attribute,
        value: form.value,
        category: form.category || undefined,
        subcategory: form.subcategory || undefined,
        isActive: form.isActive,
      }

      if (editingId) {
        await api.put(`/admin/product-attributes/${editingId}`, payload)
        showToast('success', 'Product attribute updated successfully')
      } else {
        await api.post('/admin/product-attributes', payload)
        showToast('success', 'Product attribute created successfully')
      }
      closeModal()
      fetchProductAttributes()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product attribute'
      showToast('error', msg)
      setFormErrors({ general: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/product-attributes/${deleteTarget._id}`)
      showToast('success', 'Product attribute mapping deleted successfully')
      setDeleteTarget(null)
      fetchProductAttributes()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete')
      setDeleteTarget(null)
    }
  }

  // ── Toggle Status ──
  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setIsToggling(true)
    try {
      await api.put(`/admin/product-attributes/${toggleTarget._id}`, {
        isActive: !toggleTarget.isActive,
      })
      showToast('success', `Product attribute ${toggleTarget.isActive ? 'deactivated' : 'activated'} successfully`)
      setToggleTarget(null)
      fetchProductAttributes()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to toggle status')
      setToggleTarget(null)
    } finally {
      setIsToggling(false)
    }
  }

  const quickToggle = async (item) => {
    try {
      const newStatus = !item.isActive
      await api.put(`/admin/product-attributes/${item._id}`, {
        isActive: newStatus,
      })
      showToast('success', `Product attribute ${newStatus ? 'activated' : 'deactivated'}`)
      fetchProductAttributes()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to toggle status')
    }
  }

  // ── Sort ──
  const handleSortChange = (value) => {
    const [field, order] = value.split('_')
    setSortField(field)
    setSortOrder(order)
    setCurrentPage(1)
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

  // ── Date formatting ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch { return '—' }
  }

  // ── Stats ──
  const activeCount = productAttributes.filter(pa => pa.isActive).length
  const inactiveCount = productAttributes.filter(pa => !pa.isActive).length
  const uniqueCategories = new Set(
    productAttributes.map(pa => pa.category?._id || pa.category).filter(Boolean)
  ).size

  const statsCards = [
    { label: 'Total Mappings', value: total, icon: Link2, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Categories', value: uniqueCategories, icon: Layers, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <motion.div {...fadeUp}>
        <PageHeader
          title="Product Attributes"
          subtitle="Manage attribute-value mappings for products"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Product Attributes' },
          ]}
          action={{ label: 'Add Mapping', icon: Plus, onClick: openCreateModal }}
        />
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={statCardVariant}
            whileHover="whileHover"
            className="relative overflow-hidden rounded-xl bg-white dark:bg-primary-dark/40 border border-border-light dark:border-border-dark p-4 cursor-default"
          >
            {/* Gradient hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-secondary-dark dark:text-secondary-light uppercase tracking-wider">
                  {card.label}
                </p>
                <motion.p
                  key={card.value}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.08 + 0.15 }}
                  className="text-2xl lg:text-3xl font-bold text-primary-dark dark:text-primary-light mt-1"
                >
                  {card.value}
                </motion.p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters Section ── */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-primary-dark/40 rounded-xl border border-border-light dark:border-border-dark p-4"
      >
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex lg:hidden items-center justify-between w-full text-sm font-medium text-primary-dark dark:text-primary-light"
        >
          <span className="flex items-center gap-2">
            <Filter size={16} />
            Filters & Search
          </span>
          {showMobileFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-3 lg:items-center ${showMobileFilters ? 'mt-4' : ''}`}>
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setCurrentPage(1) }}
            placeholder="Search product or attribute..."
            className="w-full lg:w-56"
          />

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
            label="Sort By"
            options={SORT_OPTIONS}
            value={`${sortField}_${sortOrder}`}
            onChange={handleSortChange}
          />

          {/* Clear & Refresh buttons */}
          <div className="flex items-center gap-2 lg:ml-auto">
            {(search || categoryFilter) && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter(''); setCurrentPage(1) }}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
              >
                <Filter size={14} />
                Clear
              </button>
            )}
            <button
              onClick={() => fetchProductAttributes()}
              className="flex items-center gap-1.5 text-sm font-medium text-secondary-dark dark:text-secondary-light hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
              title="Refresh"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <span className="text-xs text-secondary-dark dark:text-secondary-light ml-1 whitespace-nowrap">
              {total} mapping{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Loading State ── */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : productAttributes.length === 0 ? (
        /* ── Empty State ── */
        <motion.div key="empty" {...fadeUp}>
          <EmptyState
            icon={<Link2 size={48} />}
            title="No product attributes found"
            description={
              search || categoryFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first product attribute mapping to define product specifications'
            }
            actionLabel="Add Mapping"
            onAction={openCreateModal}
          />
        </motion.div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <motion.div
            key="table"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="hidden md:block"
          >
            <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-primary-dark/40">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-primary-dark/60">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Attribute</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Value</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Subcategory</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-secondary-dark dark:text-secondary-light uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  <AnimatePresence mode="popLayout">
                    {productAttributes.map((pa, index) => (
                      <motion.tr
                        key={pa._id}
                        custom={index}
                        variants={rowVariant}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        className="group hover:bg-gray-50 dark:hover:bg-primary-dark/30 transition-colors duration-150"
                      >
                        {/* Product */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Package size={15} className="text-primary shrink-0" />
                            <span className="text-sm font-medium text-primary-dark dark:text-primary-light truncate max-w-[200px]">
                              {pa.product?.name || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Attribute */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-primary-dark dark:text-primary-light">
                              {pa.attribute?.name || '—'}
                            </span>
                            {pa.attribute?.type && (
                              <Badge variant="outline" size="sm">
                                {pa.attribute.type}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-primary dark:text-primary-light">
                            {pa.value}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <Badge variant="secondary" size="sm">
                            {pa.category?.name || '—'}
                          </Badge>
                        </td>

                        {/* Subcategory */}
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" size="sm">
                            {pa.subcategory?.name || '—'}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => quickToggle(pa)}
                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 ${
                              pa.isActive
                                ? 'bg-emerald-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            title={pa.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                pa.isActive ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            >
                              {pa.isActive ? (
                                <Eye size={10} className="text-emerald-500" />
                              ) : (
                                <EyeOff size={10} className="text-gray-400" />
                              )}
                            </span>
                          </button>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-secondary-dark dark:text-secondary-light">
                            <Clock size={12} />
                            {formatDate(pa.createdAt)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openEditModal(pa)}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setToggleTarget(pa)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                pa.isActive
                                  ? 'hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500'
                                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500'
                              }`}
                              title={pa.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={15} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteTarget(pa)}
                              className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Mobile Cards ── */}
          <motion.div
            key="mobile-cards"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="md:hidden space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {productAttributes.map((pa, index) => (
                <motion.div
                  key={pa._id}
                  custom={index}
                  variants={rowVariant}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className="bg-white dark:bg-primary-dark/40 rounded-xl border border-border-light dark:border-border-dark p-4 space-y-3"
                >
                  {/* Header row: Product + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={15} className="text-primary shrink-0" />
                      <span className="text-sm font-medium text-primary-dark dark:text-primary-light truncate">
                        {pa.product?.name || '—'}
                      </span>
                    </div>
                    <button
                      onClick={() => quickToggle(pa)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                        pa.isActive
                          ? 'bg-emerald-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          pa.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      >
                        {pa.isActive ? (
                          <Eye size={8} className="text-emerald-500" />
                        ) : (
                          <EyeOff size={8} className="text-gray-400" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Attribute + Value */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-dark dark:text-primary-light">
                      {pa.attribute?.name || '—'}
                    </span>
                    {pa.attribute?.type && (
                      <Badge variant="outline" size="sm">{pa.attribute.type}</Badge>
                    )}
                    <span className="text-sm font-bold text-primary ml-auto">
                      {pa.value}
                    </span>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-secondary-dark dark:text-secondary-light">
                      <Layers size={12} />
                      <span>Category:</span>
                      <Badge variant="secondary" size="sm">
                        {pa.category?.name || '—'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary-dark dark:text-secondary-light">
                      <span>Sub:</span>
                      <Badge variant="outline" size="sm">
                        {pa.subcategory?.name || '—'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary-dark dark:text-secondary-light">
                      <Clock size={12} />
                      {formatDate(pa.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary-dark dark:text-secondary-light">
                      <span className={`font-medium ${pa.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pa.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-light dark:border-border-dark">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(pa)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setToggleTarget(pa)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        pa.isActive
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                          : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      }`}
                    >
                      <Power size={13} />
                      {pa.isActive ? 'Deactivate' : 'Activate'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteTarget(pa)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ── Premium Pagination ── */}
          {totalPages > 1 && (
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1"
            >
              <p className="text-xs text-secondary-dark dark:text-secondary-light">
                Page {currentPage} of {totalPages} &middot; {total} mapping{total !== 1 ? 's' : ''}
              </p>

              <div className="flex items-center gap-1">
                {/* Previous */}
                <motion.button
                  whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                  whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 dark:bg-primary-dark/60 text-secondary-dark dark:text-secondary-light hover:bg-primary/10 hover:text-primary"
                >
                  Prev
                </motion.button>

                {/* Page numbers - desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map(page => (
                    <motion.button
                      key={page}
                      whileHover={page !== currentPage ? { scale: 1.1 } : {}}
                      whileTap={page !== currentPage ? { scale: 0.95 } : {}}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-secondary-dark dark:text-secondary-light hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>

                {/* Page numbers - mobile (simplified) */}
                <div className="sm:hidden flex items-center gap-1">
                  {currentPage > 1 && (
                    <motion.button
                      key={currentPage - 1}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="min-w-[32px] h-8 rounded-lg text-xs font-medium text-secondary-dark dark:text-secondary-light hover:bg-primary/10 hover:text-primary"
                    >
                      {currentPage - 1}
                    </motion.button>
                  )}
                  <span className="min-w-[32px] h-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm text-xs font-medium">
                    {currentPage}
                  </span>
                  {currentPage < totalPages && (
                    <motion.button
                      key={currentPage + 1}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="min-w-[32px] h-8 rounded-lg text-xs font-medium text-secondary-dark dark:text-secondary-light hover:bg-primary/10 hover:text-primary"
                    >
                      {currentPage + 1}
                    </motion.button>
                  )}
                </div>

                {/* Next */}
                <motion.button
                  whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                  whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 dark:bg-primary-dark/60 text-secondary-dark dark:text-secondary-light hover:bg-primary/10 hover:text-primary"
                >
                  Next
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              {editingId ? <Pencil size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
            </div>
            <span>{editingId ? 'Edit Product Attribute' : 'Create Product Attribute'}</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formErrors.general && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {formErrors.general}
            </div>
          )}

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT COLUMN */}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1.5">
                Category <span className="text-danger">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChangeInForm(e.target.value)}
                className="select"
              >
                <option value="">Select Category</option>
                {allCategories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1.5">
                Subcategory
              </label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
                className="select"
                disabled={!form.category}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1.5">
                Product <span className="text-danger">*</span>
              </label>
              <select
                value={form.product}
                onChange={(e) => setForm(prev => ({ ...prev, product: e.target.value }))}
                className={`select ${formErrors.product ? 'border-danger focus:ring-danger' : ''}`}
                disabled={!form.category}
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {formErrors.product && <p className="text-xs text-danger mt-1">{formErrors.product}</p>}
            </div>

            {/* Attribute */}
            <div>
              <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1.5">
                Attribute <span className="text-danger">*</span>
              </label>
              <select
                value={form.attribute}
                onChange={(e) => setForm(prev => ({ ...prev, attribute: e.target.value }))}
                className={`select ${formErrors.attribute ? 'border-danger focus:ring-danger' : ''}`}
                disabled={!form.category}
              >
                <option value="">Select Attribute</option>
                {attributes.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.name}{a.type ? ` (${a.type})` : ''}
                  </option>
                ))}
              </select>
              {formErrors.attribute && <p className="text-xs text-danger mt-1">{formErrors.attribute}</p>}
            </div>
          </div>

          {/* Value (full width) */}
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1.5">
              Value <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.value}
              onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
              className={`input ${formErrors.value ? 'border-danger focus:ring-danger' : ''}`}
              placeholder="e.g. 4GB, Red, Large, Cotton"
            />
            {formErrors.value && <p className="text-xs text-danger mt-1">{formErrors.value}</p>}
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {form.isActive ? (
                  <Eye size={10} className="text-emerald-500" />
                ) : (
                  <EyeOff size={10} className="text-gray-400" />
                )}
              </span>
            </button>
            <span className="text-sm font-medium text-primary-dark dark:text-primary-light">
              {form.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </span>
              ) : editingId ? 'Update Mapping' : 'Create Mapping'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product Attribute"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to delete this product attribute mapping?</p>
            <div className="bg-gray-50 dark:bg-primary-dark/40 rounded-lg p-3 text-sm space-y-1">
              <p><strong className="text-primary-dark dark:text-primary-light">Product:</strong> {deleteTarget?.product?.name || '—'}</p>
              <p><strong className="text-primary-dark dark:text-primary-light">Attribute:</strong> {deleteTarget?.attribute?.name || '—'}</p>
              <p><strong className="text-primary-dark dark:text-primary-light">Value:</strong> {deleteTarget?.value || '—'}</p>
            </div>
            <p className="text-xs text-secondary-dark dark:text-secondary-light">This action cannot be undone. Product attribute mappings may need to be reassigned.</p>
          </div>
        }
        confirmText="Delete"
        type="danger"
      />

      {/* ── Toggle Status Confirmation ── */}
      <ConfirmationDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? 'Deactivate Mapping' : 'Activate Mapping'}
        message={
          <div className="space-y-2">
            <p>Are you sure you want to {toggleTarget?.isActive ? 'deactivate' : 'activate'} this product attribute mapping?</p>
            <div className="bg-gray-50 dark:bg-primary-dark/40 rounded-lg p-3 text-sm space-y-1">
              <p><strong className="text-primary-dark dark:text-primary-light">Product:</strong> {toggleTarget?.product?.name || '—'}</p>
              <p><strong className="text-primary-dark dark:text-primary-light">Attribute:</strong> {toggleTarget?.attribute?.name || '—'}</p>
              <p><strong className="text-primary-dark dark:text-primary-light">Value:</strong> {toggleTarget?.value || '—'}</p>
              <p><strong className="text-primary-dark dark:text-primary-light">Current Status:</strong>{' '}
                <span className={toggleTarget?.isActive ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                  {toggleTarget?.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        type={toggleTarget?.isActive ? 'danger' : 'success'}
        isLoading={isToggling}
      />
    </div>
  )
}

export default ProductAttributesPage