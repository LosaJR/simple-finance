import Dexie, { type Table } from 'dexie'
import { z } from 'zod'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SETTINGS,
  getCycleId,
  getPaydayDate,
  type AppSettings,
  type Category,
  type MerchantRule,
  type PaymentMethod,
  type PlannedPayment,
  type PlannedPaymentDraft,
  type Transaction,
  type TransactionDraft,
} from './finance'

class SimpleFinanceDatabase extends Dexie {
  paymentMethods!: Table<PaymentMethod, string>
  categories!: Table<Category, string>
  transactions!: Table<Transaction, string>
  settings!: Table<AppSettings, string>
  merchantRules!: Table<MerchantRule, string>
  plannedPayments!: Table<PlannedPayment, string>

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
    this.version(3).stores({
      paymentMethods: '&id, active, type',
      categories: '&id, active',
      transactions: '&id, occurredOn, type, paymentMethodId, categoryId, cycleId, status',
      settings: '&id',
      merchantRules: '&id, normalizedMerchant, categoryId',
      plannedPayments: '&id, nextDueOn, active, categoryId, paymentMethodId',
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
  } else if (
    settings.paydayAmountCents === undefined ||
    settings.suppressedPayrollCycleIds === undefined ||
    settings.theme === undefined ||
    settings.highContrast === undefined ||
    settings.onboardingCompleted === undefined
  ) {
    await db.settings.update(DEFAULT_SETTINGS.id, {
      paydayAmountCents: settings.paydayAmountCents ?? 0,
      suppressedPayrollCycleIds: settings.suppressedPayrollCycleIds ?? [],
      theme: settings.theme ?? 'dark',
      highContrast: settings.highContrast ?? false,
      onboardingCompleted: settings.onboardingCompleted ?? true,
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

export const listMerchantRules = () => db.merchantRules.orderBy('normalizedMerchant').toArray()

export const listPlannedPayments = () => db.plannedPayments.orderBy('nextDueOn').toArray()

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

export const updatePaymentMethodName = async (paymentMethodId: string, name: string) => {
  if (name.trim().length < 2) throw new Error('El nombre debe tener al menos dos caracteres.')
  await db.paymentMethods.update(paymentMethodId, { name: name.trim() })
}

export const archivePaymentMethod = async (paymentMethodId: string) => {
  const method = await db.paymentMethods.get(paymentMethodId)
  if (!method || method.isPrimary) throw new Error('La tarjeta principal no se puede archivar.')
  await db.paymentMethods.update(paymentMethodId, { active: false })
}

export const updateCategory = async (categoryId: string, changes: Pick<Category, 'name' | 'color' | 'icon'>) => {
  if (changes.name.trim().length < 2) throw new Error('El nombre debe tener al menos dos caracteres.')
  await db.categories.update(categoryId, { ...changes, name: changes.name.trim() })
}

export const archiveCategory = async (categoryId: string) => {
  const category = await db.categories.get(categoryId)
  if (!category) throw new Error('Categoría no encontrada.')
  const activeSameType = await db.categories
    .filter((item) => item.active && item.id !== categoryId && item.allowedTypes.some((type) => category.allowedTypes.includes(type)))
    .count()
  if (activeSameType === 0) throw new Error('Mantén al menos una categoría disponible para este tipo de movimiento.')
  await db.categories.update(categoryId, { active: false })
}

export const updateCategoryLimit = async (categoryId: string, limitCents?: number) => {
  const category = await db.categories.get(categoryId)
  if (!category) {
    throw new Error('Categoría no encontrada.')
  }

  await db.categories.update(categoryId, { limitCents })
}

export const createMerchantRule = async (merchant: string, categoryId: string) => {
  const normalizedMerchant = merchant
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
  const existing = await db.merchantRules.where('normalizedMerchant').equals(normalizedMerchant).first()
  const timestamp = new Date().toISOString()
  if (existing) {
    await db.merchantRules.update(existing.id, { merchant: merchant.trim(), categoryId, updatedAt: timestamp })
    return { ...existing, merchant: merchant.trim(), categoryId, updatedAt: timestamp }
  }
  const rule: MerchantRule = { id: createLocalId(), merchant: merchant.trim(), normalizedMerchant, categoryId, createdAt: timestamp, updatedAt: timestamp }
  await db.merchantRules.add(rule)
  return rule
}

export const deleteMerchantRule = (ruleId: string) => db.merchantRules.delete(ruleId)

export const createPlannedPayment = async (draft: PlannedPaymentDraft) => {
  const timestamp = new Date().toISOString()
  const payment: PlannedPayment = { ...draft, id: createLocalId(), active: true, createdAt: timestamp, updatedAt: timestamp }
  await db.plannedPayments.add(payment)
  return payment
}

export const togglePlannedPayment = async (paymentId: string, active: boolean) => {
  await db.plannedPayments.update(paymentId, { active, updatedAt: new Date().toISOString() })
}

export const deletePlannedPayment = (paymentId: string) => db.plannedPayments.delete(paymentId)

export const recordPlannedPayment = async (payment: PlannedPayment, resetDay = 1) => {
  const transaction = await createTransaction(
    {
      type: 'expense', amountCents: payment.amountCents, merchant: payment.name, occurredOn: payment.nextDueOn,
      paymentMethodId: payment.paymentMethodId, categoryId: payment.categoryId, status: 'posted', source: 'planned',
    },
    resetDay,
  )
  await db.plannedPayments.update(payment.id, {
    nextDueOn: addFrequency(payment.nextDueOn, payment.frequency), updatedAt: new Date().toISOString(),
  })
  return transaction
}

const addFrequency = (occurredOn: string, frequency: PlannedPayment['frequency']) => {
  const date = new Date(`${occurredOn}T12:00:00`)
  if (frequency === 'weekly') date.setDate(date.getDate() + 7)
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1)
  if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
    ...(await getSettings()),
    paydayDay: normalizedDay,
    paydayAmountCents: Math.max(0, Math.trunc(paydayAmountCents)),
  })
}

export const savePreferences = async (preferences: Pick<AppSettings, 'theme' | 'highContrast' | 'onboardingCompleted'>) => {
  await db.settings.put({ ...(await getSettings()), ...preferences })
}

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  paymentMethods: z.array(z.object({ id: z.string(), name: z.string(), type: z.literal('card'), color: z.string(), lastFour: z.string().optional(), active: z.boolean(), isPrimary: z.boolean() })),
  categories: z.array(z.object({ id: z.string(), name: z.string(), icon: z.string(), color: z.string(), allowedTypes: z.array(z.enum(['expense', 'income'])), limitCents: z.number().int().optional(), active: z.boolean() })),
  transactions: z.array(z.object({ id: z.string(), type: z.enum(['expense', 'income']), amountCents: z.number().int().positive(), merchant: z.string(), occurredOn: z.string(), paymentMethodId: z.string(), categoryId: z.string(), status: z.enum(['posted', 'pending']), source: z.enum(['manual', 'payroll', 'planned', 'automation']).optional(), cycleId: z.string(), createdAt: z.string(), updatedAt: z.string() })),
  settings: z.object({ id: z.literal('app-settings'), paydayDay: z.number().int(), paydayAmountCents: z.number().int(), suppressedPayrollCycleIds: z.array(z.string()), theme: z.enum(['dark', 'light']), highContrast: z.boolean(), onboardingCompleted: z.boolean() }),
  merchantRules: z.array(z.object({ id: z.string(), merchant: z.string(), normalizedMerchant: z.string(), categoryId: z.string(), createdAt: z.string(), updatedAt: z.string() })),
  plannedPayments: z.array(z.object({ id: z.string(), name: z.string(), amountCents: z.number().int().positive(), categoryId: z.string(), paymentMethodId: z.string(), frequency: z.enum(['weekly', 'monthly', 'yearly']), nextDueOn: z.string(), active: z.boolean(), createdAt: z.string(), updatedAt: z.string() })),
})

