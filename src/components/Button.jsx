
export default function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700',
    secondary: 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50',
    ghost: 'bg-transparent text-blue-700 border-transparent hover:bg-blue-50',
  };
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2 text-base',
  };
  const cls = `${base} ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.md} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
