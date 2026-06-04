import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Users, UserCheck, UserX, UserPlus, Mail, Phone, Shield, ShoppingBag, IndianRupee
} from 'lucide-react'
import {
  fetchCustomers, fetchCustomer, deleteCustomer, toggleCustomerStatus, clearCustomerMessages
} from '../redux/slices/customerSlice.js'
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
  { value: 'blocked', label: 'Blocked' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'name', label: 'Name A→Z' },
  { value: '-name', label: 'Name Z→A' },
]

const roleBadgeConfig = {
  user: { variant: 'default', label: 'User' },
  admin: { variant: 'info', label: 'Admin' },
  superadmin: { variant: 'warning', label: 'Super Admin' },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CustomersPage = () => {
  const dispatch = useDispatch()
  const { customers, currentCustomer, stats, totalPages, currentPage, total, isLoading, error, success } = useSelector(state => state.customers)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)

  const [deleteId, setDeleteId] = useState(null)
  const [toggleId, setToggleId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailId, setDetailId] = useState(null)

  useEffect(() => {
    if (error || success) dispatch(clearCustomerMessages())
  }, [error, success, dispatch])

  useEffect(() => {
    dispatch(fetchCustomers({ page, search, status: statusFilter, role: roleFilter, sort }))
  }, [page, search, statusFilter, roleFilter, sort, dispatch])

  const openDetail = async (id) => {
    setDetailId(id)
    await dispatch(fetchCustomer(id))
    setShowDetailModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await dispatch(deleteCustomer(deleteId))
    setShowDeleteDialog(false)
    setDeleteId(null)
  }

  const handleToggleStatus = async () => {
    if (!toggleId) return
    await dispatch(toggleCustomerStatus(toggleId))
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
        title="Customers"
        subtitle="Manage customer accounts and activity"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Customers' }]}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers || 0}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Active"
            value={stats.activeCustomers || 0}
            icon={UserCheck}
            color="success"
          />
          <StatCard
            title="Blocked"
            value={stats.blockedCustomers || 0}
            icon={UserX}
            color="danger"
          />
          <StatCard
            title="New This Month"
            value={stats.newCustomersThisMonth || 0}
            icon={UserPlus}
            color="info"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1) }} placeholder="Search customers..." />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
        />
        <FilterDropdown
          label="Role"
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(val) => { setRoleFilter(val); setPage(1) }}
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {isLoading ? (
                <TableRowSkeleton rows={5} cols={8} />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Users}
                      title="No customers found"
                      description="No customer accounts match your current filters"
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {customers.map((customer, index) => {
                    const roleConfig = roleBadgeConfig[customer.role] || roleBadgeConfig.user

                    return (
                      <motion.tr
                        key={customer._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {customer.avatar ? (
                              <img
                                src={getImageUrl(customer.avatar)}
                                alt={customer.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-dark-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{customer.name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={roleConfig.variant} size="sm">
                            <Shield className="w-3 h-3 mr-1" />
                            {roleConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">{customer.orderCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
                            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.totalSpent || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(customer.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={customer.isActive ? 'success' : 'danger'}
                              size="sm"
                              dot
                            >
                              {customer.isActive ? 'Active' : 'Blocked'}
                            </Badge>
                            <button
                              onClick={() => { setToggleId(customer._id); setShowToggleDialog(true) }}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                              title={customer.isActive ? 'Block' : 'Unblock'}
                            >
                              {customer.isActive ? (
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
                              onClick={() => openDetail(customer._id)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 hover:text-primary transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeleteId(customer._id); setShowDeleteDialog(true) }}
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
              Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)} of {total} customers
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

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); dispatch(clearCustomerMessages()) }}
        title="Customer Details"
        size="lg"
      >
        {currentCustomer ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
              {currentCustomer.avatar ? (
                <img src={getImageUrl(currentCustomer.avatar)} alt={currentCustomer.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">{currentCustomer.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentCustomer.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentCustomer.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={roleBadgeConfig[currentCustomer.role]?.variant || 'default'} size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleBadgeConfig[currentCustomer.role]?.label || 'User'}
                  </Badge>
                  <Badge variant={currentCustomer.isActive ? 'success' : 'danger'} size="sm" dot>
                    {currentCustomer.isActive ? 'Active' : 'Blocked'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCustomer.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(currentCustomer.createdAt)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentCustomer.orderCount || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">₹{currentCustomer.totalSpent || 0}</p>
              </div>
            </div>

            {/* Recent Orders */}
            {currentCustomer.recentOrders && currentCustomer.recentOrders.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Orders</h4>
                <div className="space-y-2">
                  {currentCustomer.recentOrders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">#{order._id?.slice(-6)?.toUpperCase()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{order.total || 0}</span>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'danger' :
                            order.status === 'shipped' ? 'info' :
                            order.status === 'pending' ? 'warning' : 'default'
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer account? This action cannot be undone and all associated data will be permanently removed."
        type="danger"
      />

      {/* Toggle Status Confirmation */}
      <ConfirmationDialog
        isOpen={showToggleDialog}
        onClose={() => { setShowToggleDialog(false); setToggleId(null) }}
        onConfirm={handleToggleStatus}
        title="Toggle Customer Status"
        message="Are you sure you want to change this customer's status? Blocking will prevent them from accessing the platform."
        type="warning"
      />
    </motion.div>
  )
}

export default CustomersPage