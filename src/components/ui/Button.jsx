import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-white text-zinc-900 font-medium hover:bg-zinc-200',
  secondary: 'bg-zinc-800/50 border border-white/10 text-zinc-100 hover:border-white/20 hover:bg-zinc-800/80',
  ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, children, onClick, type = 'button', className }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
