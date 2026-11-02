import type { Category } from '../domain/types'

const HUE: Record<Category, number | null> = { sprit: 28, parken: 215, hotel: 330, bewirtung: 135, material: 260, sonstiges: null }

export function CategoryDot({ category }: { category: Category }) {
  const hue = HUE[category]
  return <span className={`dot${hue === null ? ' g' : ''}`} style={hue === null ? undefined : ({ '--h': hue } as React.CSSProperties)} />
}
