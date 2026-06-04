import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  action,
  actions,
  className = '',
}) => {
  // Render action button from config object { label, icon, onClick }
  const renderAction = () => {
    if (action) {
      const Icon = action.icon;
      return (
        <button
          onClick={action.onClick}
          className="btn-primary flex items-center gap-2"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {action.label}
        </button>
      );
    }
    return null;
  };

  return (
    <motion.div
      className={`mb-6 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {renderAction()}
          {actions}
        </div>
      </div>
    </motion.div>
  );
};

export default PageHeader;