const Skeleton = ({ className = '', variant = 'text', count = 1 }) => {
  const variantClasses = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'h-10 w-10 rounded-full',
    image: 'h-48 w-full rounded-xl',
    card: 'h-24 w-full rounded-xl',
    tableRow: 'h-12 w-full rounded',
    button: 'h-10 w-24 rounded-xl',
  };

  const baseClass = variantClasses[variant] || variantClasses.text;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${className} skeleton`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </>
  );
};

// Card Skeleton for dashboard
export const CardSkeleton = () => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="avatar" className="h-8 w-8" />
    </div>
    <Skeleton variant="title" className="w-32 mb-2" />
    <Skeleton variant="text" className="w-24" />
  </div>
);

// Table Skeleton - renders as standalone block (outside table)
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
    <div className="p-4 border-b border-gray-100 dark:border-dark-border flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" className="w-24" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b border-gray-50 dark:border-dark-border/50 flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} variant="text" className="w-24" />
        ))}
      </div>
    ))}
  </div>
);

// Inline Table Row Skeleton - renders <tr> elements for use inside <tbody>
export const TableRowSkeleton = ({ rows = 5, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50 dark:border-dark-border/50">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-6 py-4">
            <div className="h-4 w-24 rounded skeleton" style={{ animationDelay: `${(i * cols + j) * 100}ms` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default Skeleton;