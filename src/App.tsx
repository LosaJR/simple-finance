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
  createPaymentMethod,
  createTransaction,
  ensureSeedData,
  ensureScheduledPayroll,
  getSettings,
  listCategories,
  listPaymentMethods,
  listTransactions,
  savePaydaySettings,
  setPrimaryPaymentMethod,
} from './lib/storage'
import {
  formatActivityDate,
  formatCurrency,
  getDaysUntilPayday,
  parseEuroToCents,
  summarizeCurrentCycle,
  summarizeMonthlyHistory,
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
  note: '',
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

const screens: { id: AppScreen; label: string; title: string }[] = [
  { id: 'home', label: 'Resumen', title: 'Control personal' },
  { id: 'entry', label: 'Registrar', title: 'Nuevo movimiento' },
  { id: 'activity', label: 'Actividad', title: 'Actividad' },
  { id: 'cards', label: 'Tarjetas', title: 'Tarjetas' },
]

const quickSteps: QuickStep[] = ['type', 'amount', 'merchant', 'category']

const formatCalendarMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(new Date(year, month, 1))
    .replace('.', '')

const formatAmountInput = (amountCents: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amountCents / 100,
  )

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
  const [screen, setScreen] = useState<AppScreen>('home')
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardName, setNewCardName] = useState('')
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
  const cycleSummary = useMemo(
    () => summarizeCurrentCycle(transactions, paydayDay),
    [paydayDay, transactions],
  )
  const daysUntilPayday = useMemo(() => getDaysUntilPayday(paydayDay), [paydayDay])
  const monthlyCalendar = useMemo(() => {
    const year = new Date().getFullYear()
    const summaries = new Map(summarizeMonthlyHistory(transactions).map((summary) => [summary.month, summary]))
    return Array.from({ length: 12 }, (_, month) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`
      const summary = summaries.get(key)
      return {
        label: formatCalendarMonth(year, month),
        expenseCents: summary?.expenseCents ?? 0,
        incomeCents: summary?.incomeCents ?? 0,
      }
    })
  }, [transactions])
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
          (activityPaymentMethodId === 'all' || transaction.paymentMethodId === activityPaymentMethodId),
      ),
    [activityPaymentMethodId, activityTab, transactions],
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
      note: draft.note?.trim() || undefined,
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
      await createPaymentMethod(cardName)
      setNewCardName('')
      setIsAddingCard(false)
      setFeedback('Tarjeta añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la tarjeta. Inténtalo de nuevo.')
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

  const renderTransactions = (items: Transaction[]) => {
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
            <li key={transaction.id}>
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
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <main className={`shell ${screen === 'home' ? 'home-shell' : ''}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Simple Finance</p>
          <h1>{currentScreen.title}</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Configuración" onClick={openSettings}>
          Ajustes
        </button>
      </header>

      {screen === 'home' ? (
        <section className="screen-stack home-screen" aria-label="Resumen del ciclo actual">
          <article className="payday-banner">
            <span>Próxima nómina</span>
            <strong>{daysUntilPayday === 0 ? 'Cobras hoy' : `Faltan ${daysUntilPayday} días`}</strong>
            <small>Día de cobro: {paydayDay}</small>
          </article>

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
              <span>Movimientos</span>
              <strong>{transactions.length}</strong>
              <small>En este dispositivo.</small>
            </article>
          </section>

          <div className="home-actions">
            <button className="primary-action" type="button" onClick={openQuickEntry}>
              Registrar movimiento
            </button>
          </div>
          {homeFeedback ? <p className="status-message" role="status">{homeFeedback}</p> : null}

          <section className="compact-panel" aria-label="Últimos movimientos">
            <div className="section-title">
              <h2>Últimos movimientos</h2>
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
            <button
              className="calendar-button"
              type="button"
              aria-label="Ver resumen mensual"
              title="Ver resumen mensual"
              onClick={() => setIsCalendarOpen((current) => !current)}
            >
              <span aria-hidden="true" />
            </button>
          </div>

          {isCalendarOpen ? (
            <section className="monthly-calendar" aria-label="Resumen de meses del año">
              {monthlyCalendar.map((month) => (
                <article key={month.label}>
                  <strong>{month.label}</strong>
                  <span className="calendar-income">+{formatCurrency(month.incomeCents)}</span>
                  <span className="calendar-expense">-{formatCurrency(month.expenseCents)}</span>
                </article>
              ))}
            </section>
          ) : null}

          <label className="activity-method-filter">
            Tarjeta
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
        <section className="cards-panel screen-stack" aria-label="Tarjetas">
          <div className="section-title">
            <div>
              <h2>Tus tarjetas</h2>
              <p>La tarjeta principal se usa por defecto.</p>
            </div>
            <button className="text-button" type="button" onClick={() => setIsAddingCard((current) => !current)}>
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
                  <small>{method.isPrimary ? 'Tarjeta principal' : 'Tarjeta activa'}</small>
                </div>
                {method.isPrimary ? (
                  <span className="primary-tag">Principal</span>
                ) : (
                  <button
                    className="secondary-action compact-action"
                    type="button"
                    onClick={() => handleSetPrimaryCard(method.id)}
                  >
                    Usar como principal
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="bottom-nav" aria-label="Navegación principal">
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
