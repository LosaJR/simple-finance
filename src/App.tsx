import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  BadgeAlert,
  Banknote,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  CreditCard,
  Download,
  Ellipsis,
  Fuel,
  Gamepad2,
  House,
  LayoutDashboard,
  ListFilter,
  Minus,
  Search,
  Pencil,
  Plus,
  PieChart,
  Repeat2,
  RotateCcw,
  Settings,
  Settings2,
  Store,
  ShoppingBasket,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  getCycleId,
  getScheduledCycleId,
  isPotentialDuplicate,
  normalizeMerchant,
  type Category,
  type MerchantRule,
  type PaymentMethod,
  type PlannedPayment,
  plannedPaymentDraftSchema,
  type Transaction,
  type TransactionDraft,
  transactionDraftSchema,
} from './lib/finance'
import {
  archiveCategory,
  createDemoDataset,
  createMerchantRule,
  createPaymentMethod,
  createCategory,
  createPlannedPayment,
  createTransaction,
  deletePlannedPayment,
  deleteTransaction,
  ensureSeedData,
  ensureScheduledPayroll,
  exportLocalBackup,
  getSettings,
  listCategories,
  listMerchantRules,
  listPaymentMethods,
  listPlannedPayments,
  listTransactions,
  recordPlannedPayment,
  removeDemoDataset,
  restoreLocalBackup,
  savePreferences,
  savePaydaySettings,
  togglePlannedPayment,
  updateCategory,
  updateCategoryLimit,
  updateTransaction,
} from './lib/storage'
import {
  formatActivityDate,
  formatCycleRange,
  formatCurrency,
  formatLocalDate,
  getDailyAvailableCents,
  getDaysUntilPayday,
  parseEuroToCents,
  summarizeCategoryLimit,
  summarizeCycleTrend,
} from './lib/summary'

const APP_VERSION = '1.16'

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
type ConfigurationDialog = 'card' | 'category-add' | 'category-edit' | null
type BusyAction = 'quick' | 'entry' | 'planned' | 'planned-record' | 'settings' | 'edit' | null

const activityTabs: { id: ActivityTab; label: string }[] = [
  { id: 'all', label: 'Global' },
  { id: 'expense', label: 'Gastos' },
  { id: 'income', label: 'Ingresos' },
]

const screens: { id: AppScreen; label: string; title: string; icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Inicio', title: 'Inicio', icon: LayoutDashboard },
  { id: 'entry', label: 'Registrar', title: 'Nuevo movimiento', icon: CirclePlus },
  { id: 'activity', label: 'Actividad', title: 'Actividad', icon: ListFilter },
  { id: 'cards', label: 'Configuración', title: 'Configuración', icon: Settings2 },
]

const quickSteps: QuickStep[] = ['type', 'amount', 'merchant', 'category']

const formatAmountInput = (amountCents: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amountCents / 100,
  )

const formatCompactDate = (isoDate: string) => `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`

const formatCycleLabel = (cycleId: string) =>
  new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(new Date(`${cycleId}-01T12:00:00`))
    .replace('.', '')

const categoryIcons = {
  leisure: Gamepad2,
  groceries: ShoppingBasket,
  fuel: Fuel,
  home: House,
  subscriptions: Repeat2,
  income: Banknote,
}

const getCategoryIcon = (categoryId: string) =>
  categoryIcons[categoryId as keyof typeof categoryIcons] ?? Tags

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([])
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>([])
  const [draft, setDraft] = useState<TransactionDraft>(initialDraft)
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState('')
  const [homeFeedback, setHomeFeedback] = useState('')
  const [isDark, setIsDark] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(true)
  const [activityTab, setActivityTab] = useState<ActivityTab>('all')
  const [activityPaymentMethodId, setActivityPaymentMethodId] = useState('all')
  const [activityCycleId, setActivityCycleId] = useState<string | null>(null)
  const [activityCategoryId, setActivityCategoryId] = useState('all')
  const [activitySearch, setActivitySearch] = useState('')
  const [activityPendingOnly, setActivityPendingOnly] = useState(false)
  const [screen, setScreen] = useState<AppScreen>('home')
  const [configurationDialog, setConfigurationDialog] = useState<ConfigurationDialog>(null)
  const [newCardName, setNewCardName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState('')
  const [categoryNameInput, setCategoryNameInput] = useState('')
  const [categoryColorInput, setCategoryColorInput] = useState('#546f59')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categoryLimitInput, setCategoryLimitInput] = useState('')
  const [categoryLimitFeedback, setCategoryLimitFeedback] = useState('')
  const [isConfirmingCategoryDeletion, setIsConfirmingCategoryDeletion] = useState(false)
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
  const [quickRememberRule, setQuickRememberRule] = useState(false)
  const [quickFeedback, setQuickFeedback] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSummaryCalendarOpen, setIsSummaryCalendarOpen] = useState(false)
  const [summaryCalendarYear, setSummaryCalendarYear] = useState(() => new Date().getFullYear())
  const [summaryCycleId, setSummaryCycleId] = useState<string | null>(null)
  const [summaryCategoryId, setSummaryCategoryId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editDraft, setEditDraft] = useState<TransactionDraft | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editFeedback, setEditFeedback] = useState('')
  const [openTransactionId, setOpenTransactionId] = useState<string | null>(null)
  const [lastCreatedTransaction, setLastCreatedTransaction] = useState<Transaction | null>(null)
  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [plannedName, setPlannedName] = useState('')
  const [plannedAmount, setPlannedAmount] = useState('')
  const [plannedCategoryId, setPlannedCategoryId] = useState('')
  const [plannedPaymentMethodId, setPlannedPaymentMethodId] = useState('')
  const [plannedFrequency, setPlannedFrequency] = useState<PlannedPayment['frequency']>('monthly')
  const [plannedDueOn, setPlannedDueOn] = useState(todayInputValue())
  const [planFeedback, setPlanFeedback] = useState('')
  const [demoFeedback, setDemoFeedback] = useState('')
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const quickSheetRef = useRef<HTMLElement>(null)
  const editSheetRef = useRef<HTMLElement>(null)
  const settingsSheetRef = useRef<HTMLElement>(null)
  const configurationSheetRef = useRef<HTMLElement>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)
  const busyActionRef = useRef<BusyAction>(null)
  const wasModalOpenRef = useRef(false)
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
  const swipeStart = useRef<{ id: string; x: number } | null>(null)

  const refreshData = async () => {
    await ensureSeedData()
    await ensureScheduledPayroll()
    const [nextCategories, nextMethods, nextTransactions, nextSettings, nextRules, nextPlannedPayments] = await Promise.all([
      listCategories(),
      listPaymentMethods(),
      listTransactions(),
      getSettings(),
      listMerchantRules(),
      listPlannedPayments(),
    ])
    const primary = nextMethods.find((method) => method.isPrimary) ?? nextMethods[0]
    setCategories(nextCategories)
    setPaymentMethods(nextMethods)
    setTransactions(nextTransactions)
    setMerchantRules(nextRules)
    setPlannedPayments(nextPlannedPayments)
    setPaydayDay(nextSettings.paydayDay)
    setPaydayAmount(nextSettings.paydayAmountCents ? formatAmountInput(nextSettings.paydayAmountCents) : '')
    setIsDark(nextSettings.theme !== 'light')
    setHighContrast(nextSettings.highContrast)
    setOnboardingCompleted(nextSettings.onboardingCompleted)
    setDraft((current) => ({
      ...current,
      categoryId: current.categoryId || nextCategories[0]?.id || '',
      paymentMethodId: current.paymentMethodId || primary?.id || '',
    }))
    setSelectedCardId((current) => current || primary?.id || '')
    setSelectedCategoryId((current) => current || nextCategories[0]?.id || '')
    setPlannedCategoryId((current) => current || nextCategories.find((category) => category.allowedTypes.includes('expense'))?.id || '')
    setPlannedPaymentMethodId((current) => current || primary?.id || '')
  }

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#062633' : '#d8e6e0')
  }, [highContrast, isDark])

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
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const currentCycleId = useMemo(
    () => getCycleId(todayInputValue(), paydayDay),
    [paydayDay],
  )
  const selectedSummaryCycleId = summaryCycleId ?? currentCycleId
  const cycleExpenseCategories = useMemo(() => {
    const amounts = new Map<string, number>()
    for (const transaction of transactions) {
      if (
        transaction.type !== 'expense' ||
        getCycleId(transaction.occurredOn, paydayDay) !== selectedSummaryCycleId
      ) {
        continue
      }
      amounts.set(transaction.categoryId, (amounts.get(transaction.categoryId) ?? 0) + transaction.amountCents)
    }

    const totalCents = [...amounts.values()].reduce((total, amountCents) => total + amountCents, 0)
    const entries = [...amounts.entries()]
      .map(([categoryId, amountCents]) => ({
        category: categoryMap.get(categoryId),
        amountCents,
        percentage: totalCents > 0 ? Math.round((amountCents / totalCents) * 100) : 0,
      }))
      .filter((entry): entry is { category: Category; amountCents: number; percentage: number } => Boolean(entry.category))
      .sort((first, second) => second.amountCents - first.amountCents)

    return { entries, totalCents }
  }, [categoryMap, paydayDay, selectedSummaryCycleId, transactions])
  const selectedSummaryCategoryTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.categoryId === summaryCategoryId &&
          getCycleId(transaction.occurredOn, paydayDay) === selectedSummaryCycleId,
      ),
    [paydayDay, selectedSummaryCycleId, summaryCategoryId, transactions],
  )

