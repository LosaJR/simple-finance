import { describe, expect, it } from 'vitest'
import { addFrequencyToDate, getCycleBounds, getCycleId, getPaydayDate, isPotentialDuplicate, normalizeMerchant, type Transaction } from './finance'
import { createLocalId } from './storage'
import {
  formatActivityDate,
  formatCycleRange,
  getDailyAvailableCents,
  getDaysUntilPayday,
  parseEuroToCents,
  summarizeCategoryLimit,
  summarizeCurrentCycle,
  summarizeMonthlyHistory,
} from './summary'

describe('money parsing', () => {
  it('stores euros as integer cents', () => {
    expect(parseEuroToCents('34,90')).toBe(3490)
    expect(parseEuroToCents('1.234,56')).toBe(123456)
  })
})

describe('cycle ids', () => {
  it('uses the configured local reset day', () => {
    expect(getCycleId('2026-09-09', 10)).toBe('2026-09')
    expect(getCycleId('2026-09-10', 10)).toBe('2026-10')
  })

  it('moves a weekend payday to the next working day', () => {
    const payday = getPaydayDate(2026, 4, 31)
    expect([payday.getFullYear(), payday.getMonth(), payday.getDate()]).toEqual([2026, 5, 1])
    expect(getCycleId('2026-05-31', 31)).toBe('2026-05')
    expect(getCycleId('2026-06-01', 31)).toBe('2026-06')
  })
})

describe('financial summary', () => {
  it('calculates expenses and income', () => {
    const transactions: Transaction[] = [
      baseTransaction('expense', 3500),
      baseTransaction('income', 200000),
    ]

    expect(summarizeCurrentCycle(transactions)).toEqual({
      expenseCents: 3500,
      incomeCents: 200000,
      netCents: 196500,
    })
  })
})

describe('manual merchant fallback', () => {
  it('keeps manual entry available when no merchant was detected', () => {
    expect(normalizeMerchant('   ')).toBe('Movimiento manual')
  })

  it('uses the configured payday to choose the current cycle', () => {
    const transactions: Transaction[] = [
      { ...baseTransaction('expense', 1000), occurredOn: '2026-09-09' },
      { ...baseTransaction('expense', 2500), occurredOn: '2026-09-10' },
    ]

    expect(summarizeCurrentCycle(transactions, 10, new Date('2026-09-10T12:00:00'))).toMatchObject({
      expenseCents: 2500,
    })
  })
})

describe('payday and monthly history', () => {
  it('calculates days until the next configured payday', () => {
    expect(getDaysUntilPayday(15, new Date('2026-09-10T12:00:00'))).toBe(5)
    expect(getDaysUntilPayday(15, new Date('2026-09-15T12:00:00'))).toBe(0)
    expect(getDaysUntilPayday(15, new Date('2026-09-16T12:00:00'))).toBe(29)
    expect(getDaysUntilPayday(31, new Date('2026-05-31T12:00:00'))).toBe(1)
  })

  it('groups historical months with separate expense and income totals', () => {
    const transactions: Transaction[] = [
      { ...baseTransaction('expense', 1500), occurredOn: '2026-08-30' },
      { ...baseTransaction('income', 200000), occurredOn: '2026-08-31' },
      { ...baseTransaction('expense', 500), occurredOn: '2026-09-01' },
    ]

    expect(summarizeMonthlyHistory(transactions)).toEqual([
      { month: '2026-09', expenseCents: 500, incomeCents: 0 },
      { month: '2026-08', expenseCents: 1500, incomeCents: 200000 },
    ])
  })
})

describe('local identifiers', () => {
  it('creates an identifier when randomUUID is unavailable', () => {
    expect(createLocalId(null)).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
  })
})

describe('daily availability and category limits', () => {
  it('divides the estimated balance between the remaining days', () => {
    expect(getDailyAvailableCents(12500, 5)).toBe(2500)
    expect(getDailyAvailableCents(-12500, 5)).toBe(-2500)
    expect(getDailyAvailableCents(12500, 0)).toBe(12500)
  })

  it('describes the effective interval between two paydays', () => {
    expect(getCycleBounds('2026-09', 25)).toEqual({ start: '2026-08-25', end: '2026-09-24' })
    expect(formatCycleRange('2026-09', 25)).toBe('Del 25 ago al 24 sept')
  })

  it('marks category limits before and after the threshold', () => {
    expect(summarizeCategoryLimit(7400, 10000)).toMatchObject({
      status: 'normal',
      usedPercentage: 74,
      remainingCents: 2600,
    })
    expect(summarizeCategoryLimit(7500, 10000).status).toBe('attention')
    expect(summarizeCategoryLimit(9000, 10000).status).toBe('near-limit')
    expect(summarizeCategoryLimit(11200, 10000)).toMatchObject({
      status: 'exceeded',
      trackPercentage: 100,
      excessCents: 1200,
    })
  })
})

describe('daily safeguards', () => {
  it('spots likely duplicate manual entries without blocking distinct transactions', () => {
    const transaction = baseTransaction('expense', 1299)
    expect(isPotentialDuplicate(transaction, [transaction])).toBe(true)
    expect(isPotentialDuplicate({ ...transaction, amountCents: 1300 }, [transaction])).toBe(false)
  })

  it('moves a planned payment to its next local occurrence', () => {
    expect(addFrequencyToDate('2026-01-31', 'monthly')).toBe('2026-03-03')
    expect(addFrequencyToDate('2026-09-10', 'weekly')).toBe('2026-09-17')
  })
})

describe('activity dates', () => {
  it('combines the movement date with its recorded time', () => {
    expect(formatActivityDate('2026-09-10', '2026-09-10T14:30:00.000Z')).toContain('10 sept')
  })
})

const baseTransaction = (type: Transaction['type'], amountCents: number): Transaction => ({
  id: `${type}-${amountCents}`,
  type,
  amountCents,
  merchant: 'Test',
  occurredOn: '2026-09-10',
  paymentMethodId: 'card-main',
  categoryId: type,
  status: 'posted',
  cycleId: '2026-09',
  createdAt: '2026-09-10T10:00:00.000Z',
  updatedAt: '2026-09-10T10:00:00.000Z',
})
