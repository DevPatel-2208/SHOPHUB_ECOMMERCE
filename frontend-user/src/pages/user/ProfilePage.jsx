import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { updateUser } from '../../redux/slices/authSlice.js'

// ─── Lucide Icons ──────────────────────────────────────────────
import {
  User, Mail, Phone, Camera, Loader2, CheckCircle, Calendar,
  MapPin, Globe, Package, ShoppingCart, Heart, Map, CreditCard,
  TrendingUp, Award, Edit3, Save, AlertTriangle, Trash2,
  BadgeCheck, ChevronDown, Users, BarChart3, AtSign
} from 'lucide-react'

// ─── Validation Schemas ───────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore').optional().or(z.literal('')),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
  gender: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
})

// ─── Framer Motion Variants ──────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
}
const fadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 14 } },
}
const slideLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
}
const statCardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, type: 'spring', stiffness: 100, damping: 12 } }),
}

// ─── Stat Card Component ─────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
  <motion.div
    custom={delay}
    variants={statCardVariant}
    initial="hidden"
    animate="visible"
    whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 15 } }}
    className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 ${gradient} shadow-lg group cursor-pointer`}
  >
    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 bg-white/15 backdrop-blur-sm rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Live</span>
      </div>
      <motion.p
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-2xl font-bold text-white mb-0.5 tabular-nums"
      >
        {value}
      </motion.p>
          <p className="text-xs sm:text-sm text-white/70 font-medium">{label}</p>
    </div>
  </motion.div>
)

// ─── Profile Completion Ring ──────────────────────────────────
const ProfileCompletion = ({ percent }) => {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-100 dark:border-gray-700/50">
      <div className="relative flex-shrink-0">
        <svg width="80" height="80" className="transform -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6"
            className="text-gray-200 dark:text-gray-700" />
          <motion.circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="text-primary" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-primary">{percent}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">Profile Completion</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {percent < 50 ? 'Add more details to complete your profile' :
           percent < 80 ? 'Almost there! Just a few more details' :
           'Your profile is looking great!'}
        </p>
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

const toDateInputValue = (date) => {
  if (!date) return ''
  return String(date).split('T')[0]
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PROFILE PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [avatarHover, setAvatarHover] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')

  // ── Fetch profile data (with fallback) ─────────────────────
  const fetchProfileData = useCallback(async () => {
    try {
      setIsFetching(true)
      const res = await api.get('/users/dashboard')
      setProfileData(res.data.user || null)
      setStats(res.data.stats || null)
    } catch (err) {
      try {
        const fallback = await api.get('/users/profile')
        setProfileData(fallback.data.user || null)
        setStats(fallback.data.stats || null)
      } catch {
        const userFromRedux = user
        if (userFromRedux) {
          setProfileData(userFromRedux)
          setStats({ totalOrders: 0, completedOrders: 0, cartItems: 0, wishlistItems: 0, savedAddresses: 0, totalSpending: '0.00' })
        }
      }
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  // Update Redux state when profileData changes
  useEffect(() => {
    if (profileData) {
      dispatch(updateUser(profileData))
    }
  }, [profileData, dispatch])

  const currentUser = profileData || user

  // Reset avatar error when avatar URL changes
  useEffect(() => {
    setAvatarError(false)
  }, [currentUser?.avatar])

  // ── Profile Form ────────────────────────────────────────────
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty },
    reset: resetProfile,
    watch: watchProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      gender: currentUser?.gender || 'prefer-not-to-say',
      dob: toDateInputValue(currentUser?.dob),
      address: currentUser?.address || '',
      city: currentUser?.city || '',
      state: currentUser?.state || '',
      country: currentUser?.country || 'India',
      pincode: currentUser?.pincode || '',
    },
  })

  // Update form when profileData loads
  useEffect(() => {
    if (profileData) {
      resetProfile({
        name: profileData.name || '',
        username: profileData.username || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        gender: profileData.gender || 'prefer-not-to-say',
        dob: toDateInputValue(profileData.dob),
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || 'India',
        pincode: profileData.pincode || '',
      })
    }
  }, [profileData, resetProfile])

  const onUpdateProfile = async (data) => {
    setIsLoading(true)
    try {
      const res = await api.put('/users/profile', data)
      setProfileData(res.data.user)
      dispatch(updateUser(res.data.user))
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Avatar Upload ───────────────────────────────────────────
  const handleAvatarUpload = async (file) => {
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post('/users/upload-avatar', formData)
      setProfileData(res.data.user)
      dispatch(updateUser(res.data.user))
      setAvatarError(false)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      setAvatarPreview(null)
    }
  }

  const handleAvatarRemove = async () => {
    try {
      const res = await api.delete('/users/avatar')
      setProfileData(res.data.user)
      dispatch(updateUser(res.data.user))
      setAvatarError(false)
      toast.success('Avatar removed')
    } catch (err) {
      toast.error('Failed to remove avatar')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
      handleAvatarUpload(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  // ── Utility ──────────────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  const formatDateShort = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  // ── Loading / Error States ──────────────────────────────────
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  const profileCompletion = Number(currentUser.profileCompletion || 0)

  // ─── Tabs ────────────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ]

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ── Background Decorations ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
      >
        {/* ═══════════════════════════════════════════════════════
           HEADER / HERO SECTION
           ═══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary/80 dark:from-primary/90 dark:via-primary/80 dark:to-secondary/70 shadow-2xl shadow-primary/25">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl animate-float" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-delayed" />
              <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
            </div>

            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="relative"
                    onHoverStart={() => setAvatarHover(true)}
                    onHoverEnd={() => setAvatarHover(false)}
                  >
                    {/* Animated gradient ring */}
                    <motion.div
                      animate={{ rotate: avatarHover ? 180 : 0 }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                      className="absolute -inset-1 bg-gradient-to-br from-white/40 via-white/20 to-white/40 rounded-full blur-sm"
                    />
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
                      {currentUser?.avatar && !avatarError ? (
                        <img
                          src={getImageUrl(currentUser.avatar)}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                          <span className="text-4xl sm:text-5xl font-bold text-white">
                            {currentUser?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Upload overlay */}
                      <AnimatePresence>
                        {avatarHover && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="w-8 h-8 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Online indicator */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full z-20"
                    >
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
                    </motion.div>
                  </motion.div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setAvatarPreview(URL.createObjectURL(file))
                        handleAvatarUpload(file)
                      }
                    }}
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <motion.div variants={slideLeft}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        {currentUser?.name}
                      </h1>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white capitalize">
                          {currentUser?.role}
                        </span>
                        {currentUser?.isVerified && (
                          <BadgeCheck className="w-5 h-5 text-emerald-300" fill="currentColor" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start gap-x-6 gap-y-1 mt-2 text-white/80">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        {currentUser?.email}
                      </span>
                      {currentUser?.phone && (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Phone className="w-3.5 h-3.5" />
                          {currentUser.phone}
                          {currentUser?.isPhoneVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {formatDate(currentUser?.createdAt)}
                      </span>
                    </div>
                  </motion.div>

                  {/* Quick actions */}
                  <motion.div
                    variants={fadeUp}
                    className="flex flex-wrap items-center gap-2 mt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                    </motion.button>

                    {currentUser?.avatar && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAvatarRemove}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white/80 text-sm font-medium transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('profile')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-white/90 text-sm font-medium transition-all"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
           PROFILE COMPLETION + STATS GRID
           ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div variants={fadeIn} className="lg:col-span-1">
            <ProfileCompletion percent={profileCompletion} />
          </motion.div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {stats && (
              <>
                <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} gradient="bg-gradient-to-br from-violet-600 to-indigo-700" delay={0} />
                <StatCard icon={CheckCircle} label="Completed" value={stats.completedOrders} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" delay={1} />
                <StatCard icon={Heart} label="Wishlist" value={stats.wishlistItems} gradient="bg-gradient-to-br from-rose-500 to-pink-600" delay={2} />
                <StatCard icon={ShoppingCart} label="Cart Items" value={stats.cartItems} gradient="bg-gradient-to-br from-amber-500 to-orange-600" delay={3} />
                <StatCard icon={Map} label="Addresses" value={stats.savedAddresses} gradient="bg-gradient-to-br from-sky-500 to-blue-600" delay={4} />
                <StatCard icon={CreditCard} label="Total Spent" value={`₹${stats.totalSpending}`} gradient="bg-gradient-to-br from-primary to-purple-600" delay={5} />
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
           TABS NAVIGATION
           ═══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex overflow-x-auto gap-1 p-1 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/25"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <tab.icon className="relative z-10 w-4 h-4" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
           TAB CONTENT
           ═══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            >
              {/* Section toggle tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'personal', label: 'Personal Info', icon: User },
                  { id: 'address', label: 'Address Details', icon: MapPin },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeSection === sec.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50'
                    }`}
                  >
                    <sec.icon className="w-4 h-4" />
                    {sec.label}
                  </button>
                ))}
              </div>

              <motion.form
                key={activeSection}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleProfileSubmit(onUpdateProfile)}
                className="bg-white dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Personal Info Fields */}
                  {(activeSection === 'personal' ? [
                    { label: 'Full Name', name: 'name', icon: User, type: 'text', required: true },
                    { label: 'Username', name: 'username', icon: AtSign, type: 'text' },
                    { label: 'Email', name: 'email', icon: Mail, type: 'email', disabled: true },
                    { label: 'Phone', name: 'phone', icon: Phone, type: 'tel', maxLength: 10 },
                    { label: 'Gender', name: 'gender', icon: Users, type: 'select',
                      options: [
                        { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]
                    },
                    { label: 'Date of Birth', name: 'dob', icon: Calendar, type: 'date' },
                  ] : [
                    { label: 'Address', name: 'address', icon: MapPin, type: 'text' },
                    { label: 'City', name: 'city', icon: MapPin, type: 'text' },
                    { label: 'State', name: 'state', icon: MapPin, type: 'text' },
                    { label: 'Country', name: 'country', icon: Globe, type: 'text' },
                    { label: 'Pincode', name: 'pincode', icon: MapPin, type: 'text', maxLength: 6 },
                  ]).map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        {field.type === 'select' ? (
                          <select
                            {...profileRegister(field.name)}
                            className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            {...profileRegister(field.name)}
                            type={field.type}
                            maxLength={field.maxLength}
                            disabled={field.disabled}
                            className={`w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                              field.disabled ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                          />
                        )}
                        <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        {/* Chevron for select */}
                        {field.type === 'select' && (
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        )}
                      </div>
                      {profileErrors[field.name] && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs mt-1 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {profileErrors[field.name].message}
                        </motion.p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Form actions */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                  {isDirty && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={() => resetProfile()}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                    >
                      Cancel
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !isDirty}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.form>
            </motion.div>
          )}



          {/* ─── STATISTICS TAB ─────────────────────────────── */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {stats && [
                { icon: Package, label: 'Total Orders', value: stats.totalOrders, gradient: 'bg-gradient-to-br from-violet-600 to-indigo-700', desc: 'All orders placed' },
                { icon: CheckCircle, label: 'Completed Orders', value: stats.completedOrders, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', desc: 'Successfully delivered' },
                { icon: TrendingUp, label: 'Completion Rate', value: stats.totalOrders > 0 ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%` : '0%', gradient: 'bg-gradient-to-br from-sky-500 to-blue-600', desc: 'Order success rate' },
                { icon: Heart, label: 'Wishlist Items', value: stats.wishlistItems, gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', desc: 'Saved for later' },
                { icon: ShoppingCart, label: 'Cart Items', value: stats.cartItems, gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', desc: 'Currently in cart' },
                { icon: Map, label: 'Saved Addresses', value: stats.savedAddresses, gradient: 'bg-gradient-to-br from-cyan-500 to-teal-600', desc: 'Delivery addresses' },
                { icon: CreditCard, label: 'Total Spending', value: `₹${stats.totalSpending}`, gradient: 'bg-gradient-to-br from-primary to-purple-600', desc: 'Lifetime spending' },
                { icon: Award, label: 'Member Since', value: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'N/A', gradient: 'bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800', desc: 'Loyalty milestone' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, type: 'spring', stiffness: 100, damping: 12 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 15 } }}
                  className={`relative overflow-hidden rounded-2xl p-6 ${stat.gradient} shadow-lg group cursor-pointer`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-white/15 backdrop-blur-sm rounded-xl">
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">
                        {stat.desc}
                      </span>
                    </div>
                    <motion.p
                      key={stat.value}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl sm:text-3xl font-bold text-white mb-1 tabular-nums"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-sm text-white/70 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom spacing */}
        <div className="h-8" />
      </motion.div>
    </div>
  )
}
export default ProfilePage
