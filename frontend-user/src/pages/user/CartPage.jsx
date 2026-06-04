import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, BadgePercent, Zap } from 'lucide-react'
import { fetchCart, addToCart } from '../../redux/slices/cartSlice.js'
import { OfferBadge, getOfferLabel } from '../../components/user/OfferBadge.jsx'
import api from '../../services/api.js'
import { getImageUrl } from '../../utils/imageUrl.js'
import { formatCurrency } from '../../utils/offerUtils.js'
import toast from 'react-hot-toast'

const CartPage = () => {
  const { items, totalAmount, discountAmount, offerDiscount, finalAmount, coupon, isLoading } = useSelector((state) => state.cart)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart())
  }, [isAuthenticated, dispatch])

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return
    try {
      await api.put(`/cart/${itemId}`, { quantity: newQty })
      dispatch(fetchCart())
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`)
      dispatch(fetchCart())
      toast.success('Item removed')
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    const code = e.target.coupon.value
    if (!code) return
    try {
      await api.post('/cart/apply-coupon', { code })
      dispatch(fetchCart())
      toast.success('Coupon applied!')
      e.target.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      await api.delete('/cart/coupon')
      dispatch(fetchCart())
      toast.success('Coupon removed')
    } catch (err) {
      toast.error('Failed to remove coupon')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Please login to view your cart</h2>
          <Link to="/login" className="text-primary hover:underline">Login here</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Shopping Cart ({items.length} items)</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-dark-border flex flex-col sm:flex-row gap-4"
              >
                <Link to={`/product/${item.product._id}`} className="shrink-0">
                  <img
                    src={getImageUrl(item.product.images?.[0])}
                    alt={item.product.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product._id}`}>
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">₹{item.price} each</p>
                  {item.variant && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.variant.color && `Color: ${item.variant.color}`}
                      {item.variant.size && ` Size: ${item.variant.size}`}
                    </p>
                  )}

                  {/* Offer Badge */}
                  {item.offer && item.offer.discountAmount > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <OfferBadge offer={item.offer} size="xs" />
                      {item.offer.title && (
                        <span className="text-[10px] text-danger font-medium">{item.offer.title}</span>
                      )}
                    </div>
                  )}

                  {/* Price with offer */}
                  {item.offer && item.offer.discountAmount > 0 ? (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-danger">₹{formatCurrency(Math.round(item.offer.discountedPrice * item.quantity))}</span>
                      <span className="text-xs text-gray-400 line-through">₹{formatCurrency(item.totalPrice)}</span>
                      <span className="text-[10px] text-green-600 font-medium">Save ₹{formatCurrency(item.offer.discountAmount)}</span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-2 text-gray-400 hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96 shrink-0">
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>

              {/* Coupon */}
              {coupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{coupon.code}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-4">
                  <input
                    name="coupon"
                    type="text"
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border text-sm focus:border-primary outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total MRP</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" /> Offer Discount
                    </span>
                    <span>-₹{offerDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon Discount
                    </span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (18%)</span>
                  <span>₹{Math.round(finalAmount * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-dark-border pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{(finalAmount + Math.round(finalAmount * 0.18)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {(offerDiscount > 0 || discountAmount > 0) && (
                  <div className="p-2.5 bg-green-50 dark:bg-green-900/10 rounded-lg ring-1 ring-green-100 dark:ring-green-800/20">
                    <p className="text-[11px] text-green-600 dark:text-green-400 text-center font-medium flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      You saved ₹{formatCurrency(offerDiscount + discountAmount)} on this order!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>

              <Link
                to="/products"
                className="block text-center mt-3 text-sm text-primary hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
