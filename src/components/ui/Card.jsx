import { cn } from '../../utils/cn'

export default function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-zinc-900/60 backdrop-blur-xl border border-white/[6%] rounded-3xl p-6',
        onClick && 'hover:border-white/[12%] transition-all cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
