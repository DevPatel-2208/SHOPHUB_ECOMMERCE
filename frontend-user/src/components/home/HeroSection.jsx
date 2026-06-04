import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Flame, Star, Truck, TrendingUp, Gem, Gift, Zap, Shield, Sparkles, ChevronRight } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUrl.js'
import { formatCurrency } from '../../utils/offerUtils.js'

const slides = [
  { url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80', label: 'Electronics', color: 'from-blue-900/60 to-indigo-900/40' },
  { url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&q=80', label: 'Fashion', color: 'from-pink-900/60 to-purple-900/40' },
  { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&q=80', label: 'Beauty', color: 'from-violet-900/60 to-fuchsia-900/40' },
  { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80', label: 'Home & Living', color: 'from-emerald-900/60 to-teal-900/40' },
  { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=80', label: 'Accessories', color: 'from-amber-900/60 to-orange-900/40' },
]

const AnimatedCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true
          const target = Number(value) || 0
          const steps = 60
          const inc = target / steps
          let cur = 0
          const timer = setInterval(() => {
            cur += inc
            if (cur >= target) { setCount(target); clearInterval(timer) }
            else setCount(Math.floor(cur))
          }, 2000 / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const floatingBadges = [
  { icon: Truck, label: 'Fast Delivery', gradient: 'from-blue-500 to-cyan-500', delay: 0, x: -60, y: -20 },
  { icon: TrendingUp, label: 'Trending', gradient: 'from-orange-500 to-red-500', delay: 0.5, x: 70, y: -10 },
  { icon: Star, label: 'Top Rated', gradient: 'from-yellow-500 to-amber-500', delay: 1, x: 80, y: 30 },
  { icon: Gem, label: 'Premium Brands', gradient: 'from-purple-500 to-pink-500', delay: 1.5, x: -70, y: 25 },
  { icon: Gift, label: 'Daily Offers', gradient: 'from-green-500 to-emerald-500', delay: 2, x: -50, y: 55 },
]

const statItems = [
  { key: 'products', label: 'Products', icon: ShoppingBag },
  { key: 'brands', label: 'Brands', icon: Shield },
  { key: 'happyCustomers', label: 'Customers', icon: Zap },
  { key: 'reviews', label: 'Reviews', icon: Star },
]

const HeroSection = ({ stats, featuredProducts }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const sectionRef = useRef(null)

  const product = featuredProducts?.[0] || null
  const hasOffer = product?.offer?.discountAmount > 0
  const discountPct = product?.comparePrice > product?.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x, y })
  }, [])

  const particleCount = 20

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen overflow-hidden bg-dark"
    >
      {/* ===== BACKGROUND SLIDESHOW ===== */}
      <div className="absolute inset-0">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${
              i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center animate-ken-burns"
              style={{ backgroundImage: `url(${slide.url})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-tr ${slide.color}`} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-dark/50 to-dark/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-dark/30" />
      </div>

      {/* ===== PARTICLES ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: particleCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* ===== SLIDE INDICATORS ===== */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              i === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
          {/* ===== LEFT: Content ===== */}
          <div className="text-center lg:text-left pt-16 sm:pt-20 lg:pt-0">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 sm:mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary-light" />
              <span className="text-xs sm:text-sm font-medium text-white/90 font-poppins">
                India&apos;s Premium Marketplace
              </span>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Everything You Need.
                <br />
                <span className="bg-gradient-to-r from-primary-light via-secondary to-primary-light bg-clip-text text-transparent animate-gradient-text">
                  All In One Place.
                </span>
              </h1>
              <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white/90">
                ShopHubX.
              </p>
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Discover trending fashion, electronics, beauty products,
              home essentials and more at unbeatable prices.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 lg:mt-10"
            >
              <Link
                to="/products"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold text-sm sm:text-base glow-primary hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <ShoppingBag className="w-4 h-4 relative z-10" />
                <span className="font-poppins relative z-10">Shop Now</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>

              <Link
                to="/products?hasOffer=true"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-semibold text-sm sm:text-base border border-white/30 hover:border-white/50 hover:bg-white/20 hover:scale-105 transition-all duration-300 animate-border-glow"
              >
                <Flame className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="font-poppins">Today&apos;s Deals</span>
              </Link>
            </motion.div>

            {/* Animated Counters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-white/10"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {statItems.map((stat, i) => {
                  const val = stats?.[stat.key] || 0
                  return (
                    <div key={stat.key} className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-lg rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-white tabular-nums">
                          <AnimatedCounter value={val} suffix="+" />
                        </p>
                        <p className="text-[10px] sm:text-xs text-white/60 truncate">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* ===== RIGHT: Floating Showcase + Badges ===== */}
          <div className="hidden lg:flex items-center justify-center relative h-full py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* Main Product Showcase Card */}
              <div className="relative w-[340px] xl:w-[380px] glass-premium rounded-3xl p-6 shadow-2xl shadow-black/30">
                {/* ShopHubX Brand Bar */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-white text-lg">ShopHubX</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                    <Truck className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400 font-medium">Free Delivery</span>
                  </div>
                </div>

                {product ? (
                  <>
                    {/* Featured Product Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 mb-4 group">
                      {product?.images?.[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <ShoppingBag className="w-16 h-16 text-white/20 mx-auto" />
                            <p className="text-white/40 text-sm mt-2 font-poppins">Premium Product</p>
                          </div>
                        </div>
                      )}

                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-500/30">
                          {product.offer.discountAmount}% OFF
                        </div>
                      )}
                      {!hasOffer && discountPct > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-500/30">
                          {discountPct}% OFF
                        </div>
                      )}

                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs font-semibold">
                          {product?.ratings?.toFixed(1) || '4.9'}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="font-poppins font-semibold text-white text-sm truncate">
                        {product?.name || 'Premium Product'}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg">
                            ₹{formatCurrency(hasOffer ? product.offer.discountedPrice : product?.price || 0)}
                          </span>
                          {product?.comparePrice > product?.price && (
                            <span className="text-white/40 text-xs line-through">
                              ₹{formatCurrency(product.comparePrice)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded-full">
                          <Zap className="w-3 h-3 text-primary-light" />
                          <span className="text-[10px] text-primary-light font-medium">Quick Delivery</span>
                        </div>
                      </div>
                      <Link
                        to={`/product/${product._id}`}
                        className="block w-full text-center py-2.5 mt-1 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-poppins font-semibold hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300"
                      >
                        View Product
                      </Link>
                    </div>
                  </>
                ) : (
                  /* Welcome Card when no featured product */
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-5">
                      <Sparkles className="w-10 h-10 text-primary-light" />
                    </div>
                    <h3 className="font-display font-bold text-white text-xl mb-2">Welcome to ShopHubX!</h3>
                    <p className="text-white/60 text-sm leading-relaxed mb-5">
                      Discover trending products with free delivery, easy returns, and 24/7 support.
                    </p>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300"
                    >
                      Start Shopping
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-4 border-t border-white/10 w-full">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[11px] text-white/50">Free Delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] text-white/50">Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[11px] text-white/50">Top Rated</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ===== Floating Badges Around Card ===== */}
              {floatingBadges.map((badge, i) => (
                <div
                  key={i}
                  className="absolute hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg animate-float-badge"
                  style={{
                    animationDelay: `${badge.delay}s`,
                    top: `${50 + badge.y + mousePos.y * 5}%`,
                    left: `${50 + badge.x + mousePos.x * 5}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${badge.gradient} flex items-center justify-center`}>
                    <badge.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white text-[11px] font-medium whitespace-nowrap">{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== Bottom gradient fade ===== */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark to-transparent pointer-events-none" />
    </section>
  )
}

export default HeroSection