const downloadFile = (name: string, contents: string, type: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
  const selectedCycleIncomeCents = useMemo(
    () => transactions
      .filter(
        (transaction) =>
          transaction.type === 'income' &&
          getCycleId(transaction.occurredOn, paydayDay) === selectedSummaryCycleId,
      )
      .reduce((total, transaction) => total + transaction.amountCents, 0),
    [paydayDay, selectedSummaryCycleId, transactions],
  )
  const plannedCycleCents = useMemo(
    () => plannedPayments
      .filter(
        (payment) =>
          payment.active && getCycleId(payment.nextDueOn, paydayDay) === selectedSummaryCycleId,
      )
      .reduce((total, payment) => total + payment.amountCents, 0),
    [paydayDay, plannedPayments, selectedSummaryCycleId],
  )
  const availableEstimateCents = selectedCycleIncomeCents - cycleExpenseCategories.totalCents - plannedCycleCents
  const daysUntilPayday = useMemo(() => getDaysUntilPayday(paydayDay), [paydayDay])
  const dailyAvailableCents =
    selectedSummaryCycleId === currentCycleId
      ? getDailyAvailableCents(availableEstimateCents, daysUntilPayday)
      : null
  const previousCycleExpenseCents = useMemo(() => {
    const cycleDate = new Date(`${selectedSummaryCycleId}-01T12:00:00`)
    cycleDate.setMonth(cycleDate.getMonth() - 1)
    const previousCycleId = `${cycleDate.getFullYear()}-${String(cycleDate.getMonth() + 1).padStart(2, '0')}`
    return transactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          getCycleId(transaction.occurredOn, paydayDay) === previousCycleId,
      )
      .reduce((total, transaction) => total + transaction.amountCents, 0)
  }, [paydayDay, selectedSummaryCycleId, transactions])
  const expenseComparisonCents = cycleExpenseCategories.totalCents - previousCycleExpenseCents
  const pendingTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'pending'),
    [transactions],
  )
  const plannedPaymentsForSummary = useMemo(
    () =>
      selectedSummaryCycleId === currentCycleId
        ? plannedPayments
            .filter(
              (payment) =>
                payment.active &&
                getCycleId(payment.nextDueOn, paydayDay) === currentCycleId,
            )
            .sort((first, second) => first.nextDueOn.localeCompare(second.nextDueOn))
            .slice(0, 3)
        : [],
    [currentCycleId, paydayDay, plannedPayments, selectedSummaryCycleId],
  )
  const expenseChartBackground = useMemo(() => {
    if (cycleExpenseCategories.entries.length === 0) {
      return 'conic-gradient(var(--field) 0 100%)'
    }
    let position = 0
    const segments = cycleExpenseCategories.entries.map((entry) => {
      const end = position + (entry.amountCents / cycleExpenseCategories.totalCents) * 100
      const segment = `${entry.category.color} ${position}% ${end}%`
      position = end
      return segment
    })
    return `conic-gradient(${segments.join(', ')})`
  }, [cycleExpenseCategories])
  const summaryCalendarYears = useMemo(() => {
    const latestYear = Math.max(
      new Date().getFullYear(),
      ...transactions.map((transaction) => Number(transaction.occurredOn.slice(0, 4))),
    )
    return Array.from({ length: latestYear - 2026 + 1 }, (_, index) => 2026 + index)
  }, [transactions])
  const summaryCalendarMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) => {
        const cycleId = `${summaryCalendarYear}-${String(month + 1).padStart(2, '0')}`
        return { cycleId, label: formatCycleLabel(cycleId) }
      }),
    [summaryCalendarYear],
  )
  const monthlyCalendar = useMemo(() => {
    const year = new Date().getFullYear()
    const summaries = new Map<string, { expenseCents: number; incomeCents: number }>()
    for (const transaction of transactions) {
      const cycleId = getScheduledCycleId(transaction.occurredOn, paydayDay)
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
  const cycleTrend = useMemo(() => summarizeCycleTrend(transactions, paydayDay), [paydayDay, transactions])
  const selectedActivityCycle = useMemo(() => {
    if (!activityCycleId) return null

    return transactions.reduce(
      (summary, transaction) => {
        if (getScheduledCycleId(transaction.occurredOn, paydayDay) !== activityCycleId) return summary
        if (transaction.type === 'income') summary.incomeCents += transaction.amountCents
        if (transaction.type === 'expense') summary.expenseCents += transaction.amountCents
        return summary
      },
      { cycleId: activityCycleId, incomeCents: 0, expenseCents: 0 },
    )
  }, [activityCycleId, paydayDay, transactions])
  const latestTrend = cycleTrend.at(-1)
  const previousTrend = cycleTrend.at(-2)
  const largestTrendAmount = Math.max(
    1,
    ...cycleTrend.flatMap((cycle) => [cycle.expenseCents, cycle.incomeCents]),
  )
  const trendExpenseDeltaCents = latestTrend && previousTrend ? latestTrend.expenseCents - previousTrend.expenseCents : null
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
          (activityCategoryId === 'all' || transaction.categoryId === activityCategoryId) &&
          (!activityPendingOnly || transaction.status === 'pending') &&
          (activityCycleId === null || getScheduledCycleId(transaction.occurredOn, paydayDay) === activityCycleId) &&
          (!activitySearch.trim() || `${transaction.merchant} ${transaction.amountCents / 100}`.toLocaleLowerCase('es-ES').includes(activitySearch.trim().toLocaleLowerCase('es-ES'))),
      ),
    [activityCategoryId, activityCycleId, activityPaymentMethodId, activityPendingOnly, activitySearch, activityTab, paydayDay, transactions],
  )
  const quickCategories = useMemo(
    () => categories.filter((category) => category.allowedTypes.includes(quickType)),
    [categories, quickType],
  )
  const currentScreen = screens.find((item) => item.id === screen) ?? screens[0]
  const quickStepIndex = quickSteps.indexOf(quickStep)

  useEffect(() => {
    setCategoryLimitInput(selectedCategory?.limitCents ? formatAmountInput(selectedCategory.limitCents) : '')
    setCategoryNameInput(selectedCategory?.name ?? '')
    setCategoryColorInput(selectedCategory?.color ?? '#546f59')
    setCategoryLimitFeedback('')
  }, [selectedCategory?.color, selectedCategory?.id, selectedCategory?.limitCents, selectedCategory?.name])

  const navigateTo = (nextScreen: AppScreen) => {
    setScreen(nextScreen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseQuickType = (type: QuickType) => {
    setQuickType(type)
    const recentCategory = transactions.find((transaction) => transaction.type === type)?.categoryId
    setQuickCategoryId(recentCategory ?? categories.find((category) => category.allowedTypes.includes(type))?.id ?? '')
    setQuickStep('amount')
  }

  const rememberOpeningFocus = () => {
    lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }

  const beginSaving = (action: Exclude<BusyAction, null>) => {
    if (busyActionRef.current) return false
    busyActionRef.current = action
    setBusyAction(action)
    return true
  }

  const finishSaving = () => {
    busyActionRef.current = null
    setBusyAction(null)
  }

  const openQuickEntry = () => {
    rememberOpeningFocus()
    setQuickType('expense')
    setQuickAmount('')
    setQuickMerchant('')
    setQuickRememberRule(false)
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

    if (isPotentialDuplicate(parsed.data, transactions) && !window.confirm('Parece un movimiento ya registrado. ¿Quieres guardarlo de todas formas?')) {
      return
    }
    if (!beginSaving('quick')) return

    try {
      const transaction = await createTransaction(parsed.data, paydayDay)
      if (quickRememberRule && quickMerchant.trim()) {
        await createMerchantRule(quickMerchant, quickCategoryId)
      }
      await refreshData()
      closeQuickEntry()
      setLastCreatedTransaction(transaction)
      setHomeFeedback(`Movimiento registrado con ${primaryCard?.name ?? 'la tarjeta principal'}.`)
    } catch {
      setQuickFeedback('No se ha podido registrar el movimiento. Inténtalo de nuevo.')
    } finally {
      finishSaving()
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

    if (isPotentialDuplicate(parsed.data, transactions) && !window.confirm('Parece un movimiento ya registrado. ¿Quieres guardarlo de todas formas?')) {
      return
    }
    if (!beginSaving('entry')) return

    try {
      const transaction = await createTransaction(parsed.data, paydayDay)
      setLastCreatedTransaction(transaction)
      setFeedback('')
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
    } finally {
      finishSaving()
    }
  }

  const openConfigurationDialog = (dialog: Exclude<ConfigurationDialog, null>) => {
    rememberOpeningFocus()
    setIsConfirmingCategoryDeletion(false)
    if (dialog === 'card') setNewCardName('')
    if (dialog === 'category-add') {
      setCategoryNameInput('')
      setCategoryColorInput('#546f59')
      setCategoryLimitInput('')
      setCategoryLimitFeedback('')
    }
    setConfigurationDialog(dialog)
  }

  const closeConfigurationDialog = () => {
    setConfigurationDialog(null)
    setCategoryLimitFeedback('')
    setIsConfirmingCategoryDeletion(false)
  }

  const getCategoryLimitCents = () => {
    const trimmedLimit = categoryLimitInput.trim()
    const limitCents = trimmedLimit ? parseEuroToCents(trimmedLimit) : undefined
    if (trimmedLimit && (!limitCents || limitCents < 0)) {
      setCategoryLimitFeedback('Introduce una cantidad mayor que cero o deja el campo vacío.')
      return null
    }
    return limitCents
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
      closeConfigurationDialog()
      setFeedback('Tarjeta añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la tarjeta. Inténtalo de nuevo.')
    }
  }

  const handleAddCategory = async () => {
    const categoryName = categoryNameInput.trim()
    if (categoryName.length < 2) {
      setFeedback('Escribe un nombre para la categoría.')
      return
    }

    try {
      const limitCents = getCategoryLimitCents()
      if (limitCents === null) return
      const category = await createCategory(categoryName)
      await updateCategory(category.id, { name: categoryName, color: categoryColorInput, icon: category.icon })
      await updateCategoryLimit(category.id, limitCents)
      setSelectedCategoryId(category.id)
      closeConfigurationDialog()
      setFeedback('Categoría añadida.')
      await refreshData()
    } catch {
      setFeedback('No se ha podido añadir la categoría.')
    }
  }

  const handleCategorySelection = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
  }

  const handleQuickMerchantChange = (merchant: string) => {
    setQuickMerchant(merchant)
    const normalizedMerchant = merchant
      .trim()
      .toLocaleLowerCase('es-ES')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
    const suggestedRule = merchantRules.find((rule) => rule.normalizedMerchant === normalizedMerchant)
    if (suggestedRule) {
      setQuickCategoryId(suggestedRule.categoryId)
      setQuickFeedback(`Categoría sugerida por la regla de ${suggestedRule.merchant}.`)
    } else {
      setQuickFeedback('')
    }
  }

  const handleSaveCategoryDetails = async () => {
    if (!selectedCategory) return
    try {
      const limitCents = getCategoryLimitCents()
      if (limitCents === null) return
      await updateCategory(selectedCategory.id, { name: categoryNameInput, color: categoryColorInput, icon: selectedCategory.icon })
      await updateCategoryLimit(selectedCategory.id, limitCents)
      closeConfigurationDialog()
      setFeedback('Categoría actualizada.')
      await refreshData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se ha podido actualizar la categoría.')
    }
  }

  const handleArchiveCategory = async () => {
    if (!selectedCategory) return
    try {
      await archiveCategory(selectedCategory.id)
      setSelectedCategoryId('')
      closeConfigurationDialog()
      setFeedback('Categoría archivada. Los movimientos históricos siguen intactos.')
      await refreshData()
    } catch (error) {
      setCategoryLimitFeedback(error instanceof Error ? error.message : 'No se ha podido eliminar la categoría.')
      setIsConfirmingCategoryDeletion(false)
    }
  }

  const handleSavePlannedPayment = async () => {
    const parsed = plannedPaymentDraftSchema.safeParse({
      name: plannedName,
      amountCents: parseEuroToCents(plannedAmount),
      categoryId: plannedCategoryId,
      paymentMethodId: plannedPaymentMethodId,
      frequency: plannedFrequency,
      nextDueOn: plannedDueOn,
    })
    if (!parsed.success) {
      setPlanFeedback('Completa nombre, importe, categoría, tarjeta y próxima fecha.')
      return
    }
    if (!beginSaving('planned')) return
    try {
      await createPlannedPayment(parsed.data)
      setPlannedName('')
      setPlannedAmount('')
      setIsAddingPlan(false)
      setPlanFeedback('Pago recurrente añadido.')
      await refreshData()
    } catch {
      setPlanFeedback('No se ha podido guardar el pago recurrente.')
    } finally {
      finishSaving()
    }
  }

  const handleRecordPlannedPayment = async (payment: PlannedPayment) => {
    if (!window.confirm(`¿Registrar ${payment.name} como pagado?`)) return
    if (!beginSaving('planned-record')) return
    try {
      await recordPlannedPayment(payment, paydayDay)
      setHomeFeedback(`${payment.name} registrado y siguiente fecha actualizada.`)
      await refreshData()
    } catch {
      setHomeFeedback('No se ha podido registrar el pago recurrente.')
    } finally {
      finishSaving()
    }
  }

  const handleSetTheme = async (theme: 'dark' | 'light') => {
    setIsDark(theme === 'dark')
    await savePreferences({ theme, highContrast, onboardingCompleted })
  }

  const handleSetHighContrast = async (enabled: boolean) => {
    setHighContrast(enabled)
    await savePreferences({ theme: isDark ? 'dark' : 'light', highContrast: enabled, onboardingCompleted })
  }

  const handleUndoLastTransaction = async () => {
    if (!lastCreatedTransaction) return
    await deleteTransaction(lastCreatedTransaction.id)
    setLastCreatedTransaction(null)
    setHomeFeedback('Movimiento deshecho.')
    setFeedback('Movimiento deshecho.')
    await refreshData()
  }

  const handleExportJson = async () => {
    const backup = await exportLocalBackup()
    downloadFile(`simple-finance-${todayInputValue()}.json`, JSON.stringify(backup, null, 2), 'application/json')
    setFeedback('Copia JSON descargada.')
  }

  const handleExportCsv = () => {
    const rows = [['Fecha', 'Tipo', 'Comercio', 'Categoría', 'Tarjeta', 'Importe']]
    for (const transaction of transactions) {
      rows.push([
        transaction.occurredOn,
        transaction.type === 'expense' ? 'Gasto' : 'Ingreso',
        transaction.merchant,
        categoryMap.get(transaction.categoryId)?.name ?? '',
        methodMap.get(transaction.paymentMethodId)?.name ?? '',
        (transaction.amountCents / 100).toFixed(2).replace('.', ','),
      ])
    }
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(';')).join('\n')
    downloadFile(`simple-finance-${todayInputValue()}.csv`, csv, 'text/csv;charset=utf-8')
    setFeedback('Extracto CSV descargado.')
  }

  const handleRestoreBackup = async (file: File | undefined) => {
    if (!file || !window.confirm('La restauración reemplazará los datos locales actuales. ¿Continuar?')) return
    try {
      await restoreLocalBackup(JSON.parse(await file.text()))
      await refreshData()
      setFeedback('Copia restaurada correctamente.')
    } catch {
      setFeedback('La copia no tiene un formato válido o no se ha podido restaurar.')
    }
  }

  const handleLoadDemoData = async () => {
    try {
      const result = await createDemoDataset()
      setDemoFeedback(
        result.alreadyExists
          ? 'Los datos de demostración ya están cargados en este dispositivo.'
          : `${result.createdCount} movimientos ficticios cargados desde enero.`,
      )
      await refreshData()
    } catch (error) {
      setDemoFeedback(error instanceof Error ? error.message : 'No se han podido cargar los datos de demostración.')
    }
  }

  const handleRemoveDemoData = async () => {
    if (!window.confirm('¿Quitar todos los movimientos marcados como Demostración? Los demás datos no se modificarán.')) return
    const count = await removeDemoDataset()
    setDemoFeedback(count ? `${count} movimientos de demostración eliminados.` : 'No había datos de demostración que quitar.')
    await refreshData()
  }

  const selectSummaryCycle = (cycleId: string) => {
    setSummaryCycleId(cycleId)
    setSummaryCategoryId(null)
    setIsSummaryCalendarOpen(false)
  }

  const openSettings = () => {
    rememberOpeningFocus()
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

    if (!beginSaving('settings')) return
    try {
      const paydayAmountCents = parseEuroToCents(settingsPaydayAmount)
      await savePaydaySettings(settingsPaydayDay, paydayAmountCents)
      setPaydayDay(settingsPaydayDay)
      setPaydayAmount(settingsPaydayAmount)
      await refreshData()
      setSettingsFeedback(
        paydayAmountCents > 0 ? 'Nómina configurada.' : 'Día guardado. Añade una cantidad para automatizar la nómina.',
      )
      setOnboardingCompleted(true)
      await savePreferences({ theme: isDark ? 'dark' : 'light', highContrast, onboardingCompleted: true })
    } catch {
      setSettingsFeedback('No se ha podido guardar la nómina.')
    } finally {
      finishSaving()
    }
  }

  const openTransactionEditor = (transaction: Transaction) => {
    rememberOpeningFocus()
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

    if (!beginSaving('edit')) return

    try {
      await updateTransaction(editingTransaction.id, parsed.data, paydayDay)
      setEditingTransaction(null)
      setEditDraft(null)
      setFeedback('Movimiento actualizado.')
      await refreshData()
    } catch {
      setEditFeedback('No se ha podido actualizar el movimiento.')
    } finally {
      finishSaving()
    }
  }

  const handleDeletePlannedPayment = async (payment: PlannedPayment) => {
    if (!window.confirm(`¿Eliminar ${payment.name}? No se borrarán movimientos ya registrados.`)) return
    try {
      await deletePlannedPayment(payment.id)
      setPlanFeedback('Pago recurrente eliminado.')
      await refreshData()
    } catch {
      setPlanFeedback('No se ha podido eliminar el pago recurrente.')
    }
  }

  const closeTransactionEditor = () => {
    setEditingTransaction(null)
    setEditDraft(null)
    setEditFeedback('')
  }

  const closeSettings = () => {
    setIsSettingsOpen(false)
    setSettingsFeedback('')
  }

  useEffect(() => {
    const activeDialog = isQuickEntryOpen
      ? quickSheetRef.current
      : editingTransaction
        ? editSheetRef.current
        : isSettingsOpen
          ? settingsSheetRef.current
          : configurationDialog
            ? configurationSheetRef.current
            : null

    if (!activeDialog) {
      if (wasModalOpenRef.current) {
        wasModalOpenRef.current = false
        lastFocusedElementRef.current?.focus()
        lastFocusedElementRef.current = null
      }
      return
    }

    wasModalOpenRef.current = true
    const getFocusable = () =>
      Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)
    const focusInitial = () => {
      const initial = activeDialog.querySelector<HTMLElement>('[data-initial-focus]')
      ;(initial ?? getFocusable()[0])?.focus()
    }
    const frame = window.requestAnimationFrame(focusInitial)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (isQuickEntryOpen) closeQuickEntry()
        else if (editingTransaction) closeTransactionEditor()
        else if (isSettingsOpen) closeSettings()
        else closeConfigurationDialog()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [configurationDialog, editingTransaction, isQuickEntryOpen, isSettingsOpen])

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

  const renderTransactions = (items: Transaction[], swipeable = false, showCompactDate = false) => {
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
                <div className={showCompactDate ? 'transaction-content has-compact-date' : 'transaction-content'}>
                  <span className={`transaction-marker ${transaction.type}`}>
                    {transaction.type === 'expense' ? (
                      <Minus size={18} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </span>
                  {showCompactDate ? <time className="transaction-date">{formatCompactDate(transaction.occurredOn)}</time> : null}
                  <div>
                    <span className="merchant">{transaction.merchant}</span>
                    <span className="metadata">
                      {category?.name ?? 'Sin categoría'} · {method?.name ?? 'Sin tarjeta'}
                      {!showCompactDate ? ` · ${formatActivityDate(transaction.occurredOn, transaction.createdAt)}` : null}
                    </span>
                  </div>
                  <strong className={transaction.type}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amountCents)}
                  </strong>
                  <button
                    className="transaction-more"
                    type="button"
                    aria-label={`Acciones para ${transaction.merchant}`}
                    aria-expanded={!swipeable && openTransactionId === transaction.id}
                    onClick={() => setOpenTransactionId((current) => current === transaction.id ? null : transaction.id)}
                  >
                    <Ellipsis size={19} aria-hidden="true" />
                  </button>
                </div>
                {!swipeable && openTransactionId === transaction.id ? (
                  <div className="transaction-action-popover" role="group" aria-label={`Acciones para ${transaction.merchant}`}>
                    <button type="button" onClick={() => openTransactionEditor(transaction)}><Pencil size={16} aria-hidden="true" />Editar</button>
                    <button type="button" onClick={() => void handleDeleteTransaction(transaction)}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
                  </div>
                ) : null}
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
          <p className="eyebrow brand-eyebrow">
            <span className="brand-mark" aria-hidden="true" />Simple Finance
            {screen === 'home' ? <span className="app-version">v{APP_VERSION}</span> : null}
          </p>
          <h1>{currentScreen.title}</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Abrir ajustes" onClick={openSettings}>
          <Settings size={20} aria-hidden="true" />
        </button>
      </header>

      {screen === 'home' ? (
        <section className="screen-stack home-screen" aria-label="Inicio del ciclo actual">
          <article className="payday-banner">
            <span className="summary-symbol"><CalendarDays size={19} aria-hidden="true" /></span>
            <div className="payday-copy">
              <span>Próxima nómina</span>
              <small>Día de cobro: {paydayDay}</small>
            </div>
            <strong>{daysUntilPayday === 0 ? 'Cobras hoy' : `Faltan ${daysUntilPayday} días`}</strong>
            <button className="quick-add-button" type="button" aria-label="Registrar movimiento" onClick={openQuickEntry}>
              <Plus size={21} aria-hidden="true" />
            </button>
          </article>
          {homeFeedback ? <p className="status-message" role="status">{homeFeedback}</p> : null}
          {!onboardingCompleted ? (
            <section className="onboarding-panel" aria-label="Primeros pasos">
              <BadgeAlert size={19} aria-hidden="true" />
              <div><strong>Tu espacio está listo</strong><span>Configura la nómina y tu tarjeta principal antes de empezar.</span></div>
              <button className="secondary-action compact-action" type="button" onClick={openSettings}>Empezar</button>
            </section>
          ) : null}
          <section className="cycle-insights" aria-label="Disponibilidad estimada del ciclo">
            <article>
              <span>Disponible estimado</span>
              <strong>{formatCurrency(availableEstimateCents)}</strong>
              <small>Ingresos {formatCurrency(selectedCycleIncomeCents)} · previstos {formatCurrency(plannedCycleCents)}</small>
            </article>
            <article>
              <span>Disponible al día</span>
              <strong>{dailyAvailableCents === null ? '—' : formatCurrency(dailyAvailableCents)}</strong>
              <small>{selectedSummaryCycleId === currentCycleId ? `hasta la nómina en ${daysUntilPayday} días` : 'ciclo histórico'}</small>
            </article>
            <article>
              <span>Frente al ciclo anterior</span>
              <strong>{previousCycleExpenseCents === 0 ? 'Sin referencia' : `${expenseComparisonCents > 0 ? '+' : ''}${formatCurrency(expenseComparisonCents)}`}</strong>
              <small>{previousCycleExpenseCents === 0 ? 'aún no hay gasto anterior' : expenseComparisonCents > 0 ? 'has gastado más' : 'has gastado menos'}</small>
            </article>
          </section>
          {pendingTransactions.length > 0 ? (
            <button className="pending-banner" type="button" onClick={() => { navigateTo('activity'); setActivityPendingOnly(true) }}>
              <BadgeAlert size={18} aria-hidden="true" /><span><strong>{pendingTransactions.length} pendiente{pendingTransactions.length === 1 ? '' : 's'} de revisar</strong><small>Confirma o corrige antes de que cuente en tu balance.</small></span><ChevronDown size={18} aria-hidden="true" />
            </button>
          ) : null}
          {plannedPaymentsForSummary.length > 0 ? (
            <section className="planned-payments" aria-label="Próximos pagos previstos">
              <div className="section-title"><h2><Repeat2 size={17} aria-hidden="true" />Próximos pagos</h2><span>{plannedPaymentsForSummary.length}</span></div>
              {plannedPaymentsForSummary.map((payment) => {
                const isDue = payment.nextDueOn <= todayInputValue()
                const dateLabel = payment.nextDueOn === todayInputValue()
                  ? 'Vence hoy'
                  : payment.nextDueOn < todayInputValue()
                    ? `Pendiente desde ${formatLocalDate(payment.nextDueOn)}`
                    : formatLocalDate(payment.nextDueOn)
                return (
                  <div key={payment.id} className={isDue ? 'planned-payment-row is-due' : 'planned-payment-row'}>
                    <div><strong>{payment.name}</strong><small>{formatCurrency(payment.amountCents)} · {dateLabel}</small></div>
                    {isDue ? <button className="secondary-action compact-action" type="button" disabled={busyAction === 'planned-record'} onClick={() => void handleRecordPlannedPayment(payment)}>{busyAction === 'planned-record' ? 'Registrando...' : 'Registrar'}</button> : null}
                  </div>
                )
              })}
            </section>
          ) : null}

          <section className="spending-panel" aria-label="Gastos del ciclo actual">
            <div className="section-title">
              <div>
                <h2><PieChart size={17} aria-hidden="true" />Gastos del ciclo</h2>
                <p>{formatCycleLabel(selectedSummaryCycleId)} · {formatCurrency(cycleExpenseCategories.totalCents)}</p>
                <small className="cycle-range">{formatCycleRange(selectedSummaryCycleId, paydayDay)}</small>
              </div>
              <button
                className="calendar-button"
                type="button"
                aria-label="Elegir un mes"
                title="Elegir un mes"
                onClick={() => setIsSummaryCalendarOpen((current) => !current)}
              >
                <CalendarDays size={19} aria-hidden="true" />
              </button>
            </div>

            {isSummaryCalendarOpen ? (
              <section className="summary-calendar-picker" aria-label="Elegir ciclo de gastos">
                <label>
                  <span className="field-title"><CalendarDays size={15} aria-hidden="true" />Año</span>
                  <select
                    value={summaryCalendarYear}
                    onChange={(event) => setSummaryCalendarYear(Number(event.target.value))}
                  >
                    {summaryCalendarYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
                <div className="summary-month-grid">
                  {summaryCalendarMonths.map((month) => (
                    <button
                      key={month.cycleId}
                      className={month.cycleId === selectedSummaryCycleId ? 'active' : ''}
                      type="button"
                      aria-pressed={month.cycleId === selectedSummaryCycleId}
                      onClick={() => selectSummaryCycle(month.cycleId)}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="spending-visual">
              <div className="expense-donut" style={{ background: expenseChartBackground }} aria-label="Distribución de gastos">
                <div>
                  <strong>{formatCurrency(cycleExpenseCategories.totalCents)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="category-spending-panel" aria-label="Categorías del ciclo">
            <div className="section-title">
              <div>
                <h2><Tags size={17} aria-hidden="true" />Categorías</h2>
              </div>
            </div>
            {cycleExpenseCategories.entries.length === 0 ? (
              <p className="muted-copy">Los gastos por categoría aparecerán al registrar el primer movimiento.</p>
            ) : (
              <ul className="category-spending-list">
                {cycleExpenseCategories.entries.map((entry) => {
                  const Icon = getCategoryIcon(entry.category.id)
                  const limit = entry.category.limitCents
                    ? summarizeCategoryLimit(entry.amountCents, entry.category.limitCents)
                    : null
                  const LimitIcon = limit?.status === 'normal' ? CircleCheck : CircleAlert
                  return (
                    <li key={entry.category.id}>
                      <button
                        className="category-spending-row"
                        type="button"
                        aria-expanded={summaryCategoryId === entry.category.id}
                        onClick={() => setSummaryCategoryId((current) => current === entry.category.id ? null : entry.category.id)}
                      >
                        <span
                          className="category-icon"
                          style={{
                            color: entry.category.color,
                            background: `${entry.category.color}2e`,
                            borderColor: `${entry.category.color}4a`,
                          }}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <div className="category-spending-copy">
                          <div>
                            <strong>{entry.category.name}</strong>
                            <span>{entry.percentage}%</span>
                          </div>
                          <b>{formatCurrency(entry.amountCents)}{entry.category.limitCents ? ` / ${formatCurrency(entry.category.limitCents)}` : ''}</b>
                          {entry.category.limitCents && limit ? (
                            <>
                              <span className={`limit-status ${limit.status}`}>
                                <LimitIcon size={14} aria-hidden="true" />
                                {limit.status === 'exceeded'
                                  ? `Límite superado por ${formatCurrency(limit.excessCents)}`
                                  : limit.status === 'near-limit'
                                    ? `Cerca del límite · quedan ${formatCurrency(limit.remainingCents)}`
                                    : limit.status === 'attention'
                                      ? `Atención · ${limit.usedPercentage}% usado · quedan ${formatCurrency(limit.remainingCents)}`
                                      : `Quedan ${formatCurrency(limit.remainingCents)}`}
                              </span>
                              <span
                                className={`limit-track ${limit.status}`}
                                aria-label={`${limit.usedPercentage}% del límite usado`}
                                style={limit.status === 'normal' ? { color: entry.category.color } : undefined}
                              ><i style={{ width: `${limit.trackPercentage}%` }} /></span>
                            </>
                          ) : null}
                        </div>
                        <ChevronDown
                          className={summaryCategoryId === entry.category.id ? 'category-caret is-open' : 'category-caret'}
                          size={18}
                          aria-hidden="true"
                        />
                      </button>
                      {summaryCategoryId === entry.category.id ? (
                        <section className="category-expenses category-expenses-inline" aria-label={`Gastos de ${entry.category.name}`}>
                          {renderTransactions(selectedSummaryCategoryTransactions, false, true)}
                        </section>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </section>
      ) : null}

      {screen === 'entry' ? (
        <form className="entry-panel screen-stack" onSubmit={handleSubmit}>
          <div className="section-title">
            <h2><CirclePlus size={17} aria-hidden="true" />Datos del movimiento</h2>
            {feedback ? <p className="entry-feedback" role="status">{feedback}</p> : null}
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
            <span className="field-title"><Banknote size={16} aria-hidden="true" />Importe</span>
            <input
              inputMode="decimal"
              placeholder="34,90"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label>
            <span className="field-title"><Store size={16} aria-hidden="true" />Comercio o concepto (opcional)</span>
            <input
              placeholder="Añádelo si no se ha detectado"
              value={draft.merchant}
              onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value }))}
            />
          </label>

          <label>
            <span className="field-title"><CalendarDays size={16} aria-hidden="true" />Fecha</span>
            <input
              type="date"
              value={draft.occurredOn}
              onChange={(event) => setDraft((current) => ({ ...current, occurredOn: event.target.value }))}
            />
          </label>

          <label>
            <span className="field-title"><CreditCard size={16} aria-hidden="true" />Tarjeta utilizada</span>
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

          <label>
            <span className="field-title"><Tags size={16} aria-hidden="true" />Categoría</span>
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

          <button className="primary-action" type="submit" disabled={busyAction === 'entry'}>
            {busyAction === 'entry' ? 'Guardando...' : 'Guardar movimiento'}
          </button>
          {lastCreatedTransaction ? (
            <button className="undo-entry-action" type="button" onClick={() => void handleUndoLastTransaction()}>
              <RotateCcw size={17} aria-hidden="true" />Deshacer movimiento
            </button>
          ) : null}
        </form>
      ) : null}

      {screen === 'activity' ? (
        <section className="activity-panel screen-stack" aria-label="Actividad">
          <section className="cycle-trend" aria-labelledby="trend-title">
            <div className="section-title">
              <div>
                <h3 id="trend-title"><BarChart3 size={17} aria-hidden="true" />Evolución reciente</h3>
                <p>Ingresos y gastos por ciclo.</p>
              </div>
              <div className="trend-actions">
                {cycleTrend.length ? <small>Últimos {cycleTrend.length}</small> : null}
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

            {cycleTrend.length ? (
              <div className="trend-chart" aria-label="Gráfico de evolución por ciclo">
                {cycleTrend.map((cycle) => (
                  <button
                    key={cycle.cycleId}
                    className={activityCycleId === cycle.cycleId ? 'active' : ''}
                    type="button"
                    aria-pressed={activityCycleId === cycle.cycleId}
                    aria-label={`${formatCycleLabel(cycle.cycleId)}: ingresos ${formatCurrency(cycle.incomeCents)}, gastos ${formatCurrency(cycle.expenseCents)}`}
                    onClick={() => setActivityCycleId((current) => (current === cycle.cycleId ? null : cycle.cycleId))}
                  >
                    <span className="trend-bars" aria-hidden="true">
                      <span className="trend-income" style={{ height: `${Math.max((cycle.incomeCents / largestTrendAmount) * 100, cycle.incomeCents ? 8 : 0)}%` }} />
                      <span className="trend-expense" style={{ height: `${Math.max((cycle.expenseCents / largestTrendAmount) * 100, cycle.expenseCents ? 8 : 0)}%` }} />
                    </span>
                    <span className="trend-amounts" aria-hidden="true">
                      <span className="trend-income-amount">+{formatCurrency(cycle.incomeCents)}</span>
                      <span className="trend-expense-amount">-{formatCurrency(cycle.expenseCents)}</span>
                    </span>
                    <strong>{formatCycleLabel(cycle.cycleId)}</strong>
                  </button>
                ))}
              </div>
            ) : <p className="trend-caption">Registra movimientos en distintos ciclos para ver su evolución.</p>}
            {selectedActivityCycle ? (
              <p className="selected-cycle-summary" role="status">
                <strong>Ciclo seleccionado: {formatCycleLabel(selectedActivityCycle.cycleId)}</strong>
                <span>{formatCycleRange(selectedActivityCycle.cycleId, paydayDay)}</span>
                <span className="selected-cycle-income">Ingresos +{formatCurrency(selectedActivityCycle.incomeCents)}</span>
                <span className="selected-cycle-expense">Gastos −{formatCurrency(selectedActivityCycle.expenseCents)}</span>
              </p>
            ) : null}
            {cycleTrend.length ? (
              trendExpenseDeltaCents === null ? (
                <p className="trend-caption">Registra otro ciclo para ver la comparación.</p>
              ) : (
                <p className="trend-caption">
                  {trendExpenseDeltaCents === 0
                    ? 'Tus gastos se mantienen igual que en el ciclo anterior.'
                    : trendExpenseDeltaCents > 0
                      ? `Has gastado ${formatCurrency(trendExpenseDeltaCents)} más que en el ciclo anterior.`
                      : `Has gastado ${formatCurrency(Math.abs(trendExpenseDeltaCents))} menos que en el ciclo anterior.`}
                </p>
              )
            ) : null}
          </section>

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

          <div className="activity-quick-filters" aria-label="Filtros de actividad">
            <label className="compact-activity-filter">
              <CreditCard size={16} aria-hidden="true" />
              <select aria-label="Tarjeta" value={activityPaymentMethodId} onChange={(event) => setActivityPaymentMethodId(event.target.value)}>
                <option value="all">Todas</option>
                {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
              </select>
            </label>
            <label className="compact-activity-filter">
              <Tags size={16} aria-hidden="true" />
              <select aria-label="Categoría" value={activityCategoryId} onChange={(event) => setActivityCategoryId(event.target.value)}>
                <option value="all">Todas</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="compact-activity-filter">
              <Search size={16} aria-hidden="true" />
              <input aria-label="Buscar" value={activitySearch} placeholder="Buscar" onChange={(event) => setActivitySearch(event.target.value)} />
            </label>
          </div>
          {(activitySearch || activityCategoryId !== 'all' || activityPaymentMethodId !== 'all' || activityPendingOnly || activityCycleId) ? (
            <button className="text-button" type="button" onClick={() => { setActivitySearch(''); setActivityCategoryId('all'); setActivityPaymentMethodId('all'); setActivityPendingOnly(false); setActivityCycleId(null) }}>
              Limpiar filtros
            </button>
          ) : null}

          {renderTransactions(visibleTransactions)}
        </section>
      ) : null}

      {screen === 'cards' ? (
        <section className="cards-panel screen-stack" aria-label="Configuración financiera">
          <div className="section-title">
            <div>
              <h2><Settings2 size={17} aria-hidden="true" />Configuración financiera</h2>
              <p>Tarjetas, categorías y automatizaciones de tus movimientos.</p>
            </div>
          </div>

          <div className="configuration-group" aria-labelledby="configuration-base-title">
            <h3 id="configuration-base-title">Base financiera</h3>
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
                onClick={() => openConfigurationDialog('card')}
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="configuration-item" aria-label="Categorías">
            <div className="configuration-select-row configuration-category-row">
              <label>
                <span className="field-title"><Tags size={16} aria-hidden="true" />Categorías</span>
                <select value={selectedCategory?.id ?? ''} onChange={(event) => handleCategorySelection(event.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="configuration-select-actions">
                <button className="add-icon-button" type="button" aria-label="Editar categoría" title="Editar categoría" onClick={() => openConfigurationDialog('category-edit')}>
                  <Pencil size={17} aria-hidden="true" />
                </button>
                <button className="add-icon-button" type="button" aria-label="Añadir categoría" title="Añadir categoría" onClick={() => openConfigurationDialog('category-add')}>
                  <Plus size={19} aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          </div>
          <div className="configuration-group" aria-labelledby="configuration-automation-title">
            <h3 id="configuration-automation-title">Automatización</h3>

          <section className="configuration-item" aria-label="Pagos recurrentes">
            <div className="section-title"><div><h2><Repeat2 size={17} aria-hidden="true" />Pagos recurrentes</h2><p>Se muestran para confirmar; no se registran solos.</p></div><button className="add-icon-button" type="button" aria-label="Añadir pago recurrente" onClick={() => setIsAddingPlan((current) => !current)}><Plus size={19} aria-hidden="true" /></button></div>
            {isAddingPlan ? <div className="card-creator"><label>Nombre<input autoFocus value={plannedName} placeholder="Netflix" onChange={(event) => setPlannedName(event.target.value)} /></label><label>Importe<input inputMode="decimal" value={plannedAmount} placeholder="12,99" onChange={(event) => setPlannedAmount(event.target.value)} /></label><div className="field-grid"><label>Categoría<select value={plannedCategoryId} onChange={(event) => setPlannedCategoryId(event.target.value)}>{categories.filter((category) => category.allowedTypes.includes('expense')).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Tarjeta<select value={plannedPaymentMethodId} onChange={(event) => setPlannedPaymentMethodId(event.target.value)}>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label></div><div className="field-grid"><label>Frecuencia<select value={plannedFrequency} onChange={(event) => setPlannedFrequency(event.target.value as PlannedPayment['frequency'])}><option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="yearly">Anual</option></select></label><label>Próxima fecha<input type="date" value={plannedDueOn} onChange={(event) => setPlannedDueOn(event.target.value)} /></label></div><button className="primary-action" type="button" disabled={busyAction === 'planned'} onClick={() => void handleSavePlannedPayment()}>{busyAction === 'planned' ? 'Guardando...' : 'Guardar pago'}</button></div> : null}
            {planFeedback ? <p className="status-message" role="status">{planFeedback}</p> : null}
            {plannedPayments.length ? <ul className="simple-list">{plannedPayments.map((payment) => <li key={payment.id}><span><strong>{payment.name}</strong><small>{formatCurrency(payment.amountCents)} · {payment.frequency === 'monthly' ? 'Mensual' : payment.frequency === 'weekly' ? 'Semanal' : 'Anual'} · {payment.nextDueOn}</small></span><div className="list-actions"><button className="text-button" type="button" onClick={() => void togglePlannedPayment(payment.id, !payment.active).then(refreshData)}>{payment.active ? 'Pausar' : 'Activar'}</button><button className="icon-button small-icon" type="button" aria-label={`Eliminar ${payment.name}`} onClick={() => void handleDeletePlannedPayment(payment)}><Trash2 size={16} aria-hidden="true" /></button></div></li>)}</ul> : <p className="muted-copy">Añade las suscripciones o pagos que quieras anticipar.</p>}
          </section>

          </div>
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
          <section ref={quickSheetRef} className="quick-sheet">
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
                <button data-initial-focus className="primary-action" type="button" onClick={() => chooseQuickType('expense')}>
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
                  onChange={(event) => handleQuickMerchantChange(event.target.value)}
                />
                {quickMerchant.trim() ? (
                  <span className="remember-rule"><input type="checkbox" checked={quickRememberRule} onChange={(event) => setQuickRememberRule(event.target.checked)} />Recordar esta categoría para este comercio</span>
                ) : null}
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
                  <button className="primary-action" type="button" disabled={busyAction === 'quick'} onClick={handleQuickSave}>
                    {busyAction === 'quick' ? 'Guardando...' : 'Guardar movimiento'}
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

      {configurationDialog ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="configuration-dialog-title">
          <section ref={configurationSheetRef} className="settings-sheet configuration-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Configuración</p>
                <h2 id="configuration-dialog-title">
                  {configurationDialog === 'card'
                    ? 'Añadir tarjeta'
                    : configurationDialog === 'category-add'
                      ? 'Añadir categoría'
                      : 'Editar categoría'}
                </h2>
              </div>
              <button className="close-button" type="button" aria-label="Cerrar" onClick={closeConfigurationDialog}>Cerrar</button>
            </div>

            {configurationDialog === 'card' ? (
              <>
                <label>
                  Nombre de la tarjeta
                  <input data-initial-focus placeholder="Tarjeta de viajes" value={newCardName} onChange={(event) => setNewCardName(event.target.value)} />
                </label>
                <button className="primary-action" type="button" onClick={() => void handleAddCard()}>Guardar tarjeta</button>
              </>
            ) : (
              <>
                <label>
                  Nombre
                  <input data-initial-focus placeholder="Mascotas" value={categoryNameInput} onChange={(event) => setCategoryNameInput(event.target.value)} />
                </label>
                <div className="field-grid">
                  <label>
                    Color
                    <input className="color-input" type="color" value={categoryColorInput} onChange={(event) => setCategoryColorInput(event.target.value)} />
                  </label>
                  <label>
                    Límite mensual
                    <input inputMode="decimal" placeholder="250,00 €" value={categoryLimitInput} onChange={(event) => setCategoryLimitInput(event.target.value)} />
                  </label>
                </div>
                {categoryLimitFeedback ? <p className="status-message error" role="alert">{categoryLimitFeedback}</p> : null}
                {configurationDialog === 'category-edit' && isConfirmingCategoryDeletion ? (
                  <section className="delete-category-confirmation" aria-label="Confirmar eliminación de categoría">
                    <p>La categoría dejará de estar disponible. Los movimientos ya registrados se conservarán.</p>
                    <div className="sheet-actions">
                      <button className="secondary-action" type="button" onClick={() => setIsConfirmingCategoryDeletion(false)}>Cancelar</button>
                      <button className="danger-action" type="button" onClick={() => void handleArchiveCategory()}><Trash2 size={16} aria-hidden="true" />Eliminar categoría</button>
                    </div>
                  </section>
                ) : (
                  <div className="sheet-actions">
                    {configurationDialog === 'category-edit' ? (
                      <button className="danger-action" type="button" onClick={() => setIsConfirmingCategoryDeletion(true)}><Trash2 size={16} aria-hidden="true" />Eliminar</button>
                    ) : <span />}
                    <button className="primary-action" type="button" onClick={() => void (configurationDialog === 'category-add' ? handleAddCategory() : handleSaveCategoryDetails())}>
                      Guardar categoría
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : null}

      {editingTransaction && editDraft ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
          <section ref={editSheetRef} className="settings-sheet edit-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Movimiento</p>
                <h2 id="edit-transaction-title">Editar movimiento</h2>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Cerrar edición"
                onClick={closeTransactionEditor}
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
                data-initial-focus
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
            <button className="primary-action" type="button" disabled={busyAction === 'edit'} onClick={() => void handleSaveEditedTransaction()}>
              {busyAction === 'edit' ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </section>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <section ref={settingsSheetRef} className="settings-sheet">
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Simple Finance</p>
                <h2 id="settings-title">Ajustes</h2>
              </div>
              <button className="close-button" type="button" aria-label="Cerrar ajustes" onClick={closeSettings}>
                Cerrar
              </button>
            </div>

            <section className="settings-section" aria-labelledby="theme-title">
              <h3 id="theme-title">Tema</h3>
              <div className="segmented theme-selector" aria-label="Tema">
                <button className={!isDark ? 'active' : ''} type="button" onClick={() => void handleSetTheme('light')}>
                  Claro
                </button>
                <button className={isDark ? 'active' : ''} type="button" onClick={() => void handleSetTheme('dark')}>
                  Noche
                </button>
              </div>
              <label className="contrast-toggle"><input type="checkbox" checked={highContrast} onChange={(event) => void handleSetHighContrast(event.target.checked)} /><span>Contraste reforzado</span></label>
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
                  data-initial-focus
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
              <button className="primary-action" type="button" disabled={busyAction === 'settings'} onClick={handleSaveSettings}>
                {busyAction === 'settings' ? 'Guardando...' : 'Guardar nómina'}
              </button>
              {settingsFeedback ? <p className="status-message" role="status">{settingsFeedback}</p> : null}
            </section>

            <section className="settings-section" aria-labelledby="data-title">
              <h3 id="data-title">Datos y privacidad</h3>
              <p className="muted-copy">Exporta una copia privada o restáurala en este dispositivo.</p>
              <div className="backup-actions"><button className="secondary-action" type="button" onClick={() => void handleExportCsv()}><Download size={16} aria-hidden="true" />CSV</button><button className="secondary-action" type="button" onClick={() => void handleExportJson()}><Download size={16} aria-hidden="true" />Copia JSON</button><button className="secondary-action" type="button" onClick={() => importInputRef.current?.click()}><Upload size={16} aria-hidden="true" />Restaurar</button></div>
              <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json" onChange={(event) => void handleRestoreBackup(event.target.files?.[0])} />
              <div className="demo-data-control">
                <div><strong>Datos de demostración</strong><small>Movimientos ficticios desde enero para probar gráficos, ciclos y filtros.</small></div>
                <div className="inline-actions"><button className="secondary-action compact-action" type="button" onClick={() => void handleLoadDemoData()}>Cargar datos</button><button className="danger-action compact-action" type="button" onClick={() => void handleRemoveDemoData()}>Quitar datos</button></div>
              </div>
              {demoFeedback ? <p className="status-message" role="status">{demoFeedback}</p> : null}
            </section>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
