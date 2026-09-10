import type { PaymentMethod, Transaction } from './finance'

export const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100)

export const formatLocalDate = (isoDate: string) =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${isoDate}T12:00:00`))

export const parseEuroToCents = (value: string) => {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  if (!normalized) {
    return 0
  }

  const amount = Number(normalized)
  if (!Number.isFinite(amount)) {
    return 0
  }

  return Math.round(amount * 100)
}

export const summarizeCurrentCycle = (transactions: Transaction[]) => {
  return transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === 'expense') {
        summary.expenseCents += transaction.amountCents
      }
      if (transaction.type === 'income') {
        summary.incomeCents += transaction.amountCents
      }
      if (transaction.type === 'investment') {
        summary.investmentCents += transaction.amountCents
      }
      summary.netCents = summary.incomeCents - summary.expenseCents - summary.investmentCents
      return summary
    },
    {
      expenseCents: 0,
      incomeCents: 0,
      investmentCents: 0,
      netCents: 0,
    },
  )
}

export const summarizeByMethod = (transactions: Transaction[], methods: PaymentMethod[]) => {
  return methods.map((method) => {
    const totalCents = transactions
      .filter((transaction) => transaction.paymentMethodId === method.id)
      .reduce((total, transaction) => {
        if (transaction.type === 'income') {
          return total + transaction.amountCents
        }
        return total - transaction.amountCents
      }, 0)

    return {
      method,
      totalCents,
    }
  })
}
