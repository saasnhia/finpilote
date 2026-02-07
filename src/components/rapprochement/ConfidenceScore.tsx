interface ConfidenceScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ConfidenceScore({ score, size = 'md', showLabel = true }: ConfidenceScoreProps) {
  const getColor = () => {
    if (score >= 95) return 'text-emerald-600 bg-emerald-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-amber-600 bg-amber-100'
    return 'text-coral-600 bg-coral-100'
  }

  const getLabel = () => {
    if (score >= 95) return 'Excellent'
    if (score >= 80) return 'Bon'
    if (score >= 70) return 'Moyen'
    return 'Faible'
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${getColor()} ${sizeClasses[size]}`}
    >
      {score}%
      {showLabel && <span className="opacity-75">({getLabel()})</span>}
    </span>
  )
}
