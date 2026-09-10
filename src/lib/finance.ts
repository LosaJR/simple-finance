import { z } from 'zod'

export const transactionTypes = ['expense', 'income', 'investment'] as const
export type TransactionType = (typeof transactionTypes)[number]

export type PaymentMethodType = 'card'

export interface PaymentMethod {
  id: string
  name: string
  type: PaymentMethodType
  color: string
  lastFour?: string
  active: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  allowedTypes: TransactionType[]
  limitCents?: number
  active: boolean
}

export interface Transaction {
  id: string
  type: TransactionType
  amountCents: number
  merchant: string
  occurredOn: string
  paymentMethodId: string
  categoryId: string
  note?: string
  status: 'posted' | 'pending'
  cycleId: string
  createdAt: string
  updatedAt: string
}

export const transactionDraftSchema = z.object({
  type: z.enum(transactionTypes),
  amountCents: z.number().int().positive(),
  merchant: z.string().trim().max(80),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethodId: z.string().min(1),
  categoryId: z.string().min(1),
  note: z.string().max(240).optional(),
  status: z.enum(['posted', 'pending']).default('posted'),
})

export type TransactionDraft = z.infer<typeof transactionDraftSchema>

export const normalizeMerchant = (merchant: string) => merchant.trim() || 'Movimiento manual'

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card-main',
    name: 'Tarjeta principal',
    type: 'card',
    color: '#256b53',
    active: true,
  },
]

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'leisure',
    name: 'Ocio',
    icon: 'OC',
    color: '#8b5cf6',
    allowedTypes: ['expense'],
    active: true,
  },
  {
    id: 'groceries',
    name: 'Supermercado',
    icon: 'SU',
    color: '#16a34a',
    allowedTypes: ['expense'],
    active: true,
  },
  {
    id: 'fuel',
    name: 'Gasolina',
    icon: 'GA',
    color: '#dc2626',
    allowedTypes: ['expense'],
    active: true,
  },
  {
    id: 'home',
    name: 'Hogar',
    icon: 'HO',
    color: '#2563eb',
    allowedTypes: ['expense'],
    active: true,
  },
  {
    id: 'subscriptions',
    name: 'Suscripciones',
    icon: 'SU',
    color: '#9333ea',
    allowedTypes: ['expense'],
    active: true,
  },
  {
    id: 'income',
    name: 'Ingresos',
    icon: 'IN',
    color: '#15803d',
    allowedTypes: ['income'],
    active: true,
  },
  {
    id: 'investment',
    name: 'Inversiones',
    icon: 'IV',
    color: '#0f766e',
    allowedTypes: ['investment'],
    active: true,
  },
]

export const getCycleId = (occurredOn: string, resetDay = 1) => {
  const date = new Date(`${occurredOn}T12:00:00`)
  const year = date.getFullYear()
  const month = date.getMonth()
  const cycleDate =
    date.getDate() >= resetDay ? new Date(year, month, 1) : new Date(year, month - 1, 1)
  return `${cycleDate.getFullYear()}-${String(cycleDate.getMonth() + 1).padStart(2, '0')}`
}
