import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const LogoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <rect x="6" y="14" width="36" height="28" rx="6" fill="url(#logoGrad)" />
    <path d="M14 14V10a10 10 0 0 1 20 0v4" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M16 22h4l2 4h4l2-4h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="20" cy="22" r="1.5" fill="white" />
    <circle cx="28" cy="22" r="1.5" fill="white" />
    <path d="M24 26v4m0 0l-2-2m2 2l2-2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

const Logo = ({ showText = true, size = 'md', linkTo = '/', onDark = false, className = '' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', iconSize: 20 },
    md: { icon: 'w-10 h-10', text: 'text-xl', iconSize: 24 },
    lg: { icon: 'w-14 h-14', text: 'text-3xl', iconSize: 32 },
    xl: { icon: 'w-20 h-20', text: 'text-4xl', iconSize: 40 },
  }

  const s = sizes[size] || sizes.md

  const content = (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`inline-flex items-center gap-2.5 group ${className}`}
    >
      {onDark ? (
        <div
          className={`${s.icon} bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 group-hover:bg-white/30 transition-all duration-300`}
        >
          <LogoIcon size={s.iconSize} />
        </div>
      ) : (
        <div
          className={`${s.icon} bg-gradient-to-br from-primary via-primary-light to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300`}
        >
          <LogoIcon size={s.iconSize} />
        </div>
      )}
      {showText && (
        <span className={`${s.text} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
          ShopHubX
        </span>
      )}
    </motion.div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>
  }

  return content
}

export default Logo