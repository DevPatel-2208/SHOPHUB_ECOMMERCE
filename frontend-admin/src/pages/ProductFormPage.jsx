import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Loader2, X, Plus, Upload, Image,
  AlertCircle, CheckCircle, Trash2, Eye, FileText,
  DollarSign, Package, Truck, Search, Settings,
  Tag, Hash, Layers, Sparkles, Percent, Clock,
  ChevronDown, ChevronUp, GripVertical, Barcode,
  Globe, Star, TrendingUp, Award, Camera, Film,
  Sun, Moon, Share2, Copy, RefreshCw, SaveAll,
  ClipboardList, Box, Scale, Ruler, Zap, Shield,
  Info, HelpCircle, BadgeCheck, Ban, ToggleLeft
} from 'lucide-react'
import api from '../services/api.js'
import { getImageUrl } from '../utils/imageUrl.js'

// ────────────────────────────────────────
// Initial form state
// ────────────────────────────────────────
const INITIAL_STATE = {
  name: '',
  shortDescription: '',
  description: '',
  slug: '',
  brand: '',
  category: '',
  subcategory: '',

  // Pricing
  price: '',
  discountPrice: '',
  comparePrice: '',
  tax: '',
  offerPercentage: '',
  flashSale: false,
  flashSaleEnd: '',

  // Inventory
  sku: '',
  barcode: '',
  stock: '',
  lowStockThreshold: '5',

  // Shipping
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  shippingCost: '',
  deliveryTime: '',

  // SEO
  seoTitle: '',
  seoDescription: '',
  keywords: '',
  ogImage: '',

  // Status
  status: 'draft',
  isFeatured: false,
  isTrending: false,
  isBestSeller: false,

  // Other
  tags: '',
  specifications: [],
  variants: [],
  attributes: {},

  // Media
  video: '',
}

// ────────────────────────────────────────
// Framer Motion variants
// ────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } },
}

const staggerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, type: 'spring', stiffness: 120 },
  }),
}

