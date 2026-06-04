import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Timer, Gift, Sparkles, Clock, Tag } from 'lucide-react'
import { getDiscountText } from '../../utils/offerUtils.js'

const TimeUnit = ({ label, value }) => (
  <div className="text-center">
    <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[38px]">
      <span className="text-white font-bold text-sm tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-white/50 text-[10px] mt-0.5 block">{label}</span>
  </div>
)

const OfferTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)

  const calc = useCallback(() => {
    if (!endDate) return
    const diff = new Date(endDate).getTime() - Date.now()
    if (diff <= 0) { setIsExpired(true); return }
    setTimeLeft({
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    })
  }, [endDate])

  useEffect(() => { calc(); const t = setInterval(calc, 1000); return () => clearInterval(t) }, [calc])

  if (isExpired) return null

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-yellow-300 shrink-0" />
      <div className="flex gap-1">
        <TimeUnit label="Days" value={timeLeft.days} />
        <span className="text-white/30 self-center pb-3">:</span>
        <TimeUnit label="Hrs" value={timeLeft.hours} />
        <span className="text-white/30 self-center pb-3">:</span>
        <TimeUnit label="Min" value={timeLeft.minutes} />
        <span className="text-white/30 self-center pb-3">:</span>
        <TimeUnit label="Sec" value={timeLeft.seconds} />
      </div>
    </div>
  )
}

const FlashDealsBanner = ({ offers, isLoading }) => {
  const validOffers = offers?.filter((o) => o && new Date(o.endDate) > new Date()) || []

  if (isLoading) {
    return (
      <section className="py-10 bg-gradient-to-r from-orange-500 to-red-500 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 bg-white/20 rounded-2xl" />
        </div>
      </section>
    )
  }

  if (validOffers.length === 0) return null

  const sorted = [...validOffers].sort((a, b) => new Date(b.endDate) - new Date(a.endDate))

  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      </div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">Flash Deals</span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </motion.div>

        <div className={`grid gap-4 sm:gap-5 ${sorted.length === 1 ? 'grid-cols-1' : sorted.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {sorted.map((offer, i) => (
            <motion.div
              key={offer._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/15 hover:bg-white/15 transition-all duration-300"
            >
              {sorted.length > 1 && i < sorted.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-white/10 -mr-[calc(0.5rem+1px)]" />
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base truncate">{offer.title}</h3>
                    <p className="text-white/60 text-xs truncate">{offer.description || getDiscountText(offer)}</p>
                  </div>
                </div>
                <div className="shrink-0 px-2.5 py-1 bg-white/15 rounded-full">
                  <span className="text-yellow-300 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                    {getDiscountText(offer)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10">
                <OfferTimer endDate={offer.endDate} />
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-white text-red-600 rounded-full font-semibold hover:bg-gray-100 hover:scale-[1.02] transition-all duration-300 text-xs shadow-lg shadow-black/10"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FlashDealsBanner
