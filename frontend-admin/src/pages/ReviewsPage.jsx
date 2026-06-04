import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trash2, MessageSquare, Loader2, Search, Filter, Eye, Send, StarOff } from 'lucide-react'
import api from '../services/api.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FilterDropdown from '../components/ui/FilterDropdown.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatusToggle from '../components/ui/StatusToggle.jsx'
import ConfirmationDialog from '../components/ui/ConfirmationDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import Modal from '../components/ui/Modal.jsx'

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [viewReview, setViewReview] = useState(null)

  const loadReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (ratingFilter) params.append('rating', ratingFilter)
      const { data } = await api.get(`/admin/reviews?${params.toString()}`)
      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, ratingFilter])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/reviews/${deleteTarget._id}`)
      setDeleteTarget(null)
      loadReviews()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleStatus = async (review) => {
    try {
      await api.patch(`/admin/reviews/${review._id}/status`)
      loadReviews()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return
    setIsReplying(true)
    try {
      await api.post(`/admin/reviews/${replyTarget._id}/reply`, { reply: replyText.trim() })
      setReplyTarget(null)
      setReplyText('')
      loadReviews()
    } catch (err) {
      console.error(err)
    } finally {
      setIsReplying(false)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews"
        subtitle={`Manage customer reviews and feedback (${total} reviews)`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Reviews' },
        ]}
      />

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search reviews..." className="flex-1" />
          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown
              label="Status"
              options={[
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterDropdown
              label="Rating"
              options={[
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' },
              ]}
              value={ratingFilter}
              onChange={setRatingFilter}
            />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="table-container">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={StarOff}
            title="No reviews found"
            description="No customer reviews match your current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comment</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                <AnimatePresence>
                  {reviews.map((review, index) => (
                    <motion.tr
                      key={review._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="table-row"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold truncate max-w-[150px]">{review.product?.name || 'Unknown'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{review.user?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500 truncate">{review.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm truncate max-w-[200px]">{review.comment || 'No comment'}</p>
                        {review.adminReply && (
                          <div className="mt-1 p-2 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-xs text-primary font-medium">Admin Reply:</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{review.adminReply}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusToggle
                          active={review.isActive}
                          onToggle={() => handleToggleStatus(review)}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewReview(review)}
                            className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReplyTarget(review); setReplyText(review.adminReply || '') }}
                            className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-info transition-colors"
                            title="Reply"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(review)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-danger transition-colors"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border text-sm disabled:opacity-50 hover:bg-light-hover dark:hover:bg-dark-hover">Previous</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border text-sm disabled:opacity-50 hover:bg-light-hover dark:hover:bg-dark-hover">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        type="danger"
        confirmText="Delete"
      />

      {/* View Review Modal */}
      <Modal isOpen={!!viewReview} onClose={() => setViewReview(null)} title="Review Details" size="md">
        {viewReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {viewReview.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold">{viewReview.user?.name || 'Anonymous'}</p>
                <p className="text-sm text-gray-500">{viewReview.user?.email || ''}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Product</p>
              <p className="font-medium">{viewReview.product?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Rating</p>
              <div className="flex items-center gap-1">{renderStars(viewReview.rating)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Comment</p>
              <p className="text-sm bg-light dark:bg-dark p-3 rounded-lg">{viewReview.comment || 'No comment'}</p>
            </div>
            {viewReview.adminReply && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Admin Reply</p>
                <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">{viewReview.adminReply}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
              <Badge variant={viewReview.isActive ? 'success' : 'danger'}>{viewReview.isActive ? 'Approved' : 'Hidden'}</Badge>
              <p className="text-xs text-gray-500">{new Date(viewReview.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal isOpen={!!replyTarget} onClose={() => { setReplyTarget(null); setReplyText('') }} title="Reply to Review" size="md">
        {replyTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">{renderStars(replyTarget.rating)}</div>
              <span className="text-sm text-gray-500">by {replyTarget.user?.name || 'Anonymous'}</span>
            </div>
            <p className="text-sm bg-light dark:bg-dark p-3 rounded-lg">{replyTarget.comment}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="input resize-none"
                placeholder="Write your reply to this review..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border">
              <button onClick={() => { setReplyTarget(null); setReplyText('') }} className="btn-secondary">Cancel</button>
              <button onClick={handleReply} disabled={isReplying || !replyText.trim()} className="btn-primary flex items-center gap-2">
                {isReplying && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reply
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReviewsPage