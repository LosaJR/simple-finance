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

export const ensureSeedData = async () => {
  const [methodCount, categoryCount] = await Promise.all([
    db.paymentMethods.count(),
    db.categories.count(),
  ])

  if (methodCount === 0) {
    await db.paymentMethods.bulkPut(DEFAULT_PAYMENT_METHODS)
  }

  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES)
  }
}

export const listPaymentMethods = () =>
  db.paymentMethods.filter((method) => method.active).toArray()

export const listCategories = () => db.categories.filter((category) => category.active).toArray()

export const listTransactions = () => db.transactions.orderBy('occurredOn').reverse().toArray()

export const createTransaction = async (draft: TransactionDraft) => {
  const timestamp = new Date().toISOString()
  const transaction: Transaction = {
    ...draft,
    id: crypto.randomUUID(),
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
