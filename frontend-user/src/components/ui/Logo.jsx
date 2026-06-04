import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Logo = ({ showText = true, size = 'md', linkTo = '/', onDark = false, className = '' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', innerText: 'text-base' },
    md: { icon: 'w-10 h-10', text: 'text-xl', innerText: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl', innerText: 'text-2xl' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl', innerText: 'text-3xl' },
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
          <span className={`text-white font-bold ${s.innerText}`}>S</span>
        </div>
      ) : (
        <div
          className={`${s.icon} bg-gradient-to-br from-primary via-primary-light to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300`}
        >
          <span className={`text-white font-bold ${s.innerText}`}>S</span>
        </div>
      )}
      {showText && (
        <span className={`${s.text} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
          ShopHub
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