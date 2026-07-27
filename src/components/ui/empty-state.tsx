import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({ icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
