import { cn } from '../../utils/cn'

const styles = {
  safe: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
  neutral: 'bg-white/5 text-zinc-400',
  info: 'bg-blue-500/10 text-blue-400',
  purple: 'bg-purple-500/10 text-purple-400',
}

export default function Badge({ status = 'neutral', children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', styles[status], className)}>
      {children}
    </span>
  )
}
