import Dexie, { type Table } from 'dexie'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SETTINGS,
  getCycleId,
  getPaydayDate,
  type AppSettings,
  type Category,
  type PaymentMethod,
  type Transaction,
  type TransactionDraft,
} from './finance'

class SimpleFinanceDatabase extends Dexie {
  paymentMethods!: Table<PaymentMethod, string>
  categories!: Table<Category, string>
  transactions!: Table<Transaction, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('simple-finance')
    this.version(1).stores({
      paymentMethods: '&id, active, type',
      categories: '&id, active',
      transactions: '&id, occurredOn, type, paymentMethodId, categoryId, cycleId',
    })
    this.version(2).stores({
      paymentMethods: '&id, active, type',
      categories: '&id, active',
      transactions: '&id, occurredOn, type, paymentMethodId, categoryId, cycleId',
      settings: '&id',
    })
  }
}

export const db = new SimpleFinanceDatabase()

export const createLocalId = (
  randomUUID: (() => string) | null = globalThis.crypto?.randomUUID?.bind(globalThis.crypto) ?? null,
) => randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

export const ensureSeedData = async () => {
  const [methodCount, categoryCount, settings] = await Promise.all([
    db.paymentMethods.count(),
    db.categories.count(),
    db.settings.get(DEFAULT_SETTINGS.id),
  ])

  if (methodCount === 0) {
    await db.paymentMethods.bulkPut(DEFAULT_PAYMENT_METHODS)
  } else {
    const legacyMethodIds = await db.paymentMethods
      .filter((method) => (method as unknown as { type?: string }).type !== 'card')
      .primaryKeys()

    if (legacyMethodIds.length > 0) {
      await db.paymentMethods.bulkDelete(legacyMethodIds)
    }

    const hasMainCard = await db.paymentMethods.get('card-main')
    if (!hasMainCard) {
      await db.paymentMethods.add(DEFAULT_PAYMENT_METHODS[0])
    }
  }

  if (categoryCount > 0) {
    const legacyCategoryIds = await db.categories
      .filter((category) =>
        (category as unknown as { allowedTypes?: string[] }).allowedTypes?.includes('investment') ?? false,
      )
      .primaryKeys()
    if (legacyCategoryIds.length > 0) {
      await db.categories.bulkDelete(legacyCategoryIds)
    }
  }

  if ((await db.categories.count()) === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES)
  }

  const cards = await db.paymentMethods.filter((method) => method.active && method.type === 'card').toArray()
  const primaryCard = cards.find((method) => method.isPrimary) ?? cards.find((method) => method.id === 'card-main') ?? cards[0]
  if (primaryCard) {
    await db.transaction('rw', db.paymentMethods, async () => {
      await db.paymentMethods.toCollection().modify({ isPrimary: false })
      await db.paymentMethods.update(primaryCard.id, { isPrimary: true })
    })
  }

  if (!settings) {
    await db.settings.put(DEFAULT_SETTINGS)
  } else if (settings.paydayAmountCents === undefined || settings.suppressedPayrollCycleIds === undefined) {
    await db.settings.update(DEFAULT_SETTINGS.id, {
      paydayAmountCents: settings.paydayAmountCents ?? 0,
      suppressedPayrollCycleIds: settings.suppressedPayrollCycleIds ?? [],
    })
  }
}

export const listPaymentMethods = async () => {
  const methods = await db.paymentMethods
    .filter((method) => method.active && method.type === 'card')
    .toArray()

  return methods.sort((first, second) => {
    if (first.isPrimary) {
      return -1
    }
    if (second.isPrimary) {
      return 1
    }
    return first.name.localeCompare(second.name, 'es')
  })
}

export const listCategories = () => db.categories.filter((category) => category.active).toArray()

export const listTransactions = async () => {
  const transactions = (await db.transactions.toArray()).filter(
    (transaction) => (transaction as unknown as { type: string }).type !== 'investment',
  )
  return transactions.sort(
    (first, second) =>
      second.occurredOn.localeCompare(first.occurredOn) || second.createdAt.localeCompare(first.createdAt),
  )
}

export const createPaymentMethod = async (name: string) => {
  const paymentMethod: PaymentMethod = {
    id: createLocalId(),
    name,
    type: 'card',
    color: '#315f8f',
    active: true,
    isPrimary: false,
  }
  await db.paymentMethods.add(paymentMethod)
  return paymentMethod
}

export const createCategory = async (name: string) => {
  const category: Category = {
    id: createLocalId(),
    name,
    icon: 'CA',
    color: '#546f59',
    allowedTypes: ['expense', 'income'],
    active: true,
  }
  await db.categories.add(category)
  return category
}

