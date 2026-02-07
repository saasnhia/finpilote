import { CheckCircle, Clock, Send, DollarSign } from 'lucide-react'

interface TVAStatusBadgeProps {
  statut: 'brouillon' | 'validee' | 'envoyee' | 'payee'
  size?: 'sm' | 'md'
}

export function TVAStatusBadge({ statut, size = 'md' }: TVAStatusBadgeProps) {
  const config = {
    brouillon: {
      label: 'Brouillon',
      icon: Clock,
      className: 'bg-navy-100 text-navy-700',
    },
    validee: {
      label: 'Validée',
      icon: CheckCircle,
      className: 'bg-emerald-100 text-emerald-700',
    },
    envoyee: {
      label: 'Envoyée',
      icon: Send,
      className: 'bg-blue-100 text-blue-700',
    },
    payee: {
      label: 'Payée',
      icon: DollarSign,
      className: 'bg-green-100 text-green-700',
    },
  }

  const { label, icon: Icon, className } = config[statut]
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${className} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {label}
    </span>
  )
}
