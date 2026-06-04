import { isValidElement } from 'react'
import { motion } from 'framer-motion';

const EmptyState = ({
  icon,
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  action,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  // Resolve action from either `action` object or separate props
  const resolvedAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction, icon: actionIcon } : null);

  // Render icon: handle component references (Lucide forwardRef) and pre-rendered JSX
  const renderIcon = () => {
    if (!icon) return (
      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    )
    if (isValidElement(icon)) return icon
    const IconComp = icon
    return <IconComp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
  }

  // Render action icon
  const renderActionIcon = () => {
    if (!resolvedAction?.icon) return null
    if (isValidElement(resolvedAction.icon)) return resolvedAction.icon
    const ActionIconComp = resolvedAction.icon
    return <ActionIconComp className="w-4 h-4" />
  }

  return (
    <motion.div
      className={`empty-state ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-light dark:bg-dark-hover flex items-center justify-center mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      {resolvedAction && (
        <button
          onClick={resolvedAction.onClick}
          className="btn-primary flex items-center gap-2"
        >
          {renderActionIcon()}
          {resolvedAction.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;