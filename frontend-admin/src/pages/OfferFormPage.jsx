import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus, Upload, X, Check, ChevronRight, ChevronLeft, Tag, Percent, DollarSign,
  Calendar, Target, Shield, Image as ImageIcon, Loader2, Trash2
} from 'lucide-react'
import { createOffer, updateOffer, fetchOffer } from '../redux/slices/offerSlice.js'
import { fetchAllCategories } from '../redux/slices/categorySlice.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import api from '../services/api.js'
import { getImageUrl } from '../utils/imageUrl.js'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: <Tag size={18} /> },
  { id: 2, title: 'Discount', icon: <Percent size={18} /> },
  { id: 3, title: 'Apply On', icon: <Target size={18} /> },
  { id: 4, title: 'Validity & Limits', icon: <Shield size={18} /> },
  { id: 5, title: 'Banner & Review', icon: <ImageIcon size={18} /> },
]

const UPLOAD_PRESETS = {
  banners: { label: 'Banner', accept: 'image/*', aspectRatio: '2.35:1', hint: 'Recommended: 1200×500px, max 5MB' },
  images: { label: 'Images', accept: 'image/*', hint: 'PNG, JPG, WebP, max 5MB each' },
}

const INITIAL_FORM = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  maxDiscount: null,
  minOrderAmount: 0,
  priority: 0,
  applyOn: 'all',
  applicableItems: [],
  excludeCategories: [],
  excludeBrands: [],
  excludeProducts: [],
  startDate: '',
  endDate: '',
  isActive: true,
  maxUsage: null,
  maxUsagePerUser: 1,
}

const OfferFormPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const { allCategories } = useSelector(state => state.categories)

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Banner image
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Dynamic dropdowns
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])

  // Fetch existing offer for editing
  useEffect(() => {
    if (isEditing) {
      dispatch(fetchOffer(id)).then(({ payload }) => {
        if (payload?.offer) {
          const o = payload.offer
          setForm({
            title: o.title || '',
            description: o.description || '',
            discountType: o.discountType || 'percentage',
            discountValue: o.discountValue || 0,
            maxDiscount: o.maxDiscount || null,
            minOrderAmount: o.minOrderAmount || 0,
            priority: o.priority || 0,
            applyOn: o.applyOn || 'all',
            applicableItems: o.applicableItems?.map(i => i._id || i) || [],
            excludeCategories: o.excludeCategories?.map(i => i._id || i) || [],
            excludeBrands: o.excludeBrands?.map(i => i._id || i) || [],
            excludeProducts: o.excludeProducts?.map(i => i._id || i) || [],
            startDate: o.startDate ? new Date(o.startDate).toISOString().slice(0, 16) : '',
            endDate: o.endDate ? new Date(o.endDate).toISOString().slice(0, 16) : '',
            isActive: o.isActive ?? true,
            maxUsage: o.maxUsage || null,
            maxUsagePerUser: o.maxUsagePerUser || 1,
          })
          if (o.banner) setBannerPreview(getImageUrl(o.banner))
        }
      })
    }
  }, [id, isEditing, dispatch])

  // Fetch categories, brands, products for dropdowns
  useEffect(() => {
    dispatch(fetchAllCategories())
    api.get('/admin/categories/all').then(({ data }) => setCategories(data.categories || []))
    api.get('/admin/brands', { params: { limit: 100 } }).then(({ data }) => setBrands(data.brands || []))
    api.get('/admin/products', { params: { limit: 100 } }).then(({ data }) => setProducts(data.products || []))
  }, [dispatch])

  // ── Drag & Drop Handlers ──────────────────────────────────
  const validateFile = useCallback((file) => {
    const maxSize = 5 * 1024 * 1024
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return false
    }
    if (file.size > maxSize) {
      toast.error('File must be less than 5MB')
      return false
    }
    return true
  }, [])

  const handleBannerSelect = (e) => {
    const file = e.target.files[0]
    if (file && validateFile(file)) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
      setUploadProgress(0)
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const removeBanner = () => {
    setBannerFile(null)
    setBannerPreview(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validateStep = (step) => {
    const errors = {}
    if (step === 1) {
      if (!form.title.trim()) errors.title = 'Title is required'
    }
    if (step === 2) {
      if (!form.discountValue || form.discountValue <= 0) errors.discountValue = 'Discount value must be positive'
      if (form.discountType === 'percentage' && form.discountValue > 100) errors.discountValue = 'Percentage cannot exceed 100'
    }
    if (step === 4) {
      if (!form.startDate) errors.startDate = 'Start date is required'
      if (!form.endDate) errors.endDate = 'End date is required'
      if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) errors.endDate = 'End date must be after start date'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1))
    }
  }

  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('discountType', form.discountType)
      formData.append('discountValue', form.discountValue)
      if (form.maxDiscount) formData.append('maxDiscount', form.maxDiscount)
      formData.append('minOrderAmount', form.minOrderAmount || 0)
      formData.append('priority', form.priority || 0)
      formData.append('applyOn', form.applyOn)
      form.applicableItems.forEach(id => formData.append('applicableItems', id))
      form.excludeCategories.forEach(id => formData.append('excludeCategories', id))
      form.excludeBrands.forEach(id => formData.append('excludeBrands', id))
      form.excludeProducts.forEach(id => formData.append('excludeProducts', id))
      formData.append('startDate', form.startDate)
      formData.append('endDate', form.endDate)
      formData.append('isActive', form.isActive)
      if (form.maxUsage) formData.append('maxUsage', form.maxUsage)
      formData.append('maxUsagePerUser', form.maxUsagePerUser || 1)
      if (bannerFile) formData.append('banner', bannerFile)

      if (isEditing) {
        await dispatch(updateOffer({ id, formData })).unwrap()
      } else {
        await dispatch(createOffer(formData)).unwrap()
      }
      setUploadProgress(100)
      toast.success(isEditing ? 'Offer updated!' : 'Offer created!')
      setTimeout(() => navigate('/offers'), 300)
    } catch (err) {
      setFormErrors({ general: err || 'Failed to save offer' })
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleItemInArray = (arrayName, itemId) => {
    setForm(prev => {
      const arr = prev[arrayName]
      return {
        ...prev,
        [arrayName]: arr.includes(itemId) ? arr.filter(id => id !== itemId) : [...arr, itemId]
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Offer' : 'Create Offer'}
        subtitle={isEditing ? 'Update offer details' : 'Set up a new promotional offer'}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Offers', path: '/offers' },
          { label: isEditing ? 'Edit' : 'Create' },
        ]}
      />

      {/* Step Indicator */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                currentStep === step.id
                  ? 'text-primary font-semibold'
                  : currentStep > step.id
                    ? 'text-success'
                    : 'text-secondary-dark dark:text-secondary-light'
              }`}
              onClick={() => {
                if (step.id < currentStep) setCurrentStep(step.id)
              }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                currentStep === step.id
                  ? 'bg-primary text-white'
                  : currentStep > step.id
                    ? 'bg-success text-white'
                    : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark'
              }`}>
                {currentStep > step.id ? <Check size={16} /> : step.icon}
              </div>
              <span className="text-sm hidden sm:block">{step.title}</span>
              {step.id < 5 && (
                <ChevronRight size={16} className="text-secondary-dark dark:text-secondary-light hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="card p-6 space-y-4"
          >
            {formErrors.general && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">{formErrors.general}</div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light">Basic Information</h3>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Offer Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className={`input ${formErrors.title ? 'border-danger' : ''}`}
                    placeholder="e.g., Summer Sale 2024"
                  />
                  {formErrors.title && <p className="text-xs text-danger mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input min-h-[100px]"
                    placeholder="Describe the offer details..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? 'bg-primary' : 'bg-secondary-dark dark:bg-secondary-light'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-primary-dark dark:text-primary-light">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </>
            )}

            {/* Step 2: Discount */}
            {currentStep === 2 && (
              <>
                <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light">Discount Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Discount Type
                  </label>
                  <div className="flex gap-3">
                    {['percentage', 'fixed', 'flat'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, discountType: type }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          form.discountType === type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-primary-dark dark:text-primary-light hover:border-primary'
                        }`}
                      >
                        {type === 'percentage' ? <Percent size={16} /> : type === 'fixed' ? <DollarSign size={16} /> : <Tag size={16} />}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Discount Value <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                      className={`input flex-1 ${formErrors.discountValue ? 'border-danger' : ''}`}
                      min="0"
                      max={form.discountType === 'percentage' ? 100 : undefined}
                      placeholder="0"
                    />
                    <span className="text-sm text-secondary-dark dark:text-secondary-light">
                      {form.discountType === 'percentage' ? '% off' : form.discountType === 'fixed' ? '₹ off' : 'Flat ₹'}
                    </span>
                  </div>
                  {formErrors.discountValue && <p className="text-xs text-danger mt-1">{formErrors.discountValue}</p>}
                </div>
                {form.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      Maximum Discount Amount
                    </label>
                    <input
                      type="number"
                      value={form.maxDiscount || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, maxDiscount: e.target.value ? Number(e.target.value) : null }))}
                      className="input"
                      min="0"
                      placeholder="No limit"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Priority (higher = shown first)
                  </label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* Step 3: Apply On */}
            {currentStep === 3 && (
              <>
                <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light">Apply Offer On</h3>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Apply On
                  </label>
                  <div className="flex gap-3">
                    {['all', 'category', 'brand', 'product'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, applyOn: type, applicableItems: [] }))}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          form.applyOn === type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-primary-dark dark:text-primary-light hover:border-primary'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)} {type === 'all' ? 'Products' : type === 'category' ? 'Categories' : type === 'brand' ? 'Brands' : 'Products'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.applyOn !== 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      Select {form.applyOn === 'category' ? 'Categories' : form.applyOn === 'brand' ? 'Brands' : 'Products'}
                    </label>
                    <div className="max-h-[200px] overflow-y-auto border border-border-light dark:border-border-dark rounded-lg p-2 space-y-1">
                      {(form.applyOn === 'category' ? categories : form.applyOn === 'brand' ? brands : products).map(item => (
                        <label
                          key={item._id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.applicableItems.includes(item._id)}
                            onChange={() => toggleItemInArray('applicableItems', item._id)}
                            className="w-4 h-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-primary-dark dark:text-primary-light">{item.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-secondary-dark dark:text-secondary-light mt-1">
                      {form.applicableItems.length} items selected
                    </p>
                  </div>
                )}

                {/* Exclusions */}
                <div className="space-y-3 pt-4 border-t border-border-light dark:border-border-dark">
                  <h4 className="text-sm font-semibold text-primary-dark dark:text-primary-light">Exclusions (optional)</h4>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">Exclude Categories</label>
                    <div className="max-h-[120px] overflow-y-auto border border-border-light dark:border-border-dark rounded-lg p-2 space-y-1">
                      {categories.map(c => (
                        <label key={c._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-danger/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.excludeCategories.includes(c._id)}
                            onChange={() => toggleItemInArray('excludeCategories', c._id)}
                            className="w-4 h-4 rounded border-border-light text-danger focus:ring-danger"
                          />
                          <span className="text-sm text-primary-dark dark:text-primary-light">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">Exclude Brands</label>
                    <div className="max-h-[120px] overflow-y-auto border border-border-light dark:border-border-dark rounded-lg p-2 space-y-1">
                      {brands.map(b => (
                        <label key={b._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-danger/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.excludeBrands.includes(b._id)}
                            onChange={() => toggleItemInArray('excludeBrands', b._id)}
                            className="w-4 h-4 rounded border-border-light text-danger focus:ring-danger"
                          />
                          <span className="text-sm text-primary-dark dark:text-primary-light">{b.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Validity & Limits */}
            {currentStep === 4 && (
              <>
                <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light">Validity & Usage Limits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className={`input ${formErrors.startDate ? 'border-danger' : ''}`}
                    />
                    {formErrors.startDate && <p className="text-xs text-danger mt-1">{formErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      End Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`input ${formErrors.endDate ? 'border-danger' : ''}`}
                    />
                    {formErrors.endDate && <p className="text-xs text-danger mt-1">{formErrors.endDate}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      Maximum Total Usage
                    </label>
                    <input
                      type="number"
                      value={form.maxUsage || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, maxUsage: e.target.value ? Number(e.target.value) : null }))}
                      className="input"
                      min="0"
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                      Max Usage Per User
                    </label>
                    <input
                      type="number"
                      value={form.maxUsagePerUser}
                      onChange={(e) => setForm(prev => ({ ...prev, maxUsagePerUser: Number(e.target.value) }))}
                      className="input"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Banner & Review */}
            {currentStep === 5 && (
              <>
                <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light">Banner & Review</h3>
                <div>
                  <label className="block text-sm font-medium text-primary-dark dark:text-primary-light mb-1">
                    Offer Banner Image
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{UPLOAD_PRESETS.banners.hint}</p>

                  {bannerPreview ? (
                    <div className="relative group max-w-[500px]">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-[180px] rounded-xl object-cover border border-border-light dark:border-border-dark"
                      />
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                          <div className="w-48">
                            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-white rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-white text-xs text-center mt-1">{uploadProgress}%</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-7 h-7 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                          title="Change image"
                        >
                          <Upload size={12} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          type="button"
                          onClick={removeBanner}
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={dropZoneRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`max-w-[500px] h-[180px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/5 scale-[1.02]'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      <motion.div
                        animate={isDragging ? { y: -5 } : { y: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-primary/20' : 'bg-gray-100 dark:bg-dark-border'}`}>
                          <Upload size={24} className={isDragging ? 'text-primary' : 'text-gray-400'} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                        </div>
                      </motion.div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelect}
                    className="hidden"
                  />
                </div>

                {/* Offer Summary */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Offer Summary — Review before submitting
                  </h4>
                  {bannerPreview && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                      <img src={bannerPreview} alt="Banner" className="w-full h-24 object-cover" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">Title</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.title || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {form.discountType === 'percentage' ? `${form.discountValue}% off` : form.discountType === 'fixed' ? `₹${form.discountValue} off` : `Flat ₹${form.discountValue}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">Apply On</span>
                      <span className="font-medium capitalize text-gray-900 dark:text-white">{form.applyOn}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">Min Order</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{form.minOrderAmount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">Start</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.startDate ? new Date(form.startDate).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-gray-500">End</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.endDate ? new Date(form.endDate).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${form.isActive ? 'text-green-600' : 'text-red-500'}`}>{form.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-gray-500">Priority</span>
                      <span className="font-medium text-gray-900 dark:text-white">{form.priority}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary flex items-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full shrink-0"
                  />
                  <span>{uploadProgress > 0 ? `${uploadProgress}%` : 'Saving...'}</span>
                </div>
              ) : (
                <>
                  <Upload size={16} /> {isEditing ? 'Update Offer' : 'Create Offer'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default OfferFormPage