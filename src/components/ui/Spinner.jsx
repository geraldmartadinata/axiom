export default function Spinner({ size = 'md' }) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
  return (
    <div className="flex items-center gap-1.5">
      <span className={dotSize + ' rounded-full bg-zinc-400 animate-pulse-glow'} />
      <span className={dotSize + ' rounded-full bg-zinc-400 animate-pulse-glow'} style={{ animationDelay: '0.2s' }} />
      <span className={dotSize + ' rounded-full bg-zinc-400 animate-pulse-glow'} style={{ animationDelay: '0.4s' }} />
    </div>
  )
}
