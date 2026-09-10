import { z } from 'zod'

export const transactionTypes = ['expense', 'income'] as const
export type TransactionType = (typeof transactionTypes)[number]

export type PaymentMethodType = 'card'

export interface PaymentMethod {
  id: string
  name: string
  type: PaymentMethodType
  color: string
  lastFour?: string
  active: boolean
  isPrimary: boolean
}

export interface AppSettings {
  id: 'app-settings'
  paydayDay: number
  paydayAmountCents: number
  suppressedPayrollCycleIds: string[]
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
  status: 'posted' | 'pending'
  source?: 'manual' | 'payroll'
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
  status: z.enum(['posted', 'pending']).default('posted'),
  source: z.enum(['manual', 'payroll']).default('manual'),
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
    isPrimary: true,
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app-settings',
  paydayDay: 1,
  paydayAmountCents: 0,
  suppressedPayrollCycleIds: [],
}

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
]

export const getPaydayDate = (year: number, month: number, paydayDay: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const payday = new Date(year, month, Math.min(paydayDay, lastDay))
  while (payday.getDay() === 0 || payday.getDay() === 6) {
    payday.setDate(payday.getDate() + 1)
  }
  return payday
}

export const getCycleId = (occurredOn: string, resetDay = 1) => {
  const date = new Date(`${occurredOn}T12:00:00`)
  const year = date.getFullYear()
  const month = date.getMonth()
  const currentPayday = getPaydayDate(year, month, resetDay)
  const closingPayday =
    date >= currentPayday
      ? getPaydayDate(year, month + 1, resetDay)
      : currentPayday
  const finalCycleDay = new Date(closingPayday)
  finalCycleDay.setDate(finalCycleDay.getDate() - 1)
  return `${finalCycleDay.getFullYear()}-${String(finalCycleDay.getMonth() + 1).padStart(2, '0')}`
}
