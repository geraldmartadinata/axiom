import { cn } from '../../utils/cn'

export default function Input({ label, error, type = 'text', value, onChange, placeholder, icon, ...rest }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full bg-zinc-950/60 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none transition-colors',
            icon ? 'pl-12' : '',
            error ? 'border-red-500/30' : 'border-white/[6%] focus:border-white/[15%]'
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
