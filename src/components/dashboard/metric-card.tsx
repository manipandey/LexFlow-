import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  href?: string
  color?: 'blue' | 'purple' | 'teal' | 'gold' | 'orange' | 'red'
  alert?: boolean
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  teal: {
    bg: 'bg-teal-500/10',
    icon: 'text-teal-400',
    border: 'border-teal-500/20',
  },
  gold: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    icon: 'text-orange-400',
    border: 'border-orange-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20',
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color = 'blue',
  alert = false,
}: MetricCardProps) {
  const colors = colorMap[color]

  const card = (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border bg-card p-5',
        'transition-all duration-200',
        href && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        alert && 'border-red-500/30 bg-red-500/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            colors.bg
          )}
        >
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>

      {alert && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
