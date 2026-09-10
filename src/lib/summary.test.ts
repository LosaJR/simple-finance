import { describe, expect, it } from 'vitest'
import { getCycleId, normalizeMerchant, type Transaction } from './finance'
import { createLocalId } from './storage'
import {
  formatActivityDate,
  getDaysUntilPayday,
  parseEuroToCents,
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
    expect(getCycleId('2026-09-09', 10)).toBe('2026-08')
    expect(getCycleId('2026-09-10', 10)).toBe('2026-09')
  })
})

describe('financial summary', () => {
  it('keeps investments separate from expenses', () => {
    const transactions: Transaction[] = [
      baseTransaction('expense', 3500),
      baseTransaction('income', 200000),
      baseTransaction('investment', 50000),
    ]

    expect(summarizeCurrentCycle(transactions)).toEqual({
      expenseCents: 3500,
      incomeCents: 200000,
      investmentCents: 50000,
      netCents: 146500,
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
  })

  it('groups historical months with separate expense and income totals', () => {
    const transactions: Transaction[] = [
      { ...baseTransaction('expense', 1500), occurredOn: '2026-08-30' },
      { ...baseTransaction('income', 200000), occurredOn: '2026-08-31' },
      { ...baseTransaction('expense', 500), occurredOn: '2026-09-01' },
    ]

    expect(summarizeMonthlyHistory(transactions)).toEqual([
      { month: '2026-09', expenseCents: 500, incomeCents: 0, investmentCents: 0 },
      { month: '2026-08', expenseCents: 1500, incomeCents: 200000, investmentCents: 0 },
    ])
  })
})

describe('local identifiers', () => {
  it('creates an identifier when randomUUID is unavailable', () => {
    expect(createLocalId(null)).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
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