// ────────────────────────────────────────
// Styled input component
// ────────────────────────────────────────
const FormInput = ({
  label,
  name,
  value,
  onChange,
  error,
  icon: Icon,
  required,
  type = 'text',
  placeholder,
  helpText,
  disabled,
  options,
  rows,
  className = '',
  ...rest
}) => {
  const baseStyles =
    'w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all duration-200 bg-white dark:bg-gray-800/50'

  const getBorderStyles = () => {
    if (disabled) return 'border-gray-200 dark:border-gray-700/50 opacity-60 cursor-not-allowed'
    if (error) return 'border-red-300 dark:border-red-700/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    return 'border-gray-200 dark:border-gray-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-gray-300 dark:hover:border-gray-600'
  }

  const inputClasses = `${baseStyles} ${getBorderStyles()} ${Icon ? 'pl-10' : ''} ${className}`

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={inputClasses + ' appearance-none cursor-pointer'}
          {...rest}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows || 4}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses + ' resize-none'}
          {...rest}
        />
      )
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        {...rest}
      />
    )
  }

  return (
    <div className="group">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && !['select', 'textarea'].includes(type) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        {renderInput()}
      </div>
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {helpText}
        </p>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-500 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ────────────────────────────────────────
// Toggle switch component
// ────────────────────────────────────────
const ToggleSwitch = ({ label, description, checked, onChange, name, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'peer-checked:bg-indigo-500',
    emerald: 'peer-checked:bg-emerald-500',
    amber: 'peer-checked:bg-amber-500',
    rose: 'peer-checked:bg-rose-500',
    violet: 'peer-checked:bg-violet-500',
    cyan: 'peer-checked:bg-cyan-500',
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors ${colorMap[color] || colorMap.indigo}`}
        ></div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">{label}</span>
        {description && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">{description}</span>
        )}
      </div>
    </label>
  )
}

// ────────────────────────────────────────
// Section card wrapper
// ────────────────────────────────────────
const SectionCard = ({ title, description, icon: Icon, children, defaultOpen = true, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center">
            {Icon && <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {badge}
            </span>
          )}
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────
const ProductFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // ── State ──
  const [form, setForm] = useState(INITIAL_STATE)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [filteredSubcategories, setFilteredSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditMode)
  const [errors, setErrors] = useState({})
  const [specInput, setSpecInput] = useState({ key: '', value: '' })
  const [variantInput, setVariantInput] = useState({ type: '', value: '' })
  const [variants, setVariants] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isAutoSave, setIsAutoSave] = useState(false)

  // ── Auto-save draft ──
  const autoSaveTimer = useRef(null)

  // ── Fetch categories on mount ──
  useEffect(() => {
    fetchCategories()
    fetchBrands()
    if (isEditMode) fetchProduct()
  }, [id])

  // ── Filter subcategories when category changes ──
  useEffect(() => {
    if (form.category) {
      setFilteredSubcategories(
        subcategories.filter(
          (s) => s.category === form.category || s.category?._id === form.category,
        ),
      )
    } else {
      setFilteredSubcategories([])
    }
  }, [form.category, subcategories])

  // ── Load subcategories on category change ──
  useEffect(() => {
    if (form.category) {
      fetchSubcategories(form.category)
    } else {
      setFilteredSubcategories([])
    }
  }, [form.category])

  // ── Auto-generate slug from name ──
  useEffect(() => {
    if (form.name && !isEditMode) {
      const generatedSlug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setForm((prev) => ({ ...prev, slug: generatedSlug }))
    }
  }, [form.name])

  // ── Auto-calculate offer percentage ──
  useEffect(() => {
    if (form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price)) {
      const offer = Math.round(
        ((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100,
      )
      setForm((prev) => ({ ...prev, offerPercentage: String(offer) }))
    } else {
      setForm((prev) => ({ ...prev, offerPercentage: '' }))
    }
  }, [form.price, form.comparePrice])

  // ── Auto-save draft timer ──
  useEffect(() => {
    if (!isEditMode && form.name && Object.keys(errors).length === 0) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        // Auto-save is ready but we don't auto-submit; just mark it
        setIsAutoSave(true)
      }, 30000) // 30 seconds idle
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [form, errors])

  // ── API calls ──
  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories')
      setCategories(data.categories || data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/admin/brands?page=1&limit=200')
      setBrands(data.brands || [])
    } catch (err) {
      console.error('Failed to fetch brands:', err)
    }
  }

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`)
      const product = data.product
      setForm({
        name: product.name || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        slug: product.slug || '',
        brand: product.brand?._id || product.brand || '',
        category: product.category?._id || '',
        subcategory: product.subcategory?._id || '',
        price: product.price?.toString() || '',
        discountPrice: product.discountPrice?.toString() || '',
        comparePrice: product.comparePrice?.toString() || '',
        tax: product.tax?.toString() || '',
        offerPercentage: product.offerPercentage?.toString() || '',
        flashSale: product.flashSale || false,
        flashSaleEnd: product.flashSaleEnd || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        stock: product.stock?.toString() || '',
        lowStockThreshold: product.lowStockThreshold?.toString() || '5',
        weight: product.weight?.toString() || '',
        dimensions: {
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || '',
        },
        shippingCost: product.shippingCost?.toString() || '',
        deliveryTime: product.deliveryTime || '',
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        keywords: product.keywords || '',
        ogImage: product.ogImage || '',
        status: product.status || 'draft',
        isFeatured: product.isFeatured || false,
        isTrending: product.isTrending || false,
        isBestSeller: product.isBestSeller || false,
        tags: product.tags?.join(', ') || '',
        specifications: product.specifications || [],
        variants: product.variants || [],
        attributes: product.attributes || {},
        video: product.video || '',
      })
      if (product.variants) setVariants(product.variants)
      setExistingImages(product.images || [])
      if (product.category?._id) {
        fetchSubcategories(product.category._id)
      }
    } catch (err) {
      console.error('Failed to fetch product:', err)
      toast.error('Failed to load product')
      navigate('/products')
    } finally {
      setIsFetching(false)
    }
  }

  const fetchSubcategories = async (categoryId) => {
    try {
      const params = categoryId ? { category: categoryId } : {}
      const { data } = await api.get('/categories/subcategories', { params })
      setSubcategories(data.subcategories || data)
    } catch (err) {
      console.error('Failed to fetch subcategories:', err)
    }
  }

  // ── Form handlers ──
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('dimensions.')) {
      const dimKey = name.split('.')[1]
      setForm((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimKey]: value },
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  // ── Image handlers ──
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    addImages(files)
  }

  const addImages = (files) => {
    const total = existingImages.length + newImages.length + files.length
    if (total > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed')
      return
    }
    setNewImages((prev) => [...prev, ...validFiles])
    const previews = validFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...previews])
    setErrors((prev) => {
      const { images, ...rest } = prev
      return rest
    })
    toast.success(`${validFiles.length} image(s) added`)
  }

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const setMainImage = (index, isExisting = false) => {
    if (isExisting) {
      const imgs = [...existingImages]
      const [item] = imgs.splice(index, 1)
      imgs.unshift(item)
      setExistingImages(imgs)
    } else {
      const imgs = [...newImages]
      const previews = [...imagePreviews]
      const [item] = imgs.splice(index, 1)
      const [prev] = previews.splice(index, 1)
      imgs.unshift(item)
      previews.unshift(prev)
      setNewImages(imgs)
      setImagePreviews(previews)
    }
    toast.success('Main image updated')
  }

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    addImages(files)
  }, [])

  // ── Specifications ──
  const addSpecification = () => {
    if (!specInput.key.trim() || !specInput.value.trim()) return
    setForm((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { key: specInput.key.trim(), value: specInput.value.trim() },
      ],
    }))
    setSpecInput({ key: '', value: '' })
    toast.success('Specification added')
  }

  const removeSpecification = (index) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }))
  }

  // ── Variants ──
  const addVariant = () => {
    if (!variantInput.type.trim() || !variantInput.value.trim()) return
    const newVar = { type: variantInput.type.trim(), value: variantInput.value.trim() }
    setVariants((prev) => [...prev, newVar])
    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }))
    setVariantInput({ type: '', value: '' })
    toast.success('Variant added')
  }

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  // ── Validation ──
  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Product name is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Valid price is required'
    if (!form.category) newErrors.category = 'Category is required'
    if (form.stock === '' || Number(form.stock) < 0) newErrors.stock = 'Valid stock is required'
    if (newImages.length === 0 && existingImages.length === 0) {
      newErrors.images = 'At least one image is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (e, actionType = 'publish') => {
    e?.preventDefault()
    if (actionType === 'publish' && !validate()) {
      toast.error('Please fix validation errors')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('price', form.price)
      formData.append('status', actionType === 'draft' ? 'draft' : 'published')

      // Optional fields
      if (form.shortDescription) formData.append('shortDescription', form.shortDescription.trim())
      if (form.comparePrice) formData.append('comparePrice', form.comparePrice)
      if (form.discountPrice) formData.append('discountPrice', form.discountPrice)
      if (form.tax) formData.append('tax', form.tax)
      if (form.offerPercentage) formData.append('offerPercentage', form.offerPercentage)
      formData.append('flashSale', form.flashSale)
      if (form.flashSaleEnd) formData.append('flashSaleEnd', form.flashSaleEnd)
      formData.append('category', form.category)
      if (form.subcategory) formData.append('subcategory', form.subcategory)
      if (form.brand) formData.append('brand', form.brand)
      formData.append('stock', form.stock || '0')
      if (form.lowStockThreshold) formData.append('lowStockThreshold', form.lowStockThreshold)
      if (form.sku) formData.append('sku', form.sku.trim())
      if (form.barcode) formData.append('barcode', form.barcode.trim())
      if (form.weight) formData.append('weight', form.weight)
      if (form.shippingCost) formData.append('shippingCost', form.shippingCost)
      if (form.deliveryTime) formData.append('deliveryTime', form.deliveryTime)
      if (form.dimensions.length || form.dimensions.width || form.dimensions.height) {
        formData.append(
          'dimensions',
          JSON.stringify({
            length: Number(form.dimensions.length) || 0,
            width: Number(form.dimensions.width) || 0,
            height: Number(form.dimensions.height) || 0,
          }),
        )
      }
      formData.append('isFeatured', form.isFeatured)
      formData.append('isTrending', form.isTrending)
      formData.append('isBestSeller', form.isBestSeller)
      if (form.seoTitle) formData.append('seoTitle', form.seoTitle.trim())
      if (form.seoDescription) formData.append('seoDescription', form.seoDescription.trim())
      if (form.keywords) formData.append('keywords', form.keywords.trim())
      if (form.slug) formData.append('slug', form.slug.trim())
      if (form.video) formData.append('video', form.video.trim())

      if (form.specifications.length > 0) {
        formData.append('specifications', JSON.stringify(form.specifications))
      }
      if (variants.length > 0) {
        formData.append('variants', JSON.stringify(variants))
      }
      if (form.tags.trim()) {
        formData.append(
          'tags',
          JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)),
        )
      }

      // Existing images for edit mode
      if (isEditMode) {
        formData.append('existingImages', JSON.stringify(existingImages))
      }

      // Append new images
      newImages.forEach((img) => {
        formData.append('images', img)
      })

      // Upload progress simulation
      const uploadToast = toast.loading(isEditMode ? 'Updating product...' : 'Creating product...')

      if (isEditMode) {
        await api.put(`/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          },
        })
        toast.dismiss(uploadToast)
        toast.success('Product updated successfully!')
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          },
        })
        toast.dismiss(uploadToast)
        toast.success('Product created successfully!')
        // Reset form
        setForm(INITIAL_STATE)
        setExistingImages([])
        setNewImages([])
        setImagePreviews([])
        setVariants([])
        setSpecInput({ key: '', value: '' })
        setVariantInput({ type: '', value: '' })
      }

      setTimeout(() => {
        if (!isEditMode) navigate('/products')
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      toast.error(msg)
      setErrors((prev) => ({ ...prev, submit: msg }))
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  // ── Live preview data ──
  const previewProduct = {
    name: form.name || 'Product Name',
    description: form.description || 'Product description will appear here...',
    price: form.price || '0',
    comparePrice: form.comparePrice || null,
    offerPercentage: form.offerPercentage || null,
    images: imagePreviews.length > 0 ? imagePreviews : existingImages.length > 0 ? existingImages.map(getImageUrl) : null,
    category: categories.find((c) => c._id === form.category)?.name || 'Category',
    brand: brands.find((b) => b._id === form.brand)?.name || 'Brand',
    stock: form.stock || '0',
    isFeatured: form.isFeatured,
    status: form.status,
  }

  // ── Loading state ──
  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading product...</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ──
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen pb-12"
    >
      {/* ─── Sticky Header ─── */}
      <motion.div
        variants={cardVariants}
        className="sticky top-0 z-30 bg-gradient-to-r from-gray-50/90 via-white/90 to-gray-50/90 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 mb-6"
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>{isEditMode ? 'Update product details' : 'Fill in the details to create a new product'}</span>
                  {isAutoSave && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Auto-save ready
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow transition-all disabled:opacity-50"
              >
                <SaveAll className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={(e) => handleSubmit(e, 'publish')}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Update Product' : 'Publish Product'}
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  {uploadProgress}%
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* ─── Error Banner ─── */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm mb-6"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errors.submit}
            <button
              type="button"
              onClick={() => setErrors((prev) => ({ ...prev, submit: '' }))}
              className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Mobile Tabs ─── */}
        <div className="lg:hidden mb-6 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl min-w-max">
            {[
              { id: 'basic', label: 'Basic', icon: FileText },
              { id: 'pricing', label: 'Pricing', icon: DollarSign },
              { id: 'media', label: 'Media', icon: Image },
              { id: 'inventory', label: 'Stock', icon: Package },
              { id: 'shipping', label: 'Shipping', icon: Truck },
              { id: 'seo', label: 'SEO', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ─── Left: Main Form (col-span-2) ─── */}
          <div className="lg:col-span-2 space-y-6">
            <form id="product-form" onSubmit={(e) => handleSubmit(e, 'publish')}>
              {/* ===== 1. Basic Information ===== */}
              <div className={activeTab !== 'basic' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Basic Information"
                  description="Core product details and identification"
                  icon={FileText}
                  badge="Required"
                >
                  <div className="space-y-5">
                    <FormInput
                      label="Product Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      error={errors.name}
                      icon={Tag}
                      required
                      placeholder="e.g., Wireless Bluetooth Headphones"
                      helpText="A clear, descriptive name helps customers find your product"
                    />

                    <FormInput
                      label="Short Description"
                      name="shortDescription"
                      value={form.shortDescription}
                      onChange={handleChange}
                      icon={FileText}
                      type="textarea"
                      rows={2}
                      placeholder="Brief summary for product cards and listings"
                      helpText="Displayed in product cards and search results (max 160 chars)"
                    />

                    <FormInput
                      label="Full Description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      error={errors.description}
                      icon={FileText}
                      required
                      type="textarea"
                      rows={5}
                      placeholder="Detailed product description with features, benefits, and specifications"
                      helpText="Supports rich formatting for detailed product information"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        label="Slug (URL)"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        icon={LinkIcon}
                        placeholder="auto-generated-from-name"
                        helpText="Auto-generated from product name"
                      />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (form.name) {
                              const generated = form.name
                                .toLowerCase()
                                .replace(/[^a-z0-9\s-]/g, '')
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')
                                .replace(/^-|-$/g, '')
                              setForm((prev) => ({ ...prev, slug: generated }))
                              toast.success('Slug regenerated')
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-0.5"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormInput
                        label="Category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        error={errors.category}
                        icon={Layers}
                        required
                        type="select"
                        options={[
                          { value: '', label: 'Select category', disabled: true },
                          ...categories.map((cat) => ({
                            value: cat._id,
                            label: cat.name,
                          })),
                        ]}
                      />
                      <FormInput
                        label="Subcategory"
                        name="subcategory"
                        value={form.subcategory}
                        onChange={handleChange}
                        icon={Layers}
                        type="select"
                        disabled={!form.category}
                        options={[
                          { value: '', label: 'Select subcategory', disabled: true },
                          ...filteredSubcategories.map((sub) => ({
                            value: sub._id,
                            label: sub.name,
                          })),
                        ]}
                      />
                      <FormInput
                        label="Brand"
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        icon={Award}
                        type="select"
                        placeholder="Select brand"
                        options={[
                          { value: '', label: 'Select brand', disabled: true },
                          ...brands.map((b) => ({
                            value: b._id,
                            label: b.name,
                          })),
                        ]}
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 2. Pricing & Offers ===== */}
              <div className={activeTab !== 'pricing' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Pricing & Offers"
                  description="Set prices, discounts, and promotional offers"
                  icon={DollarSign}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormInput
                        label="Original Price (₹)"
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={handleChange}
                        error={errors.price}
                        icon={DollarSign}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <FormInput
                        label="Compare at Price (₹)"
                        name="comparePrice"
                        type="number"
                        value={form.comparePrice}
                        onChange={handleChange}
                        icon={DollarSign}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        helpText="Shows strikethrough original price"
                      />
                      <FormInput
                        label="Discount Price (₹)"
                        name="discountPrice"
                        type="number"
                        value={form.discountPrice}
                        onChange={handleChange}
                        icon={Percent}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        helpText="Final discounted price"
                      />
                    </div>

                    {form.comparePrice && form.price && Number(form.comparePrice) > Number(form.price) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800"
                      >
                        <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            You save {form.offerPercentage}% — ₹{Number(form.comparePrice) - Number(form.price)} off!
                          </p>
                          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                            Customers save ₹{Number(form.comparePrice) - Number(form.price)} compared to original price
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        label="Tax (%)"
                        name="tax"
                        type="number"
                        value={form.tax}
                        onChange={handleChange}
                        icon={Hash}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 18"
                        helpText="GST or applicable tax percentage"
                      />
                      <FormInput
                        label="Offer Percentage"
                        name="offerPercentage"
                        type="number"
                        value={form.offerPercentage}
                        onChange={handleChange}
                        icon={Percent}
                        min="0"
                        max="100"
                        placeholder="Auto-calculated"
                        helpText="Auto-calculated from price comparison"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30">
                      <ToggleSwitch
                        label="Flash Sale"
                        description="Enable limited-time flash sale pricing"
                        checked={form.flashSale}
                        onChange={handleChange}
                        name="flashSale"
                        color="amber"
                      />
                      {form.flashSale && (
                        <FormInput
                          label="Flash Sale End Date"
                          name="flashSaleEnd"
                          type="datetime-local"
                          value={form.flashSaleEnd}
                          onChange={handleChange}
                          icon={Clock}
                        />
                      )}
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 3. Inventory Management ===== */}
              <div className={activeTab !== 'inventory' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Inventory Management"
                  description="Track stock, SKU, and availability"
                  icon={Package}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormInput
                        label="SKU"
                        name="sku"
                        value={form.sku}
                        onChange={handleChange}
                        icon={Hash}
                        placeholder="e.g., WBH-001"
                        helpText="Unique Stock Keeping Unit identifier"
                      />
                      <FormInput
                        label="Barcode"
                        name="barcode"
                        value={form.barcode}
                        onChange={handleChange}
                        icon={Barcode}
                        placeholder="e.g., 8901234567890"
                        helpText="UPC, EAN, or ISBN barcode"
                      />
                      <FormInput
                        label="Stock Quantity"
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={handleChange}
                        error={errors.stock}
                        icon={Package}
                        required
                        min="0"
                        placeholder="0"
                        helpText="Current available stock count"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        label="Low Stock Alert Threshold"
                        name="lowStockThreshold"
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={handleChange}
                        icon={AlertCircle}
                        min="0"
                        placeholder="5"
                        helpText="Alert when stock falls below this number"
                      />
                      <div className="flex items-center">
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full ${
                          Number(form.stock) > 0
                            ? Number(form.stock) <= Number(form.lowStockThreshold)
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                          {Number(form.stock) > 0 ? (
                            Number(form.stock) <= Number(form.lowStockThreshold) ? (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                Low Stock — {form.stock} units remaining
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                In Stock — {form.stock} units available
                              </>
                            )
                          ) : (
                            <>
                              <Ban className="w-4 h-4" />
                              Out of Stock
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 4. Product Media ===== */}
              <div className={activeTab !== 'media' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Product Media"
                  description="Upload images and videos"
                  icon={Image}
                >
                  <div className="space-y-5">
                    {errors.images && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.images}
                      </motion.p>
                    )}

                    {/* Drag & Drop Zone */}
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center ${
                        dragOver
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <motion.div
                        animate={{ scale: dragOver ? 1.1 : 1 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center">
                          {dragOver ? (
                            <Upload className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Camera className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dragOver ? 'Drop images here' : 'Drag & drop images here'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          JPG, PNG, WebP, GIF up to 5MB each (max 10 images)
                        </p>
                      </motion.div>
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <Image className="w-3.5 h-3.5" />
                          Current Images ({existingImages.length})
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {existingImages.map((url, index) => (
                            <motion.div
                              key={`existing-${index}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            >
                              <img
                                src={getImageUrl(url)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMainImage(index, true) }}
                                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-indigo-600 transition-colors"
                                  title="Set as main image"
                                >
                                  <BadgeCheck className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeExistingImage(index) }}
                                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {index === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500 text-white shadow-lg">
                                  MAIN
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <Camera className="w-3.5 h-3.5" />
                          New Images ({imagePreviews.length})
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {imagePreviews.map((preview, index) => (
                            <motion.div
                              key={`new-${index}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            >
                              <img
                                src={preview}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMainImage(index) }}
                                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-indigo-600 transition-colors"
                                  title="Set as main image"
                                >
                                  <BadgeCheck className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeNewImage(index) }}
                                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {existingImages.length === 0 && index === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500 text-white shadow-lg">
                                  MAIN
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Upload */}
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30">
                      <FormInput
                        label="Product Video URL"
                        name="video"
                        value={form.video}
                        onChange={handleChange}
                        icon={Film}
                        placeholder="YouTube or Vimeo video URL"
                        helpText="Add a product demonstration video"
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 5. Product Variants ===== */}
              <div className={activeTab !== 'variants' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Product Variants"
                  description="Add size, color, material, and other variants"
                  icon={Box}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={variantInput.type}
                          onChange={(e) => setVariantInput((prev) => ({ ...prev, type: e.target.value }))}
                          placeholder="Variant type (e.g., Size, Color)"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={variantInput.value}
                          onChange={(e) => setVariantInput((prev) => ({ ...prev, value: e.target.value }))}
                          placeholder="Value (e.g., Large, Red)"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={addVariant}
                        disabled={!variantInput.type.trim() || !variantInput.value.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-indigo-500/20"
                      >
                        <Plus className="w-4 h-4" /> Add Variant
                      </motion.button>
                    </div>

                    {/* Variant List */}
                    <AnimatePresence>
                      {variants.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Added Variants ({variants.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {variants.map((v, index) => (
                              <motion.span
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 border border-indigo-100 dark:border-indigo-500/20 text-sm group"
                              >
                                <span className="font-medium text-indigo-600 dark:text-indigo-400 text-xs">
                                  {v.type}:
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">{v.value}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="p-0.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 6. Specifications ===== */}
              <div className={activeTab !== 'specs' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Specifications"
                  description="Add detailed product specifications"
                  icon={ClipboardList}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={specInput.key}
                        onChange={(e) => setSpecInput((prev) => ({ ...prev, key: e.target.value }))}
                        placeholder="Specification (e.g., Material)"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      />
                      <input
                        type="text"
                        value={specInput.value}
                        onChange={(e) => setSpecInput((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder="Value (e.g., Premium Leather)"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={addSpecification}
                        disabled={!specInput.key.trim() || !specInput.value.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-emerald-500/20"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {form.specifications.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Specifications ({form.specifications.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {form.specifications.map((spec, index) => (
                              <motion.div
                                key={index}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30 group hover:border-indigo-200 dark:hover:border-indigo-800/30 transition-colors"
                              >
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 cursor-grab shrink-0" />
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 min-w-[90px] uppercase tracking-wide">
                                  {spec.key}:
                                </span>
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                  {spec.value}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeSpecification(index)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 7. Shipping Information ===== */}
              <div className={activeTab !== 'shipping' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Shipping Information"
                  description="Weight, dimensions, and delivery details"
                  icon={Truck}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormInput
                        label="Weight (kg)"
                        name="weight"
                        type="number"
                        value={form.weight}
                        onChange={handleChange}
                        icon={Scale}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <FormInput
                        label="Shipping Cost (₹)"
                        name="shippingCost"
                        type="number"
                        value={form.shippingCost}
                        onChange={handleChange}
                        icon={Truck}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        helpText="Flat shipping cost"
                      />
                      <FormInput
                        label="Delivery Time"
                        name="deliveryTime"
                        value={form.deliveryTime}
                        onChange={handleChange}
                        icon={Clock}
                        placeholder="e.g., 3-5 business days"
                        helpText="Estimated delivery timeframe"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <Ruler className="w-3.5 h-3.5 text-gray-400" />
                        Dimensions (cm)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="number"
                          name="dimensions.length"
                          value={form.dimensions.length}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                          placeholder="Length"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-gray-300 dark:hover:border-gray-600"
                        />
                        <input
                          type="number"
                          name="dimensions.width"
                          value={form.dimensions.width}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                          placeholder="Width"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-gray-300 dark:hover:border-gray-600"
                        />
                        <input
                          type="number"
                          name="dimensions.height"
                          value={form.dimensions.height}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                          placeholder="Height"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-gray-300 dark:hover:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ===== 8. SEO Settings ===== */}
              <div className={activeTab !== 'seo' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="SEO Settings"
                  description="Optimize for search engines and social sharing"
                  icon={Globe}
                >
                  <div className="space-y-5">
                    <FormInput
                      label="SEO Title"
                      name="seoTitle"
                      value={form.seoTitle}
                      onChange={handleChange}
                      icon={Search}
                      placeholder="Custom title for search engine results"
                      helpText={`Recommended: ${form.name ? `${form.name} — Buy Online at Best Price` : 'Enter a product name first'}`}
                    />
                    <FormInput
                      label="Meta Description"
                      name="seoDescription"
                      value={form.seoDescription}
                      onChange={handleChange}
                      icon={FileText}
                      type="textarea"
                      rows={2}
                      placeholder="Compelling description for search results"
                      helpText="Should be 150-160 characters for optimal display"
                    />
                    <FormInput
                      label="Keywords"
                      name="keywords"
                      value={form.keywords}
                      onChange={handleChange}
                      icon={Hash}
                      placeholder="e.g., wireless headphones, bluetooth earphones, noise cancelling"
                      helpText="Comma-separated keywords for SEO"
                    />
                  </div>
                </SectionCard>
              </div>

              {/* ===== 9. Product Status ===== */}
              <div className={activeTab !== 'status' ? 'hidden lg:block' : ''}>
                <SectionCard
                  title="Product Status"
                  description="Set visibility, featured, and promotional status"
                  icon={Settings}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <ToggleSwitch
                        label="Featured Product"
                        description="Show in featured products section on homepage"
                        checked={form.isFeatured}
                        onChange={handleChange}
                        name="isFeatured"
                        color="violet"
                      />
                      <ToggleSwitch
                        label="Trending Product"
                        description="Mark as trending for special badges"
                        checked={form.isTrending}
                        onChange={handleChange}
                        name="isTrending"
                        color="amber"
                      />
                      <ToggleSwitch
                        label="Best Seller"
                        description="Highlight as a top-selling product"
                        checked={form.isBestSeller}
                        onChange={handleChange}
                        name="isBestSeller"
                        color="emerald"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            checked={form.isFeatured}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 transition-colors"></div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Status</span>
                          <p className="text-xs text-gray-400">Toggle to publish or unpublish this product</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </form>
          </div>

          {/* ─── Right: Preview Panel (col-span-1) ─── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden sticky top-28"
            >
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/30 hover:border-indigo-200 dark:hover:border-indigo-700/30 transition-all group"
                >
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  Live Preview
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/products/' + (form.slug || form.name.toLowerCase().replace(/\s+/g, '-')))
                    toast.success('Share link copied!')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/30 hover:border-emerald-200 dark:hover:border-emerald-700/30 transition-all group"
                >
                  <Share2 className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  Copy Share Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(INITIAL_STATE)
                    setExistingImages([])
                    setNewImages([])
                    setImagePreviews([])
                    setVariants([])
                    setErrors({})
                    toast.success('Form reset')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/30 hover:border-red-200 dark:hover:border-red-700/30 transition-all group"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  Reset Form
                </button>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Product Status</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      form.status === 'published' || !isEditMode
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {isEditMode ? form.status : 'New'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Images</span>
                    <span className="font-medium">{existingImages.length + newImages.length} / 10</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Variants</span>
                    <span className="font-medium">{variants.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Live Preview Panel */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      Live Preview
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
                      {previewProduct.images && previewProduct.images.length > 0 ? (
                        <img
                          src={previewProduct.images[0]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                          {previewProduct.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {previewProduct.category} • {previewProduct.brand}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ₹{Number(previewProduct.price).toLocaleString()}
                        </span>
                        {previewProduct.comparePrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{Number(previewProduct.comparePrice).toLocaleString()}
                          </span>
                        )}
                        {previewProduct.offerPercentage && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {previewProduct.offerPercentage}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          Number(previewProduct.stock) > 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {Number(previewProduct.stock) > 0 ? `In Stock (${previewProduct.stock})` : 'Out of Stock'}
                        </div>
                        {previewProduct.isFeatured && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Helper: Link icon since it's not exported from lucide-react
const LinkIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

export default ProductFormPage
