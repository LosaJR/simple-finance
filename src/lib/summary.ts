import {
  getCycleBounds,
  getCycleId,
  getPaydayDate,
  type ManualCycleClosure,
  type PaymentMethod,
  type Transaction,
} from './finance'

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

export const formatActivityDate = (occurredOn: string, createdAt: string) => {
  const time = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))

  return `${formatLocalDate(occurredOn)} · ${time}`
}

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

export const summarizeCurrentCycle = (transactions: Transaction[], resetDay = 1, today = new Date()) => {
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
  const currentCycleId = getCycleId(currentDate, resetDay)
  return transactions
    .filter((transaction) => getCycleId(transaction.occurredOn, resetDay) === currentCycleId)
    .reduce(
    (summary, transaction) => {
      if (transaction.type === 'expense') {
        summary.expenseCents += transaction.amountCents
      }
      if (transaction.type === 'income') {
        summary.incomeCents += transaction.amountCents
      }
      summary.netCents = summary.incomeCents - summary.expenseCents
      return summary
    },
    {
      expenseCents: 0,
      incomeCents: 0,
      netCents: 0,
    },
  )
}

export const getDaysUntilPayday = (paydayDay: number, today = new Date()) => {
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const currentPayday = getPaydayDate(today.getFullYear(), today.getMonth(), paydayDay)
  const nextPayday =
    currentDate <= currentPayday
      ? currentPayday
      : getPaydayDate(today.getFullYear(), today.getMonth() + 1, paydayDay)
  return Math.round((nextPayday.getTime() - currentDate.getTime()) / 86_400_000)
}

export const formatCycleRange = (cycleId: string, paydayDay: number, manualCycleClosures: ManualCycleClosure[] = []) => {
  const bounds = getCycleBounds(cycleId, paydayDay, manualCycleClosures)
  if (!bounds) return 'Intervalo de ciclo no disponible'
  return `Del ${formatLocalDate(bounds.start)} al ${formatLocalDate(bounds.end)}`
}

export type CategoryLimitStatus = 'normal' | 'attention' | 'near-limit' | 'exceeded'

export const summarizeCategoryLimit = (spentCents: number, limitCents: number) => {
  const ratio = limitCents > 0 ? spentCents / limitCents : 0
  const status: CategoryLimitStatus =
    ratio >= 1 ? 'exceeded' : ratio >= 0.9 ? 'near-limit' : ratio >= 0.75 ? 'attention' : 'normal'

  return {
    status,
    usedPercentage: Math.round(ratio * 100),
    trackPercentage: Math.min(Math.max(ratio * 100, 0), 100),
    remainingCents: Math.max(limitCents - spentCents, 0),
    excessCents: Math.max(spentCents - limitCents, 0),
  }
}

export const getDailyAvailableCents = (availableCents: number, daysUntilPayday: number) =>
  Math.trunc(availableCents / Math.max(daysUntilPayday, 1))

export const summarizeMonthlyHistory = (transactions: Transaction[]) => {
  const summaries = new Map<string, { expenseCents: number; incomeCents: number }>()

  for (const transaction of transactions) {
    const month = transaction.occurredOn.slice(0, 7)
    const summary = summaries.get(month) ?? { expenseCents: 0, incomeCents: 0 }
    if (transaction.type === 'expense') summary.expenseCents += transaction.amountCents
    if (transaction.type === 'income') summary.incomeCents += transaction.amountCents
    summaries.set(month, summary)
  }

  return [...summaries.entries()]
    .sort(([first], [second]) => second.localeCompare(first))
    .map(([month, summary]) => ({ month, ...summary }))
}

export const formatMonthYear = (month: string) =>
  new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    new Date(`${month}-01T12:00:00`),
  )

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
