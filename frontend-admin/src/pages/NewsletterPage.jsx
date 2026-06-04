import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mail, Users, UserCheck, BarChart3, Clock, FileText, Bold, Italic, Link, List, Image, AlertCircle, CheckCircle, Eye
} from 'lucide-react'
import {
  sendNewsletter, fetchNewsletterStats, clearNewsletterMessages
} from '../redux/slices/newsletterSlice.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Toast from '../components/ui/Toast.jsx'

const SUBJECT_MAX = 200
const CONTENT_MAX = 5000

const NewsletterPage = () => {
  const dispatch = useDispatch()
  const { stats, isSending, isLoadingStats, error, success } = useSelector(state => state.newsletter)

  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sendToAll, setSendToAll] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    dispatch(fetchNewsletterStats())
  }, [dispatch])

  useEffect(() => {
    if (error || success) {
      if (success) setToast({ type: 'success', message: success })
      if (error) setToast({ type: 'error', message: error })
      dispatch(clearNewsletterMessages())
    }
  }, [error, success, dispatch])

  const validate = () => {
    if (!subject.trim()) return 'Subject is required'
    if (subject.length > SUBJECT_MAX) return `Subject must be under ${SUBJECT_MAX} characters`
    if (!content.trim()) return 'Content is required'
    if (content.length > CONTENT_MAX) return `Content must be under ${CONTENT_MAX} characters`
    return null
  }

  const handleSend = async () => {
    const validationError = validate()
    if (validationError) {
      setToast({ type: 'error', message: validationError })
      return
    }
    const result = await dispatch(sendNewsletter({ subject, content, sendToAll }))
    if (result.meta.requestStatus === 'fulfilled') {
      setSubject('')
      setContent('')
      setSendToAll(true)
      dispatch(fetchNewsletterStats())
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Newsletter"
        subtitle="Send newsletters to your subscribers"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Newsletter' }]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Sent"
          value={stats.totalSent || 0}
          icon={Send}
          color="primary"
        />
        <StatCard
          title="Total Subscribers"
          value={stats.totalSubscribers || 0}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Last Sent"
          value={formatDate(stats.lastSentAt)}
          icon={Clock}
          color="info"
          isDate
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Newsletter Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Compose Newsletter</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-hover text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Subject */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter newsletter subject..."
                  maxLength={SUBJECT_MAX}
                  className="input pl-10"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{subject.length}/{SUBJECT_MAX} characters</p>
            </div>

            {/* Content */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Content <span className="text-red-500">*</span>
              </label>

              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-dark-hover rounded-t-xl border border-b-0 border-gray-200 dark:border-dark-border">
                <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors" title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors" title="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors" title="Link">
                  <Link className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors" title="List">
                  <List className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors" title="Image">
                  <Image className="w-4 h-4" />
                </button>
                <div className="ml-auto">
                  <span className="text-xs text-gray-400">{content.length}/{CONTENT_MAX}</span>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your newsletter content here..."
                maxLength={CONTENT_MAX}
                rows={12}
                className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-b-xl outline-none text-sm text-gray-900 dark:text-white resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>

            {/* Send Options */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send To</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSendToAll(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    sendToAll
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-hover'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Subscribers
                </button>
                <button
                  onClick={() => setSendToAll(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    !sendToAll
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-hover'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Active Only
                </button>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                {subject && content ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ready to send
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Fill in subject and content
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={isSending || !subject.trim() || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/25"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Newsletter
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Stats & Preview */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Delivery Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Sent</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalSent || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subscribers</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.totalSubscribers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Sent</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(stats.lastSentAt)}</span>
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6"
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Newsletter Preview</h3>
                <div className="bg-gray-50 dark:bg-dark-hover rounded-xl p-4 space-y-3">
                  {subject ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Subject</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{subject}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No subject yet</p>
                  )}
                  <div className="border-t border-gray-200 dark:border-dark-border pt-3">
                    {content ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Content</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-8">{content}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No content yet</p>
                    )}
                  </div>
                  <div className="border-t border-gray-200 dark:border-dark-border pt-3">
                    <p className="text-xs text-gray-400 mb-1">Recipients</p>
                    <Badge variant={sendToAll ? 'info' : 'success'} size="sm">
                      {sendToAll ? 'All Subscribers' : 'Active Subscribers Only'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-2xl border border-primary/20 dark:border-primary/30 p-6"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                Keep subject lines concise and compelling
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                Use clear formatting for better readability
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                Preview before sending to check for errors
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                Send to active subscribers for better engagement
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

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

export default NewsletterPage