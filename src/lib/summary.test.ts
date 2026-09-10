import { describe, expect, it } from 'vitest'
import { getCycleId, type Transaction } from './finance'
import { parseEuroToCents, summarizeCurrentCycle } from './summary'

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
