import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  normalizeMerchant,
  type Category,
  type PaymentMethod,
  type Transaction,
  type TransactionDraft,
  transactionDraftSchema,
} from './lib/finance'
import {
  clearLocalData,
  createPaymentMethod,
  createTransaction,
  ensureSeedData,
  listCategories,
  listPaymentMethods,
  listTransactions,
} from './lib/storage'
import {
  formatActivityDate,
  formatCurrency,
  parseEuroToCents,
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

type ActivityTab = 'all' | 'expense' | 'income'
type AppScreen = 'home' | 'entry' | 'activity' | 'cards'

const activityTabs: { id: ActivityTab; label: string }[] = [
  { id: 'all', label: 'Global' },
  { id: 'expense', label: 'Gastos' },
  { id: 'income', label: 'Ingresos' },
]

const screens: { id: AppScreen; label: string; title: string }[] = [
  { id: 'home', label: 'Resumen', title: 'Control personal' },
  { id: 'entry', label: 'Registrar', title: 'Nuevo movimiento' },
  { id: 'activity', label: 'Actividad', title: 'Actividad' },
  { id: 'cards', label: 'Tarjetas', title: 'Tarjetas' },
]

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [draft, setDraft] = useState<TransactionDraft>(initialDraft)
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState('Datos guardados solo en este dispositivo.')
  const [isDark, setIsDark] = useState(false)
  const [activityTab, setActivityTab] = useState<ActivityTab>('all')
  const [screen, setScreen] = useState<AppScreen>('home')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')

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
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const methodMap = useMemo(
    () => new Map(paymentMethods.map((method) => [method.id, method])),
    [paymentMethods],
  )
  const visibleTransactions = useMemo(
    () =>
      activityTab === 'all'
        ? transactions
        : transactions.filter((transaction) => transaction.type === activityTab),
    [activityTab, transactions],
  )
  const currentScreen = screens.find((item) => item.id === screen) ?? screens[0]

  const navigateTo = (nextScreen: AppScreen) => {
    setScreen(nextScreen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amountCents = parseEuroToCents(amount)
    const parsed = transactionDraftSchema.safeParse({
      ...draft,
      amountCents,
      merchant: normalizeMerchant(draft.merchant),
      note: draft.note?.trim() || undefined,
    })

    if (!parsed.success) {
      setFeedback('Revisa el importe, la categoria y la tarjeta antes de guardar.')
      return
    }

    try {
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
    } catch {
      setFeedback('No se ha podido registrar el movimiento. Intentalo de nuevo.')
    }
  }

  const handleAddCard = async () => {
    const cardName = newCardName.trim()
    if (cardName.length < 2) {
      setFeedback('Escribe un nombre para la tarjeta.')
      return
    }

    try {
      const card = await createPaymentMethod(cardName)
      setDraft((current) => ({ ...current, paymentMethodId: card.id }))
      setNewCardName('')
      setIsAddingCard(false)
      setFeedback('Tarjeta añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la tarjeta. Intentalo de nuevo.')
    }
  }

  const handleResetDemoData = async () => {
    await clearLocalData()
    setFeedback('Datos locales reiniciados. No se ha enviado nada fuera del dispositivo.')
    await refreshData()
  }

  const renderTransactions = (items: Transaction[]) => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <strong>Sin movimientos todavia.</strong>
          <button className="text-button" type="button" onClick={() => navigateTo('entry')}>
            Registrar el primero
          </button>
        </div>
      )
    }

    return (
      <ul className="transaction-list">
        {items.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId)
          const method = methodMap.get(transaction.paymentMethodId)
          return (
            <li key={transaction.id}>
              <div>
                <span className="merchant">{transaction.merchant}</span>
                <span className="metadata">
                  {category?.name ?? 'Sin categoria'} · {method?.name ?? 'Sin tarjeta'} ·{' '}
                  {formatActivityDate(transaction.occurredOn, transaction.createdAt)}
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
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Simple Finance</p>
          <h1>{currentScreen.title}</h1>
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

      {screen === 'home' ? (
        <section className="screen-stack" aria-label="Resumen del ciclo actual">
          <section className="dashboard">
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
              <small>En este dispositivo.</small>
            </article>
          </section>

          <div className="home-actions">
            <button className="primary-action" type="button" onClick={() => navigateTo('entry')}>
              Registrar movimiento
            </button>
            <button className="secondary-action" type="button" onClick={() => navigateTo('activity')}>
              Ver actividad
            </button>
          </div>

          <section className="compact-panel" aria-label="Ultimos movimientos">
            <div className="section-title">
              <h2>Ultimos movimientos</h2>
              <button className="text-button" type="button" onClick={() => navigateTo('activity')}>
                Ver todos
              </button>
            </div>
            {renderTransactions(transactions.slice(0, 3))}
          </section>
        </section>
      ) : null}

      {screen === 'entry' ? (
        <form className="entry-panel screen-stack" onSubmit={handleSubmit}>
          <div className="section-title">
            <h2>Datos del movimiento</h2>
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
            Comercio o concepto (opcional)
            <input
              placeholder="Añádelo si no se ha detectado"
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
              Tarjeta utilizada
              <select
                value={draft.paymentMethodId}
                onChange={(event) => {
                  if (event.target.value === 'manage-cards') {
                    navigateTo('cards')
                    return
                  }
                  setDraft((current) => ({ ...current, paymentMethodId: event.target.value }))
                }}
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
                <option value="manage-cards">Añadir o gestionar tarjetas...</option>
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
      ) : null}

      {screen === 'activity' ? (
        <section className="activity-panel screen-stack" aria-label="Actividad">
          <div className="section-title">
            <h2>Todos los movimientos</h2>
            <button className="text-button" type="button" onClick={handleResetDemoData}>
              Reiniciar datos locales
            </button>
          </div>

          <div className="activity-tabs" role="tablist" aria-label="Filtro de actividad">
            {activityTabs.map((tab) => (
              <button
                key={tab.id}
                className={activityTab === tab.id ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={activityTab === tab.id}
                onClick={() => setActivityTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderTransactions(visibleTransactions)}
        </section>
      ) : null}

      {screen === 'cards' ? (
        <section className="cards-panel screen-stack" aria-label="Tarjetas">
          <div className="section-title">
            <div>
              <h2>Tus tarjetas</h2>
              <p>La principal siempre aparece primero.</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => setIsAddingCard((current) => !current)}
            >
              Añadir tarjeta
            </button>
          </div>

          {isAddingCard ? (
            <div className="card-creator">
              <label>
                Nombre de la tarjeta
                <input
                  autoFocus
                  placeholder="Tarjeta de viajes"
                  value={newCardName}
                  onChange={(event) => setNewCardName(event.target.value)}
                />
              </label>
              <button className="primary-action" type="button" onClick={handleAddCard}>
                Guardar tarjeta
              </button>
            </div>
          ) : null}

          <ul className="card-list">
            {paymentMethods.map((method) => (
              <li key={method.id}>
                <span className="card-swatch" style={{ backgroundColor: method.color }} aria-hidden="true" />
                <div>
                  <strong>{method.name}</strong>
                  <small>{method.id === 'card-main' ? 'Tarjeta principal' : 'Tarjeta activa'}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="bottom-nav" aria-label="Navegacion principal">
        {screens.map((item) => (
          <button
            key={item.id}
            className={screen === item.id ? 'active' : ''}
            type="button"
            aria-current={screen === item.id ? 'page' : undefined}
            onClick={() => navigateTo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