export const exportLocalBackup = async () => ({
  version: 1 as const,
  exportedAt: new Date().toISOString(),
  paymentMethods: await db.paymentMethods.toArray(),
  categories: await db.categories.toArray(),
  transactions: await db.transactions.toArray(),
  settings: await getSettings(),
  merchantRules: await db.merchantRules.toArray(),
  plannedPayments: await db.plannedPayments.toArray(),
})

export const restoreLocalBackup = async (rawBackup: unknown) => {
  const backup = backupSchema.parse(rawBackup)
  await db.transaction('rw', [db.paymentMethods, db.categories, db.transactions, db.settings, db.merchantRules, db.plannedPayments], async () => {
    await Promise.all([db.paymentMethods.clear(), db.categories.clear(), db.transactions.clear(), db.settings.clear(), db.merchantRules.clear(), db.plannedPayments.clear()])
    await Promise.all([
      db.paymentMethods.bulkPut(backup.paymentMethods),
      db.categories.bulkPut(backup.categories),
      db.transactions.bulkPut(backup.transactions),
      db.settings.put(backup.settings),
      db.merchantRules.bulkPut(backup.merchantRules),
      db.plannedPayments.bulkPut(backup.plannedPayments),
    ])
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
  await db.transaction('rw', [db.paymentMethods, db.categories, db.transactions, db.settings, db.merchantRules, db.plannedPayments], async () => {
    await Promise.all([db.paymentMethods.clear(), db.categories.clear(), db.transactions.clear(), db.settings.clear(), db.merchantRules.clear(), db.plannedPayments.clear()])
  })
}
