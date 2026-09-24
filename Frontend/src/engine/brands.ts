import catalog from '../data/brands.json'
import type { Medicine } from '../types'

type BrandRecord = { brand: string; generic: string; drugClass: string }
const brands = catalog as BrandRecord[]

function distance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0]
    row[0] = leftIndex
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex]
      row[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal + 1, above + 1, row[rightIndex - 1] + 1)
      diagonal = above
    }
  }
  return row[right.length]
}

export function mapBrand(input: string): Pick<Medicine, 'generic' | 'drugClass' | 'mappedBy'> {
  const normalized = input.trim().toLowerCase()
  const exact = brands.find((item) => item.brand.toLowerCase() === normalized)
  if (exact) return { generic: exact.generic, drugClass: exact.drugClass, mappedBy: 'exact' }

  const candidate = brands
    .map((item) => ({ item, score: distance(normalized, item.brand.toLowerCase()) }))
    .sort((left, right) => left.score - right.score)[0]
  const threshold = Math.max(2, Math.floor(normalized.length * 0.32))
  if (candidate && candidate.score <= threshold) {
    return { generic: candidate.item.generic, drugClass: candidate.item.drugClass, mappedBy: 'fuzzy' }
  }
  return { mappedBy: 'unknown' }
}

export function mapMedicine(medicine: Medicine): Medicine {
  return { ...medicine, ...mapBrand(medicine.brand) }
}
