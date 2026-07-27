import { Badge } from '@/components/ui/badge'
import type { ImageCategory } from '@/constants'

const CATEGORY_LABEL: Record<ImageCategory, string> = {
  exterior: '외관',
  interior: '내부',
  menu: '메뉴판',
  food: '음식',
}

const CATEGORY_VARIANT: Record<ImageCategory, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  exterior: 'default',
  interior: 'secondary',
  menu: 'outline',
  food: 'default',
}

interface CategoryBadgeProps {
  category: ImageCategory | null
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) {
    return <Badge variant="outline" className="text-muted-foreground">미분류</Badge>
  }
  return (
    <Badge variant={CATEGORY_VARIANT[category]}>
      {CATEGORY_LABEL[category]}
    </Badge>
  )
}
