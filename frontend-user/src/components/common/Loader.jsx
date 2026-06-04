import { motion } from 'framer-motion'

export const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16', xl: 'w-24 h-24' }

  const content = (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full`}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{content}</div>
}

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  </div>
)

export const SkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

export default Loader
