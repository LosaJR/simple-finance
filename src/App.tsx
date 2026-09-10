import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  type Category,
  type PaymentMethod,
  type Transaction,
  type TransactionDraft,
  transactionDraftSchema,
} from './lib/finance'
import {
  clearLocalData,
  createTransaction,
  ensureSeedData,
  listCategories,
  listPaymentMethods,
  listTransactions,
} from './lib/storage'
import {
  formatCurrency,
  formatLocalDate,
  parseEuroToCents,
  summarizeByMethod,
  summarizeCurrentCycle,
} from './lib/summary'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

const initialDraft: TransactionDraft = {
  type: 'expense',
  amountCents: 0,
  merchant: '',
  occurredOn: todayInputValue(),
  paymentMethodId: DEFAULT_PAYMENT_METHODS[0]?.id ?? '',
  categoryId: DEFAULT_CATEGORIES[0]?.id ?? '',
  note: '',
  status: 'posted',
}

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [draft, setDraft] = useState<TransactionDraft>(initialDraft)
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState('Datos guardados solo en este dispositivo.')
  const [isDark, setIsDark] = useState(false)

  const refreshData = async () => {
    await ensureSeedData()
    const [nextCategories, nextMethods, nextTransactions] = await Promise.all([
      listCategories(),
      listPaymentMethods(),
      listTransactions(),
    ])
    setCategories(nextCategories)
    setPaymentMethods(nextMethods)
    setTransactions(nextTransactions)
    setDraft((current) => ({
      ...current,
      categoryId: current.categoryId || nextCategories[0]?.id || '',
      paymentMethodId: current.paymentMethodId || nextMethods[0]?.id || '',
    }))
  }

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const cycleSummary = useMemo(() => summarizeCurrentCycle(transactions), [transactions])
  const methodSummary = useMemo(
    () => summarizeByMethod(transactions, paymentMethods),
    [paymentMethods, transactions],
  )

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const methodMap = useMemo(
    () => new Map(paymentMethods.map((method) => [method.id, method])),
    [paymentMethods],
  )

  const visibleTransactions = transactions.slice(0, 6)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amountCents = parseEuroToCents(amount)
    const parsed = transactionDraftSchema.safeParse({
      ...draft,
      amountCents,
      merchant: draft.merchant.trim(),
      note: draft.note?.trim() || undefined,
    })

    if (!parsed.success) {
      setFeedback('Revisa el importe, comercio, categoria y metodo antes de guardar.')
      return
    }

    await createTransaction(parsed.data)
    setFeedback('Movimiento registrado.')
    setAmount('')
    setDraft((current) => ({
      ...initialDraft,
      type: current.type,
      categoryId: current.categoryId,
      paymentMethodId: current.paymentMethodId,
      occurredOn: todayInputValue(),
    }))
    await refreshData()
  }

  const handleResetDemoData = async () => {
    await clearLocalData()
    setFeedback('Datos locales reiniciados. No se ha enviado nada fuera del dispositivo.')
    await refreshData()
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Simple Finance</p>
          <h1>Control personal</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
          title={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
          onClick={() => setIsDark((value) => !value)}
        >
          {isDark ? 'Luz' : 'Noche'}
        </button>
      </header>

      <section className="dashboard" aria-label="Resumen del ciclo actual">
        <article className="metric primary">
          <span>Ciclo actual</span>
          <strong>{formatCurrency(cycleSummary.netCents)}</strong>
          <small>
            {formatCurrency(cycleSummary.incomeCents)} ingresos ·{' '}
            {formatCurrency(cycleSummary.expenseCents)} gastos
          </small>
        </article>
        <article className="metric">
          <span>Invertido</span>
          <strong>{formatCurrency(cycleSummary.investmentCents)}</strong>
          <small>No cuenta como gasto.</small>
        </article>
        <article className="metric">
          <span>Movimientos</span>
          <strong>{transactions.length}</strong>
          <small>Persistidos en IndexedDB.</small>
        </article>
      </section>

      <section className="workspace">
        <form className="entry-panel" onSubmit={handleSubmit}>
          <div className="section-title">
            <h2>Nuevo movimiento</h2>
            <p>{feedback}</p>
          </div>

          <div className="segmented" aria-label="Tipo de movimiento">
            {(['expense', 'income', 'investment'] as const).map((type) => (
              <button
                key={type}
                className={draft.type === type ? 'active' : ''}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type }))}
              >
                {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Inversion'}
              </button>
            ))}
          </div>

          <label>
            Importe
            <input
              inputMode="decimal"
              placeholder="34,90"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label>
            Comercio o concepto
            <input
              placeholder="Supermercado"
              value={draft.merchant}
              onChange={(event) =>
                setDraft((current) => ({ ...current, merchant: event.target.value }))
              }
            />
          </label>

          <div className="field-grid">
            <label>
              Fecha
              <input
                type="date"
                value={draft.occurredOn}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, occurredOn: event.target.value }))
                }
              />
            </label>
            <label>
              Metodo
              <select
                value={draft.paymentMethodId}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, paymentMethodId: event.target.value }))
                }
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Categoria
            <select
              value={draft.categoryId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nota
            <textarea
              rows={3}
              placeholder="Opcional"
              value={draft.note ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
            />
          </label>

          <button className="primary-action" type="submit">
            Guardar movimiento
          </button>
        </form>

        <section className="activity-panel" aria-label="Actividad reciente">
          <div className="section-title">
            <h2>Actividad</h2>
            <button className="text-button" type="button" onClick={handleResetDemoData}>
              Reiniciar datos locales
            </button>
          </div>

          {visibleTransactions.length === 0 ? (
            <div className="empty-state">
              <strong>Sin movimientos todavia.</strong>
              <span>Registra el primero para ver el resumen por categoria y metodo.</span>
            </div>
          ) : (
            <ul className="transaction-list">
              {visibleTransactions.map((transaction) => {
                const category = categoryMap.get(transaction.categoryId)
                const method = methodMap.get(transaction.paymentMethodId)
                return (
                  <li key={transaction.id}>
                    <div>
                      <span className="merchant">{transaction.merchant}</span>
                      <span className="metadata">
                        {category?.name ?? 'Sin categoria'} · {method?.name ?? 'Sin metodo'} ·{' '}
                        {formatLocalDate(transaction.occurredOn)}
                      </span>
                    </div>
                    <strong className={transaction.type}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amountCents)}
                    </strong>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </section>

      <section className="method-strip" aria-label="Resumen por metodo de pago">
        {methodSummary.map((item) => (
          <article key={item.method.id}>
            <span style={{ backgroundColor: item.method.color }} aria-hidden="true" />
            <div>
              <strong>{item.method.name}</strong>
              <small>{item.method.type}</small>
            </div>
            <b>{formatCurrency(item.totalCents)}</b>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
