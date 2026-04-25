import { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { Loader2, X } from 'lucide-react'

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary'|'secondary'|'danger'|'ghost'; size?: 'sm'|'md'|'lg'; loading?: boolean; children: ReactNode
}>(({ variant='primary', size='md', loading, children, className='', disabled, ...props }, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-5 py-3 text-[15px]' }
  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-400 active:scale-[0.98]',
    secondary: 'bg-white border border-surface-200 text-ink-muted hover:bg-surface-50 focus:ring-surface-200',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
    ghost:     'text-ink-muted hover:bg-surface-100 focus:ring-surface-200',
  }
  return (
    <button ref={ref} disabled={disabled||loading} className={`${base} ${sizes[size as keyof typeof sizes]} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
  )
})
Button.displayName = 'Button'

export function Spinner({ size=20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-primary-600" />
}

export function Card({ children, className='', padding=true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return <div className={`bg-white rounded-xl border border-surface-200 shadow-card ${padding?'p-5':''} ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action, icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-100">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-primary-600">{icon}</span>}
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; leftIcon?: ReactNode; rightElement?: ReactNode
}>(({ label, error, leftIcon, rightElement, className='', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-ink-muted">{label}</label>}
    <div className={`flex items-center bg-surface-50 border rounded-xl transition-all ${error ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100' : 'border-surface-200 focus-within:border-primary-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-50'}`}>
      {leftIcon && <span className="w-10 flex items-center justify-center text-ink-faint flex-shrink-0">{leftIcon}</span>}
      <input ref={ref} className={`flex-1 bg-transparent border-none outline-none text-sm font-medium text-ink placeholder:text-ink-faint h-11 ${leftIcon?'pl-0 pr-3':'px-3'} ${className}`} {...props} />
      {rightElement && <div className="pr-2 flex-shrink-0">{rightElement}</div>}
    </div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string; error?: string; options: { value: string; label: string }[]; placeholder?: string
}>(({ label, error, options, placeholder, className='', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-ink-muted">{label}</label>}
    <select ref={ref} className={`h-11 px-3 bg-surface-50 border rounded-xl text-sm font-medium text-ink outline-none transition-all ${error?'border-red-400':'border-surface-200 focus:border-primary-600 focus:bg-white focus:ring-2 focus:ring-primary-50'} ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string; error?: string
}>(({ label, error, className='', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-ink-muted">{label}</label>}
    <textarea ref={ref} className={`px-3 py-2.5 bg-surface-50 border rounded-xl text-sm font-medium text-ink outline-none transition-all resize-none ${error?'border-red-400':'border-surface-200 focus:border-primary-600 focus:bg-white focus:ring-2 focus:ring-primary-50'} ${className}`} rows={3} {...props} />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

type BadgeVariant = 'success'|'warning'|'error'|'info'|'neutral'
export function Badge({ variant='neutral', children }: { variant?: BadgeVariant; children: ReactNode }) {
  const map: Record<BadgeVariant, string> = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error:   'bg-red-50 text-red-700 border-red-200',
    info:    'bg-primary-50 text-primary-700 border-primary-100',
    neutral: 'bg-surface-100 text-ink-muted border-surface-200',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[variant]}`}>{children}</span>
}

export function Modal({ open, onClose, title, children, size='md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm'|'md'|'lg'|'xl'
}) {
  if (!open) return null
  const widths = { sm:'max-w-[92vw] sm:max-w-sm', md:'max-w-[92vw] sm:max-w-lg', lg:'max-w-[95vw] sm:max-w-2xl', xl:'max-w-[95vw] sm:max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${widths[size as keyof typeof widths]} max-h-[90vh] overflow-y-auto animate-fade-up`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-100"><X size={15} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ icon, label, value, trend, color='primary' }: {
  icon: ReactNode; label: string; value: string|number
  trend?: { value: string; up: boolean }; color?: 'primary'|'success'|'warning'|'purple'
}) {
  const colors = { primary:'bg-primary-50 text-primary-600', success:'bg-green-50 text-green-600', warning:'bg-amber-50 text-amber-600', purple:'bg-purple-50 text-purple-600' }
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color as keyof typeof colors]}`}>{icon}</div>
        {trend && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trend.up?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{trend.up?'↑':'↓'} {trend.value}</span>}
      </div>
      <div className="text-2xl font-black text-ink tracking-tight leading-none mb-1">{value}</div>
      <div className="text-xs text-ink-faint font-medium">{label}</div>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-ink-faint mb-3">{icon}</div>
      <h3 className="text-sm font-bold text-ink-muted mb-1">{title}</h3>
      {description && <p className="text-xs text-ink-faint mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

export function CaisseStatus({ isOuverte, since }: { isOuverte: boolean; since?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isOuverte?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOuverte?'bg-green-500 animate-pulse':'bg-red-400'}`} />
      {isOuverte ? 'Caisse ouverte' : 'Caisse fermée'}
      {isOuverte && since && <span className="opacity-60 font-normal">· {since}</span>}
    </div>
  )
}
