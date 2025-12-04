// Account Types
export const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personal', icon: 'wallet-outline' },
  { value: 'negocio', label: 'Negocio', icon: 'storefront-outline' },
  { value: 'ahorro', label: 'Ahorro', icon: 'cash-outline' },
  { value: 'compartida', label: 'Compartida', icon: 'people-outline' },
];

// Currencies
export const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar estadounidense', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - Libra esterlina', symbol: '£' },
  { value: 'MXN', label: 'MXN - Peso mexicano', symbol: '$' },
  { value: 'ARS', label: 'ARS - Peso argentino', symbol: '$' },
  { value: 'BRL', label: 'BRL - Real brasileño', symbol: 'R$' },
  { value: 'COP', label: 'COP - Peso colombiano', symbol: '$' },
];

// Movement Types (must match DB enum: 'ingreso', 'gasto')
export const MOVEMENT_TYPES = [
  { value: 'ingreso', label: 'Ingreso', color: '#10b981' },
  { value: 'gasto', label: 'Gasto', color: '#ef4444' },
];

// Movement Status (must match DB enum: 'confirmado', 'pendiente_revision')
export const MOVEMENT_STATUS = [
  { value: 'pendiente_revision', label: 'Pendiente', color: '#f59e0b' },
  { value: 'confirmado', label: 'Confirmado', color: '#10b981' },
];

// Task Status
export const TASK_STATUS = [
  { value: 'todo', label: 'Por hacer', color: '#6b7280' },
  { value: 'in_progress', label: 'En progreso', color: '#3b82f6' },
  { value: 'done', label: 'Completada', color: '#10b981' },
];

// Task Priority
export const TASK_PRIORITY = [
  { value: 'low', label: 'Baja', color: '#6b7280' },
  { value: 'medium', label: 'Media', color: '#f59e0b' },
  { value: 'high', label: 'Alta', color: '#ef4444' },
];

// Colors
export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
};

// Account Type Colors (for cards)
export const ACCOUNT_TYPE_COLORS = {
  personal: { from: '#6366f1', to: '#8b5cf6' },
  negocio: { from: '#10b981', to: '#14b8a6' },
  ahorro: { from: '#f59e0b', to: '#fbbf24' },
  compartida: { from: '#ec4899', to: '#f472b6' },
};

// Category Default Colors
export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

// Format currency helper
export const formatCurrency = (amount, currency = 'USD') => {
  const currencyInfo = CURRENCIES.find((c) => c.value === currency) || CURRENCIES[0];
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${currencyInfo.symbol}${formatted}`;
};

// Format date helper
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  if (format === 'long') {
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (format === 'time') {
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (format === 'datetime') {
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('es-ES');
};

// Get account type info
export const getAccountTypeInfo = (type) => {
  return ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];
};

// Get currency info
export const getCurrencyInfo = (currency) => {
  return CURRENCIES.find((c) => c.value === currency) || CURRENCIES[0];
};

// Get task status info
export const getTaskStatusInfo = (status) => {
  return TASK_STATUS.find((s) => s.value === status) || TASK_STATUS[0];
};

// Get task priority info
export const getTaskPriorityInfo = (priority) => {
  return TASK_PRIORITY.find((p) => p.value === priority) || TASK_PRIORITY[0];
};
