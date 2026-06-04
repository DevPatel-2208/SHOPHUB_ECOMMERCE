import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, MapPin, Home, Briefcase, Star, Trash2, Edit2, X, Check, Loader2, AlertCircle } from 'lucide-react'
import api from '../../services/api.js'
import toast from 'react-hot-toast'

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().regex(/^[0-9]{6}$/, 'Enter a valid 6-digit PIN code'),
  country: z.string().optional().or(z.literal('')),
  addressType: z.enum(['home', 'work', 'other']),
  isDefault: z.boolean().optional(),
})

const AddressBookPage = () => {
  const [addresses, setAddresses] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      addressType: 'home',
      isDefault: false,
    },
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses')
      setAddresses(data.addresses || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load addresses')
    }
  }

  const cleanFormData = (data) => {
    // Remove empty optional fields so backend doesn't receive empty strings
    const cleaned = { ...data }
    if (cleaned.addressLine2 === '' || cleaned.addressLine2 === undefined) {
      delete cleaned.addressLine2
    }
    if (cleaned.country === '' || cleaned.country === undefined) {
      delete cleaned.country
    }
    // Ensure isDefault is a boolean
    cleaned.isDefault = Boolean(cleaned.isDefault)
    return cleaned
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerErrors([])
    const cleanedData = cleanFormData(data)

    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, cleanedData)
        toast.success('Address updated!')
      } else {
        await api.post('/addresses', cleanedData)
        toast.success('Address added!')
      }
      setIsFormOpen(false)
      setEditingId(null)
      reset()
      fetchAddresses()
    } catch (err) {
      const response = err.response?.data
      if (response?.errors && Array.isArray(response.errors)) {
        // Show backend validation errors as field-specific messages
        setServerErrors(response.errors)
        toast.error(response.message || 'Validation error')
      } else {
        toast.error(response?.message || 'Failed to save address')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return
    try {
      await api.delete(`/addresses/${id}`)
      toast.success('Address removed')
      fetchAddresses()
    } catch (err) {
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/set-default`)
      toast.success('Default address updated')
      fetchAddresses()
    } catch (err) {
      toast.error('Failed to update default address')
    }
  }

  const handleEdit = (addr) => {
    setEditingId(addr._id)
    setServerErrors([])
    reset({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || '',
      addressType: addr.addressType || 'home',
      isDefault: addr.isDefault || false,
    })
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setServerErrors([])
    reset({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      addressType: 'home',
      isDefault: false,
    })
    setIsFormOpen(true)
  }

  const typeIcons = { home: Home, work: Briefcase, other: MapPin }
  const typeLabels = { home: 'Home', work: 'Work', other: 'Other' }

  // Map server error messages to form fields
  const getFieldError = (fieldName) => {
    const clientError = errors[fieldName]?.message
    if (clientError) return clientError
    const serverMsg = serverErrors.find((e) =>
      e.toLowerCase().includes(fieldName.toLowerCase())
    )
    if (serverMsg) return serverMsg
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Address Book
          </h1>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Server Error Banner */}
        {serverErrors.length > 0 && !isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-danger">Validation Error</p>
                <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {serverErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Address Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-dark-border mb-6 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Edit Address' : 'New Address'}
                </h2>
                <button
                  onClick={() => { setIsFormOpen(false); setEditingId(null); setServerErrors([]) }}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Server Errors inside form */}
              {serverErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                      {serverErrors.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Row: Full Name + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('fullName')}
                      placeholder="e.g. John Doe"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                        getFieldError('fullName')
                          ? 'border-danger focus:border-danger'
                          : 'border-gray-200 dark:border-dark-border focus:border-primary'
                      } outline-none text-sm transition-colors`}
                    />
                    {getFieldError('fullName') && (
                      <p className="text-danger text-xs mt-1">{getFieldError('fullName')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('phone')}
                      placeholder="e.g. 9876543210"
                      type="tel"
                      maxLength={10}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                        getFieldError('phone')
                          ? 'border-danger focus:border-danger'
                          : 'border-gray-200 dark:border-dark-border focus:border-primary'
                      } outline-none text-sm transition-colors`}
                    />
                    {getFieldError('phone') && (
                      <p className="text-danger text-xs mt-1">{getFieldError('phone')}</p>
                    )}
                  </div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 1 <span className="text-danger">*</span>
                  </label>
                  <input
                    {...register('addressLine1')}
                    placeholder="e.g. 123 Main Street, Apartment 4B"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                      getFieldError('addressLine1')
                        ? 'border-danger focus:border-danger'
                        : 'border-gray-200 dark:border-dark-border focus:border-primary'
                    } outline-none text-sm transition-colors`}
                  />
                  {getFieldError('addressLine1') && (
                    <p className="text-danger text-xs mt-1">{getFieldError('addressLine1')}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 2 <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    {...register('addressLine2')}
                    placeholder="e.g. Near City Mall"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none text-sm transition-colors"
                  />
                </div>

                {/* Row: City + State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('city')}
                      placeholder="e.g. Mumbai"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                        getFieldError('city')
                          ? 'border-danger focus:border-danger'
                          : 'border-gray-200 dark:border-dark-border focus:border-primary'
                      } outline-none text-sm transition-colors`}
                    />
                    {getFieldError('city') && (
                      <p className="text-danger text-xs mt-1">{getFieldError('city')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('state')}
                      placeholder="e.g. Maharashtra"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                        getFieldError('state')
                          ? 'border-danger focus:border-danger'
                          : 'border-gray-200 dark:border-dark-border focus:border-primary'
                      } outline-none text-sm transition-colors`}
                    />
                    {getFieldError('state') && (
                      <p className="text-danger text-xs mt-1">{getFieldError('state')}</p>
                    )}
                  </div>
                </div>

                {/* Row: PIN Code + Address Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PIN Code <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('postalCode')}
                      placeholder="e.g. 400001"
                      type="tel"
                      maxLength={6}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border ${
                        getFieldError('postalCode')
                          ? 'border-danger focus:border-danger'
                          : 'border-gray-200 dark:border-dark-border focus:border-primary'
                      } outline-none text-sm transition-colors`}
                    />
                    {getFieldError('postalCode') && (
                      <p className="text-danger text-xs mt-1">{getFieldError('postalCode')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Type
                    </label>
                    <select
                      {...register('addressType')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border focus:border-primary outline-none text-sm transition-colors appearance-none cursor-pointer"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Default Checkbox */}
                <div className="flex items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    {...register('isDefault')}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    Set as default address
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm shadow-primary/20"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingId ? (
                    'Update Address'
                  ) : (
                    'Save Address'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address List */}
        <div className="space-y-3 sm:space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <MapPin className="w-12 h-12 sm:w-14 sm:h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No addresses saved yet</p>
              <button
                onClick={handleAddNew}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Your First Address
              </button>
            </div>
          ) : (
            addresses.map((addr) => {
              const TypeIcon = typeIcons[addr.addressType] || MapPin
              const typeLabel = typeLabels[addr.addressType] || 'Other'
              return (
                <motion.div
                  key={addr._id}
                  layout
                  className={`bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 border-2 transition-colors shadow-sm ${
                    addr.isDefault
                      ? 'border-primary/30 bg-primary/5 dark:bg-primary/5'
                      : 'border-gray-100 dark:border-dark-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        addr.isDefault
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 dark:bg-dark text-gray-500'
                      }`}>
                        <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                            {addr.fullName}
                          </span>
                          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-dark text-gray-500 dark:text-gray-400 text-xs rounded-full capitalize">
                            {typeLabel}
                          </span>
                          {addr.isDefault && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1 font-medium">
                              <Star className="w-3 h-3 fill-primary" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                          {addr.phone}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(addr)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr._id)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="mt-2 sm:mt-3 text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3.5 h-3.5" /> Set as default
                    </button>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AddressBookPage
