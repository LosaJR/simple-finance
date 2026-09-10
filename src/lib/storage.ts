import Dexie, { type Table } from 'dexie'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  getCycleId,
  type Category,
  type PaymentMethod,
  type Transaction,
  type TransactionDraft,
} from './finance'

class SimpleFinanceDatabase extends Dexie {
  paymentMethods!: Table<PaymentMethod, string>
  categories!: Table<Category, string>
  transactions!: Table<Transaction, string>

  constructor() {
    super('simple-finance')
    this.version(1).stores({
      paymentMethods: '&id, active, type',
      categories: '&id, active',
      transactions: '&id, occurredOn, type, paymentMethodId, categoryId, cycleId',
    })
  }
}

export const db = new SimpleFinanceDatabase()

export const createLocalId = (
  randomUUID: (() => string) | null = globalThis.crypto?.randomUUID?.bind(globalThis.crypto) ?? null,
) => randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

export const ensureSeedData = async () => {
  const [methodCount, categoryCount] = await Promise.all([db.paymentMethods.count(), db.categories.count()])

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

  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES)
  }
}

export const listPaymentMethods = async () => {
  const methods = await db.paymentMethods
    .filter((method) => method.active && method.type === 'card')
    .toArray()

  return methods.sort((first, second) => {
    if (first.id === 'card-main') {
      return -1
    }
    if (second.id === 'card-main') {
      return 1
    }
    return first.name.localeCompare(second.name, 'es')
  })
}

export const listCategories = () => db.categories.filter((category) => category.active).toArray()

export const listTransactions = async () => {
  const transactions = await db.transactions.toArray()
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
  }
  await db.paymentMethods.add(paymentMethod)
  return paymentMethod
}

export const createTransaction = async (draft: TransactionDraft) => {
  const timestamp = new Date().toISOString()
  const transaction: Transaction = {
    ...draft,
    id: createLocalId(),
    cycleId: getCycleId(draft.occurredOn),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.transactions.add(transaction)
  return transaction
}

export const clearLocalData = async () => {
  await db.transaction('rw', db.paymentMethods, db.categories, db.transactions, async () => {
    await Promise.all([db.paymentMethods.clear(), db.categories.clear(), db.transactions.clear()])
  })
}
