import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  CirclePlus,
  CreditCard,
  LayoutDashboard,
  ListFilter,
  Pencil,
  Plus,
  ReceiptText,
  Settings2,
  Tags,
  Trash2,
  WalletCards,
} from 'lucide-react'
import './App.css'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  getCycleId,
  normalizeMerchant,
  type Category,
  type PaymentMethod,
  type Transaction,
  type TransactionDraft,
  transactionDraftSchema,
} from './lib/finance'
import {
  createPaymentMethod,
  createCategory,
  createTransaction,
  deleteTransaction,
  ensureSeedData,
  ensureScheduledPayroll,
  getSettings,
  listCategories,
  listPaymentMethods,
  listTransactions,
  savePaydaySettings,
  setPrimaryPaymentMethod,
  updateTransaction,
} from './lib/storage'
import {
  formatActivityDate,
  formatCurrency,
  getDaysUntilPayday,
  parseEuroToCents,
  summarizeCurrentCycle,
} from './lib/summary'

const todayInputValue = () => {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

const initialDraft: TransactionDraft = {
  type: 'expense',
  amountCents: 0,
  merchant: '',
  occurredOn: todayInputValue(),
  paymentMethodId: DEFAULT_PAYMENT_METHODS[0]?.id ?? '',
  categoryId: DEFAULT_CATEGORIES[0]?.id ?? '',
  status: 'posted',
  source: 'manual',
}

type ActivityTab = 'all' | 'expense' | 'income'
type AppScreen = 'home' | 'entry' | 'activity' | 'cards'
type QuickType = 'expense' | 'income'
type QuickStep = 'type' | 'amount' | 'merchant' | 'category'

const activityTabs: { id: ActivityTab; label: string }[] = [
  { id: 'all', label: 'Global' },
  { id: 'expense', label: 'Gastos' },
  { id: 'income', label: 'Ingresos' },
]

const screens: { id: AppScreen; label: string; title: string; icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Resumen', title: 'Control personal', icon: LayoutDashboard },
  { id: 'entry', label: 'Registrar', title: 'Nuevo movimiento', icon: CirclePlus },
  { id: 'activity', label: 'Actividad', title: 'Actividad', icon: ListFilter },
  { id: 'cards', label: 'Configuración', title: 'Configuración', icon: Settings2 },
]

const quickSteps: QuickStep[] = ['type', 'amount', 'merchant', 'category']

const formatAmountInput = (amountCents: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amountCents / 100,
  )

const formatCycleLabel = (cycleId: string) =>
  new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(new Date(`${cycleId}-01T12:00:00`))
    .replace('.', '')

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [draft, setDraft] = useState<TransactionDraft>(initialDraft)
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState('Datos guardados solo en este dispositivo.')
  const [homeFeedback, setHomeFeedback] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [activityTab, setActivityTab] = useState<ActivityTab>('all')
  const [activityPaymentMethodId, setActivityPaymentMethodId] = useState('all')
  const [activityCycleId, setActivityCycleId] = useState<string | null>(null)
  const [screen, setScreen] = useState<AppScreen>('home')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [paydayDay, setPaydayDay] = useState(1)
  const [paydayAmount, setPaydayAmount] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsPaydayDay, setSettingsPaydayDay] = useState(1)
  const [settingsPaydayAmount, setSettingsPaydayAmount] = useState('')
  const [settingsFeedback, setSettingsFeedback] = useState('')
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false)
  const [quickStep, setQuickStep] = useState<QuickStep>('type')
  const [quickType, setQuickType] = useState<QuickType>('expense')
  const [quickAmount, setQuickAmount] = useState('')
  const [quickMerchant, setQuickMerchant] = useState('')
  const [quickCategoryId, setQuickCategoryId] = useState('')
  const [quickFeedback, setQuickFeedback] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editDraft, setEditDraft] = useState<TransactionDraft | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editFeedback, setEditFeedback] = useState('')
  const [openTransactionId, setOpenTransactionId] = useState<string | null>(null)
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
  const swipeStart = useRef<{ id: string; x: number } | null>(null)

  const refreshData = async () => {
    await ensureSeedData()
    await ensureScheduledPayroll()
    const [nextCategories, nextMethods, nextTransactions, nextSettings] = await Promise.all([
      listCategories(),
      listPaymentMethods(),
      listTransactions(),
      getSettings(),
    ])
    const primary = nextMethods.find((method) => method.isPrimary) ?? nextMethods[0]
    setCategories(nextCategories)
    setPaymentMethods(nextMethods)
    setTransactions(nextTransactions)
    setPaydayDay(nextSettings.paydayDay)
    setPaydayAmount(nextSettings.paydayAmountCents ? formatAmountInput(nextSettings.paydayAmountCents) : '')
    setDraft((current) => ({
      ...current,
      categoryId: current.categoryId || nextCategories[0]?.id || '',
      paymentMethodId: current.paymentMethodId || primary?.id || '',
    }))
    setSelectedCardId((current) => current || primary?.id || '')
    setSelectedCategoryId((current) => current || nextCategories[0]?.id || '')
  }

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const primaryCard = useMemo(
    () => paymentMethods.find((method) => method.isPrimary) ?? paymentMethods[0],
    [paymentMethods],
  )
  const selectedCard = useMemo(
    () => paymentMethods.find((method) => method.id === selectedCardId) ?? primaryCard,
    [paymentMethods, primaryCard, selectedCardId],
  )
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? categories[0],
    [categories, selectedCategoryId],
  )
  const cycleSummary = useMemo(
    () => summarizeCurrentCycle(transactions, paydayDay),
    [paydayDay, transactions],
  )
  const daysUntilPayday = useMemo(() => getDaysUntilPayday(paydayDay), [paydayDay])
  const monthlyCalendar = useMemo(() => {
    const year = new Date().getFullYear()
    const summaries = new Map<string, { expenseCents: number; incomeCents: number }>()
    for (const transaction of transactions) {
      const cycleId = getCycleId(transaction.occurredOn, paydayDay)
      const summary = summaries.get(cycleId) ?? { expenseCents: 0, incomeCents: 0 }
      if (transaction.type === 'expense') summary.expenseCents += transaction.amountCents
      if (transaction.type === 'income') summary.incomeCents += transaction.amountCents
      summaries.set(cycleId, summary)
    }
    return Array.from({ length: 12 }, (_, month) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`
      const summary = summaries.get(key)
      return {
        cycleId: key,
        label: formatCycleLabel(key),
        expenseCents: summary?.expenseCents ?? 0,
        incomeCents: summary?.incomeCents ?? 0,
      }
    })
  }, [paydayDay, transactions])
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
      transactions.filter(
        (transaction) =>
          (activityTab === 'all' || transaction.type === activityTab) &&
          (activityPaymentMethodId === 'all' || transaction.paymentMethodId === activityPaymentMethodId) &&
          (activityCycleId === null || getCycleId(transaction.occurredOn, paydayDay) === activityCycleId),
      ),
    [activityCycleId, activityPaymentMethodId, activityTab, paydayDay, transactions],
  )
  const quickCategories = useMemo(
    () => categories.filter((category) => category.allowedTypes.includes(quickType)),
    [categories, quickType],
  )
  const currentScreen = screens.find((item) => item.id === screen) ?? screens[0]
  const quickStepIndex = quickSteps.indexOf(quickStep)

  const navigateTo = (nextScreen: AppScreen) => {
    setScreen(nextScreen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseQuickType = (type: QuickType) => {
    setQuickType(type)
    setQuickCategoryId(categories.find((category) => category.allowedTypes.includes(type))?.id ?? '')
    setQuickStep('amount')
  }

  const openQuickEntry = () => {
    setQuickType('expense')
    setQuickAmount('')
    setQuickMerchant('')
    setQuickCategoryId(categories.find((category) => category.allowedTypes.includes('expense'))?.id ?? '')
    setQuickFeedback('')
    setQuickStep('type')
    setIsQuickEntryOpen(true)
  }

  const closeQuickEntry = () => {
    setIsQuickEntryOpen(false)
    setQuickFeedback('')
  }

  const handleQuickSave = async () => {
    const parsed = transactionDraftSchema.safeParse({
      ...initialDraft,
      type: quickType,
      amountCents: parseEuroToCents(quickAmount),
      merchant: normalizeMerchant(quickMerchant),
      occurredOn: todayInputValue(),
      paymentMethodId: primaryCard?.id ?? '',
      categoryId: quickCategoryId,
    })

    if (!parsed.success) {
      setQuickFeedback('Revisa el importe y la categoría.')
      return
    }

    try {
      await createTransaction(parsed.data, paydayDay)
      await refreshData()
      closeQuickEntry()
      setHomeFeedback(`Movimiento registrado con ${primaryCard?.name ?? 'la tarjeta principal'}.`)
    } catch {
      setQuickFeedback('No se ha podido registrar el movimiento. Inténtalo de nuevo.')
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = transactionDraftSchema.safeParse({
      ...draft,
      amountCents: parseEuroToCents(amount),
      merchant: normalizeMerchant(draft.merchant),
    })

    if (!parsed.success) {
      setFeedback('Revisa el importe, la categoría y la tarjeta antes de guardar.')
      return
    }

    try {
      await createTransaction(parsed.data, paydayDay)
      setFeedback('Movimiento registrado.')
      setAmount('')
      setDraft((current) => ({
        ...initialDraft,
        type: current.type,
        categoryId: current.categoryId,
        paymentMethodId: primaryCard?.id ?? '',
        occurredOn: todayInputValue(),
      }))
      await refreshData()
    } catch {
      setFeedback('No se ha podido registrar el movimiento. Inténtalo de nuevo.')
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
      setSelectedCardId(card.id)
      setNewCardName('')
      setIsAddingCard(false)
      setFeedback('Tarjeta añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la tarjeta. Inténtalo de nuevo.')
    }
  }

  const handleAddCategory = async () => {
    const categoryName = newCategoryName.trim()
    if (categoryName.length < 2) {
      setFeedback('Escribe un nombre para la categoría.')
      return
    }

    try {
      const category = await createCategory(categoryName)
      setSelectedCategoryId(category.id)
      setNewCategoryName('')
      setIsAddingCategory(false)
      setFeedback('Categoría añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la categoría.')
    }
  }

  const handleSetPrimaryCard = async (paymentMethodId: string) => {
    try {
      await setPrimaryPaymentMethod(paymentMethodId)
      setDraft((current) => ({ ...current, paymentMethodId }))
      setFeedback('Tarjeta principal actualizada.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido actualizar la tarjeta principal.')
    }
  }

  const openSettings = () => {
    setSettingsPaydayDay(paydayDay)
    setSettingsPaydayAmount(paydayAmount)
    setSettingsFeedback('')
    setIsSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    if (!Number.isInteger(settingsPaydayDay) || settingsPaydayDay < 1 || settingsPaydayDay > 31) {
      setSettingsFeedback('Elige un día entre 1 y 31.')
      return
    }

    const paydayAmountCents = parseEuroToCents(settingsPaydayAmount)
    await savePaydaySettings(settingsPaydayDay, paydayAmountCents)
    setPaydayDay(settingsPaydayDay)
    setPaydayAmount(settingsPaydayAmount)
    await refreshData()
    setSettingsFeedback(
      paydayAmountCents > 0 ? 'Nómina configurada.' : 'Día guardado. Añade una cantidad para automatizar la nómina.',
    )
  }

  const openTransactionEditor = (transaction: Transaction) => {
    setOpenTransactionId(null)
    setSwipeOffsets({})
    setEditingTransaction(transaction)
    setEditAmount(formatAmountInput(transaction.amountCents))
    setEditDraft({
      type: transaction.type,
      amountCents: transaction.amountCents,
      merchant: transaction.merchant === 'Movimiento manual' ? '' : transaction.merchant,
      occurredOn: transaction.occurredOn,
      paymentMethodId: transaction.paymentMethodId,
      categoryId: transaction.categoryId,
      status: transaction.status,
      source: transaction.source ?? 'manual',
    })
    setEditFeedback('')
  }

  const handleSaveEditedTransaction = async () => {
    if (!editingTransaction || !editDraft) {
      return
    }

    const parsed = transactionDraftSchema.safeParse({
      ...editDraft,
      amountCents: parseEuroToCents(editAmount),
      merchant: normalizeMerchant(editDraft.merchant),
    })
    if (!parsed.success) {
      setEditFeedback('Revisa el importe y la categoría.')
      return
    }

    try {
      await updateTransaction(editingTransaction.id, parsed.data, paydayDay)
      setEditingTransaction(null)
      setEditDraft(null)
      setFeedback('Movimiento actualizado.')
      await refreshData()
    } catch {
      setEditFeedback('No se ha podido actualizar el movimiento.')
    }
  }

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`¿Eliminar ${transaction.merchant}?`)) {
      return
    }

    try {
      await deleteTransaction(transaction.id)
      setOpenTransactionId(null)
      setSwipeOffsets({})
      setHomeFeedback('Movimiento eliminado.')
      await refreshData()
    } catch {
      setHomeFeedback('No se ha podido eliminar el movimiento.')
    }
  }

  const handleSwipeStart = (transactionId: string, clientX: number) => {
    swipeStart.current = { id: transactionId, x: clientX }
  }

  const handleSwipeMove = (transactionId: string, clientX: number) => {
    if (swipeStart.current?.id !== transactionId) {
      return
    }
    const offset = Math.max(-128, Math.min(0, clientX - swipeStart.current.x))
    setSwipeOffsets({ [transactionId]: offset })
  }

  const handleSwipeEnd = (transactionId: string) => {
    const offset = swipeOffsets[transactionId] ?? 0
    setOpenTransactionId(offset <= -64 ? transactionId : null)
    setSwipeOffsets({})
    swipeStart.current = null
  }

  const renderTransactions = (items: Transaction[], swipeable = false) => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <strong>Sin movimientos todavía.</strong>
          <button className="text-button" type="button" onClick={openQuickEntry}>
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
            <li key={transaction.id} className={swipeable ? 'swipe-row' : undefined}>
              {swipeable ? (
                <div className="swipe-actions" aria-hidden={openTransactionId !== transaction.id}>
                  <button
                    className="swipe-action edit"
                    type="button"
                    tabIndex={openTransactionId === transaction.id ? 0 : -1}
                    aria-label={`Editar ${transaction.merchant}`}
                    title="Editar movimiento"
                    onClick={() => openTransactionEditor(transaction)}
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                  <button
                    className="swipe-action delete"
                    type="button"
                    tabIndex={openTransactionId === transaction.id ? 0 : -1}
                    aria-label={`Eliminar ${transaction.merchant}`}
                    title="Eliminar movimiento"
                    onClick={() => void handleDeleteTransaction(transaction)}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              <div
                className={swipeable ? 'swipe-content' : undefined}
                style={
                  swipeable
                    ? { transform: `translateX(${swipeOffsets[transaction.id] ?? (openTransactionId === transaction.id ? -128 : 0)}px)` }
                    : undefined
                }
                onPointerDown={swipeable ? (event) => handleSwipeStart(transaction.id, event.clientX) : undefined}
                onPointerMove={swipeable ? (event) => handleSwipeMove(transaction.id, event.clientX) : undefined}
                onPointerUp={swipeable ? () => handleSwipeEnd(transaction.id) : undefined}
                onPointerCancel={swipeable ? () => handleSwipeEnd(transaction.id) : undefined}
              >
                <div>
                <span className="merchant">{transaction.merchant}</span>
                <span className="metadata">
                  {category?.name ?? 'Sin categoría'} · {method?.name ?? 'Sin tarjeta'} ·{' '}
                  {formatActivityDate(transaction.occurredOn, transaction.createdAt)}
                </span>
              </div>
              <strong className={transaction.type}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amountCents)}
              </strong>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <main className={`shell ${screen === 'home' ? 'home-shell' : screen === 'entry' ? 'entry-shell' : ''}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Simple Finance</p>
          <h1>{currentScreen.title}</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Configuración" onClick={openSettings}>
          <Settings2 size={19} aria-hidden="true" />
        </button>
      </header>

      {screen === 'home' ? (
        <section className="screen-stack home-screen" aria-label="Resumen del ciclo actual">
          <article className="payday-banner">
            <span className="summary-symbol"><CalendarDays size={19} aria-hidden="true" /></span>
            <div className="payday-copy">
              <span>Próxima nómina</span>
              <small>Día de cobro: {paydayDay}</small>
            </div>
            <strong>{daysUntilPayday === 0 ? 'Cobras hoy' : `Faltan ${daysUntilPayday} días`}</strong>
          </article>

          <section className="dashboard">
            <article className="metric primary">
              <span className="summary-symbol"><WalletCards size={20} aria-hidden="true" /></span>
              <div className="metric-copy">
                <span>Ciclo actual</span>
                <strong>{formatCurrency(cycleSummary.netCents)}</strong>
                <small>
                  {formatCurrency(cycleSummary.incomeCents)} ingresos ·{' '}
                  {formatCurrency(cycleSummary.expenseCents)} gastos
                </small>
              </div>
            </article>
            <article className="metric">
              <span className="metric-icon"><ReceiptText size={18} aria-hidden="true" /></span>
              <div className="metric-copy">
                <span>Movimientos</span>
                <strong>{transactions.length}</strong>
                <small>En este dispositivo.</small>
              </div>
            </article>
          </section>

          <div className="home-actions">
            <button className="primary-action" type="button" onClick={openQuickEntry}>
              <CirclePlus size={19} aria-hidden="true" />
              <span>Registrar movimiento</span>
            </button>
          </div>
          {homeFeedback ? <p className="status-message" role="status">{homeFeedback}</p> : null}

          <section className="compact-panel" aria-label="Últimos movimientos">
            <div className="section-title">
              <h2><ReceiptText size={17} aria-hidden="true" />Últimos movimientos</h2>
              <button className="text-button" type="button" onClick={() => navigateTo('activity')}>
                Ver todos
              </button>
            </div>
            {renderTransactions(transactions.slice(0, 2), true)}
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
            {(['expense', 'income'] as const).map((type) => (
              <button
                key={type}
                className={draft.type === type ? 'active' : ''}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, type }))}
              >
                {type === 'expense' ? 'Gasto' : 'Ingreso'}
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
              onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value }))}
            />
          </label>

          <div className="field-grid">
            <label>
              Fecha
              <input
                type="date"
                value={draft.occurredOn}
                onChange={(event) => setDraft((current) => ({ ...current, occurredOn: event.target.value }))}
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
            Categoría
            <select
              value={draft.categoryId}
              onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-action" type="submit">
            Guardar movimiento
          </button>
        </form>
      ) : null}

      {screen === 'activity' ? (
        <section className="activity-panel screen-stack" aria-label="Actividad">
          <div className="section-title">
            <h2><ListFilter size={17} aria-hidden="true" />Todos los movimientos</h2>
            <button
              className="calendar-button"
              type="button"
              aria-label="Ver resumen mensual"
              title="Ver resumen mensual"
              onClick={() => setIsCalendarOpen((current) => !current)}
            >
              <CalendarDays size={19} aria-hidden="true" />
            </button>
          </div>

          {isCalendarOpen ? (
            <section className="monthly-calendar" aria-label="Resumen de ciclos del año">
              {monthlyCalendar.map((month) => (
                <button
                  key={month.cycleId}
                  className={activityCycleId === month.cycleId ? 'active' : ''}
                  type="button"
                  aria-pressed={activityCycleId === month.cycleId}
                  onClick={() => setActivityCycleId((current) => (current === month.cycleId ? null : month.cycleId))}
                >
                  <strong>{month.label}</strong>
                  <span className="calendar-income">+{formatCurrency(month.incomeCents)}</span>
                  <span className="calendar-expense">-{formatCurrency(month.expenseCents)}</span>
                </button>
              ))}
            </section>
          ) : null}

          {activityCycleId ? (
            <button className="cycle-filter" type="button" onClick={() => setActivityCycleId(null)}>
              Extracto de {formatCycleLabel(activityCycleId)} · Mostrar todo
            </button>
          ) : null}

          <label className="activity-method-filter">
            <span className="field-title"><CreditCard size={16} aria-hidden="true" />Tarjeta</span>
            <select value={activityPaymentMethodId} onChange={(event) => setActivityPaymentMethodId(event.target.value)}>
              <option value="all">Todas las tarjetas</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </label>

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
        <section className="cards-panel screen-stack" aria-label="Configuración personal">
          <div className="section-title">
            <div>
              <h2><Settings2 size={17} aria-hidden="true" />Configuración personal</h2>
              <p>Personaliza las bases de tus movimientos.</p>
            </div>
          </div>

          <section className="configuration-item" aria-label="Tarjetas">
            <div className="configuration-select-row">
              <label>
                <span className="field-title"><CreditCard size={16} aria-hidden="true" />Tarjetas</span>
                <select value={selectedCard?.id ?? ''} onChange={(event) => setSelectedCardId(event.target.value)}>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}{method.isPrimary ? ' · Principal' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="add-icon-button"
                type="button"
                aria-label="Añadir tarjeta"
                title="Añadir tarjeta"
                onClick={() => setIsAddingCard((current) => !current)}
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            </div>
            {selectedCard && !selectedCard.isPrimary ? (
              <button className="secondary-action" type="button" onClick={() => handleSetPrimaryCard(selectedCard.id)}>
                Usar como principal
              </button>
            ) : (
              <span className="primary-tag">Tarjeta principal</span>
            )}
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
          </section>

          <section className="configuration-item" aria-label="Categorías">
            <div className="configuration-select-row">
              <label>
                <span className="field-title"><Tags size={16} aria-hidden="true" />Categorías</span>
                <select value={selectedCategory?.id ?? ''} onChange={(event) => setSelectedCategoryId(event.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="add-icon-button"
                type="button"
                aria-label="Añadir categoría"
                title="Añadir categoría"
                onClick={() => setIsAddingCategory((current) => !current)}
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            </div>
            {isAddingCategory ? (
              <div className="card-creator">
                <label>
                  Nombre de la categoría
                  <input
                    autoFocus
                    placeholder="Mascotas"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                  />
                </label>
                <button className="primary-action" type="button" onClick={handleAddCategory}>
                  Guardar categoría
                </button>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

      <nav className="bottom-nav" aria-label="Navegación principal">
        {screens.map((item) => (
          (() => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={screen === item.id ? 'active' : ''}
                type="button"
                aria-current={screen === item.id ? 'page' : undefined}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            )
          })()
        ))}
      </nav>

      {isQuickEntryOpen ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="quick-entry-title">
          <section className="quick-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Registro rápido</p>
                <h2 id="quick-entry-title">
                  {quickStep === 'type'
                    ? '¿Qué vas a registrar?'
                    : quickStep === 'amount'
                      ? '¿Qué importe es?'
                      : quickStep === 'merchant'
                        ? '¿Dónde ha sido?'
                        : 'Elige una categoría'}
                </h2>
              </div>
              <button className="close-button" type="button" aria-label="Cerrar registro rápido" onClick={closeQuickEntry}>
                Cerrar
              </button>
            </div>

            <div className="step-progress" aria-label={`Paso ${quickStepIndex + 1} de ${quickSteps.length}`}>
              {quickSteps.map((step, index) => (
                <span key={step} className={index <= quickStepIndex ? 'active' : ''} />
              ))}
            </div>

            {quickStep === 'type' ? (
              <div className="quick-type-actions">
                <button className="primary-action" type="button" onClick={() => chooseQuickType('expense')}>
                  Gasto
                </button>
                <button className="secondary-action" type="button" onClick={() => chooseQuickType('income')}>
                  Ingreso
                </button>
              </div>
            ) : null}

            {quickStep === 'amount' ? (
              <label className="quick-field">
                Importe
                <input
                  autoFocus
                  inputMode="decimal"
                  placeholder="34,90"
                  value={quickAmount}
                  onChange={(event) => setQuickAmount(event.target.value)}
                />
              </label>
            ) : null}

            {quickStep === 'merchant' ? (
              <label className="quick-field">
                Concepto
                <input
                  autoFocus
                  placeholder="Opcional"
                  value={quickMerchant}
                  onChange={(event) => setQuickMerchant(event.target.value)}
                />
              </label>
            ) : null}

            {quickStep === 'category' ? (
              <div className="quick-categories" aria-label="Categoría">
                {quickCategories.map((category) => (
                  <button
                    key={category.id}
                    className={quickCategoryId === category.id ? 'active' : ''}
                    type="button"
                    onClick={() => setQuickCategoryId(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}

            {quickFeedback ? <p className="status-message error" role="alert">{quickFeedback}</p> : null}

            {quickStep !== 'type' ? (
              <div className="sheet-actions">
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setQuickStep(quickSteps[quickStepIndex - 1] ?? 'type')}
                >
                  Atrás
                </button>
                {quickStep === 'category' ? (
                  <button className="primary-action" type="button" onClick={handleQuickSave}>
                    Guardar movimiento
                  </button>
                ) : (
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => setQuickStep(quickSteps[quickStepIndex + 1] ?? 'category')}
                  >
                    Continuar
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {editingTransaction && editDraft ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
          <section className="settings-sheet edit-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Movimiento</p>
                <h2 id="edit-transaction-title">Editar movimiento</h2>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Cerrar edición"
                onClick={() => setEditingTransaction(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="segmented edit-type" aria-label="Tipo de movimiento">
              {(['expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  className={editDraft.type === type ? 'active' : ''}
                  type="button"
                  onClick={() =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            type,
                            categoryId:
                              categories.find((category) => category.allowedTypes.includes(type))?.id ?? current.categoryId,
                          }
                        : current,
                    )
                  }
                >
                  {type === 'expense' ? 'Gasto' : 'Ingreso'}
                </button>
              ))}
            </div>

            <label>
              Importe
              <input
                autoFocus
                inputMode="decimal"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
              />
            </label>

            <label>
              Comercio o concepto
              <input
                value={editDraft.merchant}
                onChange={(event) => setEditDraft((current) => (current ? { ...current, merchant: event.target.value } : current))}
              />
            </label>

            <div className="field-grid">
              <label>
                Fecha
                <input
                  type="date"
                  value={editDraft.occurredOn}
                  onChange={(event) =>
                    setEditDraft((current) => (current ? { ...current, occurredOn: event.target.value } : current))
                  }
                />
              </label>
              <label>
                Tarjeta
                <select
                  value={editDraft.paymentMethodId}
                  onChange={(event) =>
                    setEditDraft((current) => (current ? { ...current, paymentMethodId: event.target.value } : current))
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
              Categoría
              <select
                value={editDraft.categoryId}
                onChange={(event) =>
                  setEditDraft((current) => (current ? { ...current, categoryId: event.target.value } : current))
                }
              >
                {categories
                  .filter((category) => category.allowedTypes.includes(editDraft.type))
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>

            {editFeedback ? <p className="status-message error" role="alert">{editFeedback}</p> : null}
            <button className="primary-action" type="button" onClick={() => void handleSaveEditedTransaction()}>
              Guardar cambios
            </button>
          </section>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <section className="settings-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Simple Finance</p>
                <h2 id="settings-title">Configuración</h2>
              </div>
              <button className="close-button" type="button" aria-label="Cerrar configuración" onClick={() => setIsSettingsOpen(false)}>
                Cerrar
              </button>
            </div>

            <section className="settings-section" aria-labelledby="theme-title">
              <h3 id="theme-title">Tema</h3>
              <div className="segmented theme-selector" aria-label="Tema">
                <button className={!isDark ? 'active' : ''} type="button" onClick={() => setIsDark(false)}>
                  Claro
                </button>
                <button className={isDark ? 'active' : ''} type="button" onClick={() => setIsDark(true)}>
                  Noche
                </button>
              </div>
            </section>

            <section className="settings-section" aria-labelledby="payday-title">
              <h3 id="payday-title">Nómina</h3>
              <label>
                Día de cobro
                <input
                  type="number"
                  min="1"
                  max="31"
                  inputMode="numeric"
                  value={settingsPaydayDay}
                  onChange={(event) => setSettingsPaydayDay(Number(event.target.value))}
                />
              </label>
              <label>
                Cantidad cobrada
                <input
                  inputMode="decimal"
                  placeholder="1.890,00"
                  value={settingsPaydayAmount}
                  onChange={(event) => setSettingsPaydayAmount(event.target.value)}
                />
              </label>
              <button className="primary-action" type="button" onClick={handleSaveSettings}>
                Guardar nómina
              </button>
              {settingsFeedback ? <p className="status-message" role="status">{settingsFeedback}</p> : null}
            </section>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
