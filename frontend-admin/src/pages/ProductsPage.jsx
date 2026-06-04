import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Eye, Image, Loader2, ArrowUpDown, Package,
  Filter, X, Search, ChevronLeft, ChevronRight, IndianRupee
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts, deleteProduct, toggleProductStatus } from '../redux/slices/productSlice.js'
import { fetchAllCategories } from '../redux/slices/categorySlice.js'
import { fetchBrands } from '../redux/slices/brandSlice.js'
import { getImageUrl } from '../utils/imageUrl.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterDropdown from '../components/ui/FilterDropdown.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatusToggle from '../components/ui/StatusToggle.jsx'
import ConfirmationDialog from '../components/ui/ConfirmationDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TableSkeleton, TableRowSkeleton } from '../components/ui/Skeleton.jsx'
import Modal from '../components/ui/Modal.jsx'
import api from '../services/api.js'

const ProductsPage = () => {
  const dispatch = useDispatch()
  const { products, totalPages, currentPage, total, isLoading } = useSelector((state) => state.products)
  const { allCategories } = useSelector((state) => state.categories)
  const { brands } = useSelector((state) => state.brands)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('-createdAt')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Quick edit modal
  const [editProduct, setEditProduct] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', price: '', stock: '', isActive: true })
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  const loadProducts = useCallback(() => {
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'
    dispatch(fetchProducts({
      page,
      search,
      sort: sortField,
      order: sortOrder,
      category: categoryFilter,
      brand: brandFilter,
      isActive: statusFilter,
    }))
  }, [dispatch, page, search, sort, categoryFilter, brandFilter, statusFilter])

  useEffect(() => {
    dispatch(fetchAllCategories())
    dispatch(fetchBrands({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleSort = (field) => {
    setSort(prev => prev === field ? `-${field}` : field)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await dispatch(deleteProduct(deleteTarget._id))
    setDeleteTarget(null)
    loadProducts()
  }

  const handleToggleStatus = async (product) => {
    await dispatch(toggleProductStatus(product._id))
    loadProducts()
  }

  const openEditModal = (product) => {
    setEditProduct(product)
    setEditForm({
      name: product.name,
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      isActive: product.isActive ?? true,
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setIsEditSubmitting(true)
    try {
      await api.put(`/admin/products/${editProduct._id}`, {
        name: editForm.name,
        price: editForm.price,
        stock: editForm.stock,
        isActive: editForm.isActive,
      })
      setEditProduct(null)
      loadProducts()
    } catch (err) {
      console.error(err)
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: '-name', label: 'Name Z-A' },
    { value: 'price', label: 'Price Low-High' },
    { value: '-price', label: 'Price High-Low' },
    { value: '-stock', label: 'Stock High-Low' },
    { value: 'stock', label: 'Stock Low-High' },
  ]

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...allCategories.map(c => ({ value: c._id, label: c.name })),
  ]

  const brandOptions = [
    { value: '', label: 'All Brands' },
    ...brands.map(b => ({ value: b._id, label: b.name })),
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ]

  const hasActiveFilters = categoryFilter || brandFilter || statusFilter || search

  const clearAllFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setBrandFilter('')
    setStatusFilter('')
    setSort('-createdAt')
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
        title="All Products"
        subtitle={`Manage your product catalog (${total} products)`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Products' },
        ]}
        action={
          <Link to="/products/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        }
      />

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle button (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          {/* Desktop filters */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(val) => { setCategoryFilter(val); setPage(1) }}
            />
            <FilterDropdown
              label="Brand"
              options={brandOptions}
              value={brandFilter}
              onChange={(val) => { setBrandFilter(val); setPage(1) }}
            />
            <FilterDropdown
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1) }}
            />
            <FilterDropdown
              label="Sort By"
              options={sortOptions}
              value={sort}
              onChange={(val) => { setSort(val); setPage(1) }}
            />
          </div>
        </div>

        {/* Mobile filters dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden mt-4 pt-4 border-t border-gray-100 dark:border-dark-border grid grid-cols-2 gap-3"
            >
              <FilterDropdown
                label="Category"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val); setPage(1) }}
              />
              <FilterDropdown
                label="Brand"
                options={brandOptions}
                value={brandFilter}
                onChange={(val) => { setBrandFilter(val); setPage(1) }}
              />
              <FilterDropdown
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1) }}
              />
              <FilterDropdown
                label="Sort By"
                options={sortOptions}
                value={sort}
                onChange={(val) => { setSort(val); setPage(1) }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
            {categoryFilter && (
              <button
                onClick={() => { setCategoryFilter(''); setPage(1) }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Category: {allCategories.find(c => c._id === categoryFilter)?.name || categoryFilter} ×
              </button>
            )}
            {brandFilter && (
              <button
                onClick={() => { setBrandFilter(''); setPage(1) }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Brand: {brands.find(b => b._id === brandFilter)?.name || brandFilter} ×
              </button>
            )}
            {statusFilter && (
              <button
                onClick={() => { setStatusFilter(''); setPage(1) }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Status: {statusFilter === 'true' ? 'Active' : 'Inactive'} ×
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-medium hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Products Display */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'Start adding products to your catalog.'}
          actionLabel="Add Product"
          actionPath="/products/new"
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="hidden max-sm:block space-y-3">
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Product Image */}
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-dark-hover overflow-hidden border border-gray-200 dark:border-dark-border flex-shrink-0">
                      {product.images?.[0] ? (
                        <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku || 'No SKU'}</p>
                        </div>
                        <StatusToggle
                          active={product.isActive}
                          onToggle={() => handleToggleStatus(product)}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {product.price?.toLocaleString('en-IN')}
                        </div>
                        <Badge
                          variant={product.stock <= (product.lowStockThreshold || 5) ? 'danger' : 'success'}
                          size="sm"
                        >
                          {product.stock} units
                        </Badge>
                        {product.isFeatured && (
                          <Badge variant="primary" size="sm">Featured</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{product.category?.name || '-'}</span>
                        {product.brand?.name && <span>• {product.brand?.name}</span>}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <Link
                      to={`/products/edit/${product._id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View/Edit
                    </Link>
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Quick Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-hover">
                  <tr>
                    <th
                      className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary"
                      onClick={() => handleSort('name')}
                    >
                      <span className="flex items-center gap-1">Product <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th
                      className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary"
                      onClick={() => handleSort('price')}
                    >
                      <span className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                    <th
                      className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary"
                      onClick={() => handleSort('stock')}
                    >
                      <span className="flex items-center gap-1">Stock <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Featured</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-hover overflow-hidden border border-gray-200 dark:border-dark-border">
                              {product.images?.[0] ? (
                                <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              <IndianRupee className="w-3.5 h-3.5 inline" />
                              {product.price?.toLocaleString('en-IN')}
                            </p>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                ₹{product.comparePrice?.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {product.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {product.brand?.name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={product.stock <= (product.lowStockThreshold || 5) ? 'danger' : product.stock === 0 ? 'danger' : 'success'}
                            size="sm"
                          >
                            {product.stock} units
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <StatusToggle
                            active={product.isActive}
                            onToggle={() => handleToggleStatus(product)}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {product.isFeatured ? (
                            <Badge variant="primary" size="sm">Featured</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/products/edit/${product._id}`}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                              title="View/Edit"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition-colors"
                              title="Quick Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(product)}
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
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-dark-border">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing page {currentPage} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        pageNum === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="hidden max-sm:flex items-center justify-between bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
      />

      {/* Quick Edit Modal */}
      <Modal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="Quick Edit Product"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
              <input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
              <input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                min="0"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusToggle
              active={editForm.isActive}
              onToggle={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {editForm.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
            <button
              type="button"
              onClick={() => setEditProduct(null)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isEditSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}

export default ProductsPage
