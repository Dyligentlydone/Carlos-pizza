/**
 * Pizza Shop Pricing Engine
 * ---------------------------------------------
 * Deterministic pricing logic used by:
 *  - POST /api/orders/preview  (pricing preview for Retell AI)
 *  - POST /api/orders          (future: reuse to validate submitted totals)
 *
 * All pricing logic is explicit. No AI inference on the backend.
 */

export type Size = 'small' | 'medium' | 'large' | 'xl'

export interface PreviewItemInput {
  name: string
  quantity?: number
  customizations?: string
}

export interface PricedItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
  breakdown?: {
    base: number
    toppings: number
    topping_names: string[]
    size?: Size
    category: string
  }
}

export interface PriceCalculationResult {
  items: PricedItem[]
  subtotal: number
  tax: number
  total: number
  errors: string[]
}

// ---------- MENU DATA ----------

const BASE_PIZZA_PRICES: Record<Size, number> = {
  small: 10.99,
  medium: 14.99,
  large: 18.99,
  xl: 22.99,
}

const SPECIALTY_PIZZAS: Record<string, Record<Size, number>> = {
  supreme: { small: 15.99, medium: 19.99, large: 24.99, xl: 28.99 },
  'meat lovers': { small: 14.99, medium: 18.99, large: 23.99, xl: 27.99 },
  'veggie delight': { small: 13.99, medium: 17.99, large: 21.99, xl: 25.99 },
}

// Aliases / alternate names customers/AI might say
const SPECIALTY_ALIASES: Record<string, string> = {
  'meat lover': 'meat lovers',
  meatlovers: 'meat lovers',
  'meat-lovers': 'meat lovers',
  veggie: 'veggie delight',
  vegetarian: 'veggie delight',
  'veggie supreme': 'veggie delight',
}

const TOPPING_PRICE = 1.5

const VALID_TOPPINGS = [
  'pepperoni',
  'sausage',
  'mushrooms',
  'mushroom',
  'onions',
  'onion',
  'green peppers',
  'green pepper',
  'peppers',
  'pepper',
  'black olives',
  'olives',
  'olive',
  'extra cheese',
  'cheese',
]

const SIDES: Record<string, number> = {
  'garlic bread': 4.99,
  wings: 9.99,
  '10pc wings': 9.99,
  'wings (10pc)': 9.99,
  'caesar salad': 6.99,
  salad: 6.99,
}

const DRINKS: Record<string, number> = {
  '2-liter soda': 3.99,
  '2 liter soda': 3.99,
  'two liter soda': 3.99,
  soda: 3.99,
}

// ---------- HELPERS ----------

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

function detectSize(name: string): Size | null {
  const n = normalize(name)
  if (/\b(xl|extra[- ]?large|x-large)\b/.test(n)) return 'xl'
  if (/\blarge\b/.test(n)) return 'large'
  if (/\bmedium\b/.test(n)) return 'medium'
  if (/\bsmall\b/.test(n)) return 'small'
  return null
}

function detectSpecialty(name: string): string | null {
  const n = normalize(name)
  for (const alias in SPECIALTY_ALIASES) {
    if (n.includes(alias)) return SPECIALTY_ALIASES[alias]
  }
  for (const specialty in SPECIALTY_PIZZAS) {
    if (n.includes(specialty)) return specialty
  }
  return null
}

function extractToppingsFromName(name: string): string[] {
  const n = normalize(name)
  const found: string[] = []
  for (const t of VALID_TOPPINGS) {
    // match whole word
    const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`)
    if (re.test(n) && !found.includes(canonicalTopping(t))) {
      found.push(canonicalTopping(t))
    }
  }
  return found
}

function extractToppingsFromCustomizations(custom?: string): string[] {
  if (!custom) return []
  const n = normalize(custom)
  const found: string[] = []
  for (const t of VALID_TOPPINGS) {
    const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`)
    if (re.test(n)) {
      // ignore negatives like "no cheese", "no onions"
      const negativeRe = new RegExp(`\\bno\\s+${t}\\b`)
      if (negativeRe.test(n)) continue
      const canon = canonicalTopping(t)
      if (!found.includes(canon)) found.push(canon)
    }
  }
  return found
}

function canonicalTopping(t: string): string {
  const map: Record<string, string> = {
    mushroom: 'mushrooms',
    onion: 'onions',
    'green pepper': 'green peppers',
    peppers: 'green peppers',
    pepper: 'green peppers',
    olive: 'black olives',
    olives: 'black olives',
    cheese: 'extra cheese',
  }
  return map[t] || t
}

// ---------- ITEM PRICING ----------

function priceItem(input: PreviewItemInput): PricedItem | { error: string } {
  const quantity = Number.isFinite(input.quantity) && (input.quantity ?? 0) > 0
    ? Math.floor(input.quantity as number)
    : 1

  const rawName = input.name?.trim()
  if (!rawName) {
    return { error: 'Item name is required' }
  }

  const nameLower = normalize(rawName)

  // 1) SIDES
  for (const key in SIDES) {
    if (nameLower === key || nameLower.includes(key)) {
      const unit = SIDES[key]
      return {
        name: rawName,
        quantity,
        unit_price: round2(unit),
        total_price: round2(unit * quantity),
        breakdown: { base: unit, toppings: 0, topping_names: [], category: 'side' },
      }
    }
  }

  // 2) DRINKS
  for (const key in DRINKS) {
    if (nameLower === key || nameLower.includes(key)) {
      const unit = DRINKS[key]
      return {
        name: rawName,
        quantity,
        unit_price: round2(unit),
        total_price: round2(unit * quantity),
        breakdown: { base: unit, toppings: 0, topping_names: [], category: 'drink' },
      }
    }
  }

  // 3) PIZZAS — must have a size
  const size = detectSize(rawName)
  const specialty = detectSpecialty(rawName)

  if (specialty) {
    if (!size) {
      return { error: `Size is required for "${rawName}" (small, medium, large, or XL)` }
    }
    const base = SPECIALTY_PIZZAS[specialty][size]
    // Extra toppings beyond the specialty (from customizations only)
    const extraToppings = extractToppingsFromCustomizations(input.customizations)
    const toppingsCost = extraToppings.length * TOPPING_PRICE
    const unit = round2(base + toppingsCost)
    return {
      name: rawName,
      quantity,
      unit_price: unit,
      total_price: round2(unit * quantity),
      breakdown: {
        base,
        toppings: round2(toppingsCost),
        topping_names: extraToppings,
        size,
        category: 'specialty_pizza',
      },
    }
  }

  // Generic pizza (build-your-own)
  if (nameLower.includes('pizza') || nameLower.includes('pie')) {
    if (!size) {
      return { error: `Size is required for "${rawName}" (small, medium, large, or XL)` }
    }
    const base = BASE_PIZZA_PRICES[size]

    // Toppings come from both the name (e.g. "Large Pepperoni Pizza")
    // and the customizations field.
    const nameToppings = extractToppingsFromName(rawName)
    const customToppings = extractToppingsFromCustomizations(input.customizations)
    const all = Array.from(new Set([...nameToppings, ...customToppings]))

    const toppingsCost = all.length * TOPPING_PRICE
    const unit = round2(base + toppingsCost)
    return {
      name: rawName,
      quantity,
      unit_price: unit,
      total_price: round2(unit * quantity),
      breakdown: {
        base,
        toppings: round2(toppingsCost),
        topping_names: all,
        size,
        category: 'pizza',
      },
    }
  }

  return { error: `Unrecognized item: "${rawName}"` }
}

// ---------- PUBLIC API ----------

export function calculateOrderPricing(
  items: PreviewItemInput[],
  opts: { taxRate?: number } = {}
): PriceCalculationResult {
  const taxRate = opts.taxRate ?? 0
  const priced: PricedItem[] = []
  const errors: string[] = []

  if (!Array.isArray(items) || items.length === 0) {
    return { items: [], subtotal: 0, tax: 0, total: 0, errors: ['No items provided'] }
  }

  for (const raw of items) {
    const result = priceItem(raw)
    if ('error' in result) {
      errors.push(result.error)
    } else {
      priced.push(result)
    }
  }

  const subtotal = round2(priced.reduce((sum, it) => sum + it.total_price, 0))
  const tax = round2(subtotal * taxRate)
  const total = round2(subtotal + tax)

  return { items: priced, subtotal, tax, total, errors }
}