export const updateCategoryLimit = async (categoryId: string, limitCents?: number) => {
  const category = await db.categories.get(categoryId)
  if (!category) {
    throw new Error('Categoría no encontrada.')
  }

  await db.categories.update(categoryId, { limitCents })
}

export const createTransaction = async (draft: TransactionDraft, resetDay = 1) => {
  const timestamp = new Date().toISOString()
  const transaction: Transaction = {
    ...draft,
    id: createLocalId(),
    cycleId: getCycleId(draft.occurredOn, resetDay),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.transactions.add(transaction)
  return transaction
}

export const updateTransaction = async (id: string, draft: TransactionDraft, resetDay = 1) => {
  const existing = await db.transactions.get(id)
  if (!existing) {
    throw new Error('Movimiento no encontrado.')
  }

  const updatedAt = new Date().toISOString()
  await db.transactions.update(id, {
    ...draft,
    source: existing.source ?? draft.source,
    cycleId: getCycleId(draft.occurredOn, resetDay),
    updatedAt,
  })
}

export const deleteTransaction = async (id: string) => {
  const transaction = await db.transactions.get(id)
  if (!transaction) {
    return
  }

  await db.transaction('rw', db.transactions, db.settings, async () => {
    await db.transactions.delete(id)
    if (transaction.source === 'payroll') {
      const settings = await getSettings()
      const suppressedPayrollCycleIds = [...new Set([...settings.suppressedPayrollCycleIds, transaction.cycleId])]
      await db.settings.put({ ...settings, suppressedPayrollCycleIds })
    }
  })
}

export const setPrimaryPaymentMethod = async (paymentMethodId: string) => {
  const paymentMethod = await db.paymentMethods.get(paymentMethodId)
  if (!paymentMethod || paymentMethod.type !== 'card' || !paymentMethod.active) {
    throw new Error('La tarjeta principal debe estar activa.')
  }

  await db.transaction('rw', db.paymentMethods, async () => {
    await db.paymentMethods.toCollection().modify({ isPrimary: false })
    await db.paymentMethods.update(paymentMethodId, { isPrimary: true })
  })
}

export const getSettings = async () => (await db.settings.get(DEFAULT_SETTINGS.id)) ?? DEFAULT_SETTINGS

export const savePaydaySettings = async (paydayDay: number, paydayAmountCents: number) => {
  const normalizedDay = Math.min(31, Math.max(1, Math.trunc(paydayDay)))
  await db.settings.put({
    id: DEFAULT_SETTINGS.id,
    paydayDay: normalizedDay,
    paydayAmountCents: Math.max(0, Math.trunc(paydayAmountCents)),
    suppressedPayrollCycleIds: (await getSettings()).suppressedPayrollCycleIds,
  })
}

const getMostRecentPayday = (today: Date, paydayDay: number) => {
  const currentPayday = getPaydayDate(today.getFullYear(), today.getMonth(), paydayDay)
  return today >= currentPayday
    ? currentPayday
    : getPaydayDate(today.getFullYear(), today.getMonth() - 1, paydayDay)
}

export const ensureScheduledPayroll = async (today = new Date()) => {
  const settings = await getSettings()
  if (settings.paydayAmountCents <= 0) {
    return false
  }

  const payday = getMostRecentPayday(today, settings.paydayDay)
  const occurredOn = `${payday.getFullYear()}-${String(payday.getMonth() + 1).padStart(2, '0')}-${String(
    payday.getDate(),
  ).padStart(2, '0')}`
  const cycleId = getCycleId(occurredOn, settings.paydayDay)
  if (settings.suppressedPayrollCycleIds.includes(cycleId)) {
    return false
  }
  const existingPayroll = await db.transactions
    .filter(
      (transaction) =>
        transaction.cycleId === cycleId &&
        (transaction as unknown as { source?: string }).source === 'payroll',
    )
    .first()

  if (existingPayroll) {
    return false
  }

  const [incomeCategory, cards] = await Promise.all([
    db.categories.get('income'),
    listPaymentMethods(),
  ])
  const primaryCard = cards.find((card) => card.isPrimary) ?? cards[0]
  if (!incomeCategory || !primaryCard) {
    return false
  }

  await createTransaction(
    {
      type: 'income',
      amountCents: settings.paydayAmountCents,
      merchant: 'Nómina',
      occurredOn,
      paymentMethodId: primaryCard.id,
      categoryId: incomeCategory.id,
      status: 'posted',
      source: 'payroll',
    },
    settings.paydayDay,
  )
  return true
}

export const clearLocalData = async () => {
  await db.transaction('rw', db.paymentMethods, db.categories, db.transactions, db.settings, async () => {
    await Promise.all([db.paymentMethods.clear(), db.categories.clear(), db.transactions.clear(), db.settings.clear()])
  })
}
