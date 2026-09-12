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
  theme: 'dark' | 'light'
  highContrast: boolean
  onboardingCompleted: boolean
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
  source?: 'manual' | 'payroll' | 'planned' | 'automation'
  cycleId: string
  createdAt: string
  updatedAt: string
}

export interface MerchantRule {
  id: string
  merchant: string
  normalizedMerchant: string
  categoryId: string
  createdAt: string
  updatedAt: string
}

export type PlannedPaymentFrequency = 'weekly' | 'monthly' | 'yearly'

export interface PlannedPayment {
  id: string
  name: string
  amountCents: number
  categoryId: string
  paymentMethodId: string
  frequency: PlannedPaymentFrequency
  nextDueOn: string
  active: boolean
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
  source: z.enum(['manual', 'payroll', 'planned', 'automation']).default('manual'),
})

export type TransactionDraft = z.infer<typeof transactionDraftSchema>

export const normalizeMerchant = (merchant: string) => merchant.trim() || 'Movimiento manual'

export const normalizeMerchantKey = (merchant: string) =>
  merchant
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

export const merchantRuleSchema = z.object({
  merchant: z.string().trim().min(2).max(80),
  categoryId: z.string().min(1),
})

export const plannedPaymentDraftSchema = z.object({
  name: z.string().trim().min(2).max(80),
  amountCents: z.number().int().positive(),
  categoryId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type PlannedPaymentDraft = z.infer<typeof plannedPaymentDraftSchema>

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
  theme: 'dark',
  highContrast: false,
  onboardingCompleted: false,
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

const formatIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const getCycleBounds = (cycleId: string, resetDay = 1) => {
  const [year, month] = cycleId.split('-').map(Number)
  const dates = Array.from({ length: 7 }, (_, index) => {
    const nominalMonth = new Date(year, month - 4 + index, 1)
    return getPaydayDate(nominalMonth.getFullYear(), nominalMonth.getMonth(), resetDay)
  })
    .filter((date, index, values) => index === 0 || date.getTime() !== values[index - 1]?.getTime())
    .sort((first, second) => first.getTime() - second.getTime())

  const closingIndex = dates.findIndex((payday) => {
    const finalCycleDay = new Date(payday)
    finalCycleDay.setDate(finalCycleDay.getDate() - 1)
    return `${finalCycleDay.getFullYear()}-${String(finalCycleDay.getMonth() + 1).padStart(2, '0')}` === cycleId
  })
  const closingPayday = dates[closingIndex]
  const openingPayday = closingIndex > 0 ? dates[closingIndex - 1] : undefined

  if (!closingPayday || !openingPayday) {
    return null
  }

  const end = new Date(closingPayday)
  end.setDate(end.getDate() - 1)
  return { start: formatIsoDate(openingPayday), end: formatIsoDate(end) }
}

export const addFrequencyToDate = (occurredOn: string, frequency: PlannedPaymentFrequency) => {
  const date = new Date(`${occurredOn}T12:00:00`)
  if (frequency === 'weekly') date.setDate(date.getDate() + 7)
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1)
  if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const isPotentialDuplicate = (
  candidate: Pick<Transaction, 'amountCents' | 'merchant' | 'paymentMethodId' | 'occurredOn' | 'type'>,
  transactions: Transaction[],
) => {
  const candidateDate = new Date(`${candidate.occurredOn}T12:00:00`).getTime()
  const merchant = normalizeMerchantKey(candidate.merchant)
  return transactions.some((transaction) => {
    const transactionDate = new Date(`${transaction.occurredOn}T12:00:00`).getTime()
    return (
      transaction.type === candidate.type &&
      transaction.amountCents === candidate.amountCents &&
      transaction.paymentMethodId === candidate.paymentMethodId &&
      normalizeMerchantKey(transaction.merchant) === merchant &&
      Math.abs(transactionDate - candidateDate) <= 86_400_000
    )
  })
}
