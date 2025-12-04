import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authAPI,
  accountsAPI,
  categoriesAPI,
  tagsAPI,
  tasksAPI,
  eventsAPI,
  remindersAPI,
  notificationsAPI,
  preferencesAPI,
} from '../services/api';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      initializeAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitialized: true, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const response = await authAPI.getProfile();
          set({
            user: response.data.user || response.data,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          console.log('Auth initialization error:', error.message);
          // Clear all auth data on error
          try {
            await AsyncStorage.multiRemove(['token', 'user', 'auth-storage']);
          } catch (e) {
            console.log('Error clearing auth data:', e);
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null, // Don't show error on init, just redirect to login
          });
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data;

          await AsyncStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Error al iniciar sesión. Verifica tu conexión.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (nombre, email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authAPI.register({ nombre, email, password });
          const { user, token } = response.data;

          await AsyncStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Error al registrarse. Verifica tu conexión.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          console.log('Error during logout:', e);
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        try {
          set({ isLoading: true });
          const response = await authAPI.getProfile();
          set({ user: response.data.user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authAPI.updateProfile(data);
          set({ user: response.data.user, isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || 'Error al actualizar perfil';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (data) => {
        try {
          set({ isLoading: true, error: null });
          await authAPI.changePassword(data);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || 'Error al cambiar contraseña';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// Accounts Store
export const useAccountsStore = create((set, get) => ({
  accounts: [],
  currentAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await accountsAPI.getAll();
      const accountsList = response.data.accounts || response.data;

      // Fetch detailed data (including balance) for each account in parallel
      const accountsWithBalance = await Promise.all(
        accountsList.map(async (account) => {
          try {
            const detailResponse = await accountsAPI.getById(account.id);
            return detailResponse.data.account || detailResponse.data;
          } catch {
            return account; // Return original if detail fetch fails
          }
        })
      );

      set({ accounts: accountsWithBalance, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar cuentas', isLoading: false });
    }
  },

  fetchAccountById: async (accountId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await accountsAPI.getById(accountId);
      const account = response.data.account || response.data;
      set({ currentAccount: account, isLoading: false });
      return account;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar cuenta', isLoading: false });
      return null;
    }
  },

  createAccount: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await accountsAPI.create(data);
      const newAccount = response.data.account || response.data;
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isLoading: false,
      }));
      return { success: true, account: newAccount };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear cuenta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateAccount: async (accountId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await accountsAPI.update(accountId, data);
      const updatedAccount = response.data.account || response.data;
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === accountId ? updatedAccount : acc
        ),
        currentAccount:
          state.currentAccount?.id === accountId ? updatedAccount : state.currentAccount,
        isLoading: false,
      }));
      return { success: true, account: updatedAccount };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar cuenta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteAccount: async (accountId) => {
    try {
      set({ isLoading: true, error: null });
      await accountsAPI.delete(accountId);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc.id !== accountId),
        currentAccount: state.currentAccount?.id === accountId ? null : state.currentAccount,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar cuenta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  setCurrentAccount: (account) => set({ currentAccount: account }),
  clearCurrentAccount: () => set({ currentAccount: null }),
  clearError: () => set({ error: null }),
}));

// Categories Store
export const useCategoriesStore = create((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (accountId, tipo = null) => {
    try {
      set({ isLoading: true, error: null });
      const params = tipo ? { tipo } : {};
      const response = await categoriesAPI.getAll(accountId, params);
      set({ categories: response.data.categories || response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar categorías', isLoading: false });
    }
  },

  createCategory: async (accountId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await categoriesAPI.create(accountId, data);
      const newCategory = response.data.category || response.data;
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));
      return { success: true, category: newCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear categoría';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateCategory: async (accountId, categoryId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await categoriesAPI.update(accountId, categoryId, data);
      const updatedCategory = response.data.category || response.data;
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === categoryId ? updatedCategory : cat
        ),
        isLoading: false,
      }));
      return { success: true, category: updatedCategory };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar categoría';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteCategory: async (accountId, categoryId) => {
    try {
      set({ isLoading: true, error: null });
      await categoriesAPI.delete(accountId, categoryId);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== categoryId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar categoría';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearCategories: () => set({ categories: [] }),
  clearError: () => set({ error: null }),
}));

// Tags Store
export const useTagsStore = create((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async (accountId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await tagsAPI.getAll(accountId);
      set({ tags: response.data.tags || response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar etiquetas', isLoading: false });
    }
  },

  createTag: async (accountId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await tagsAPI.create(accountId, data);
      const newTag = response.data.tag || response.data;
      set((state) => ({
        tags: [...state.tags, newTag],
        isLoading: false,
      }));
      return { success: true, tag: newTag };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear etiqueta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateTag: async (accountId, tagId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await tagsAPI.update(accountId, tagId, data);
      const updatedTag = response.data.tag || response.data;
      set((state) => ({
        tags: state.tags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
        isLoading: false,
      }));
      return { success: true, tag: updatedTag };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar etiqueta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteTag: async (accountId, tagId) => {
    try {
      set({ isLoading: true, error: null });
      await tagsAPI.delete(accountId, tagId);
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== tagId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar etiqueta';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearTags: () => set({ tags: [] }),
  clearError: () => set({ error: null }),
}));

// Tasks Store
export const useTasksStore = create((set, get) => ({
  tasks: [],
  summary: null,
  pagination: { page: 1, limit: 20, total: 0 },
  isLoading: false,
  error: null,
  currentAccountId: null,

  fetchTasks: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const { accountId, ...queryParams } = params;

      let response;
      if (accountId) {
        response = await tasksAPI.getByAccount(accountId, queryParams);
        set({ currentAccountId: accountId });
      } else {
        response = await tasksAPI.getAll(queryParams);
        set({ currentAccountId: null });
      }

      set({
        tasks: response.data.tasks || response.data,
        pagination: response.data.pagination || get().pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar tareas', isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const response = await tasksAPI.getSummary();
      set({ summary: response.data });
    } catch (error) {
      console.error('Error fetching task summary:', error);
    }
  },

  createTask: async (data, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      let response;
      if (accountId) {
        response = await tasksAPI.createForAccount(accountId, data);
      } else {
        response = await tasksAPI.create(data);
      }
      const newTask = response.data.task || response.data;
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false,
      }));
      return { success: true, task: newTask };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear tarea';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateTask: async (taskId, data, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      let response;
      if (accountId) {
        response = await tasksAPI.updateForAccount(accountId, taskId, data);
      } else {
        response = await tasksAPI.update(taskId, data);
      }
      const updatedTask = response.data.task || response.data;
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
        isLoading: false,
      }));
      return { success: true, task: updatedTask };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar tarea';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateTaskStatus: async (taskId, estado, comentario = null) => {
    try {
      set({ isLoading: true, error: null });
      const response = await tasksAPI.updateStatus(taskId, { estado, comentario });
      const updatedTask = response.data.task || response.data;
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
        isLoading: false,
      }));
      return { success: true, task: updatedTask };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar estado';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteTask: async (taskId, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      if (accountId) {
        await tasksAPI.deleteForAccount(accountId, taskId);
      } else {
        await tasksAPI.delete(taskId);
      }
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar tarea';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearTasks: () => set({ tasks: [], summary: null }),
  clearError: () => set({ error: null }),
}));

// Events Store
export const useEventsStore = create((set, get) => ({
  events: [],
  upcomingEvents: [],
  reminders: [],
  pagination: { page: 1, limit: 20, total: 0 },
  isLoading: false,
  error: null,

  fetchEvents: async (accountId = null, params = {}) => {
    try {
      set({ isLoading: true, error: null });
      let response;
      if (accountId) {
        response = await eventsAPI.getByAccount(accountId, params);
      } else {
        response = await eventsAPI.getAll(params);
      }
      const eventsData = response.data.events || response.data;
      set({
        events: Array.isArray(eventsData) ? eventsData : [],
        pagination: response.data.pagination || get().pagination,
        isLoading: false,
      });
    } catch (error) {
      set((state) => ({
        error: error.response?.data?.message || 'Error al cargar eventos',
        isLoading: false,
        events: Array.isArray(state.events) ? state.events : [],
      }));
    }
  },

  fetchUpcomingEvents: async (limit = 5) => {
    try {
      const response = await eventsAPI.getUpcoming(limit);
      const upcomingData = response.data.events || response.data;
      set({ upcomingEvents: Array.isArray(upcomingData) ? upcomingData : [] });
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  },

  fetchEventsByDateRange: async (fechaInicio, fechaFin) => {
    try {
      set({ isLoading: true, error: null });
      const response = await eventsAPI.getByDateRange(fechaInicio, fechaFin);
      const rangeEventsData = response.data.events || response.data;
      set({ events: Array.isArray(rangeEventsData) ? rangeEventsData : [], isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar eventos', isLoading: false });
    }
  },

  createEvent: async (data, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      let response;
      if (accountId) {
        response = await eventsAPI.createForAccount(accountId, data);
      } else {
        response = await eventsAPI.create(data);
      }
      const newEvent = response.data.event || response.data;
      set((state) => ({
        events: [newEvent, ...state.events],
        isLoading: false,
      }));
      return { success: true, event: newEvent };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear evento';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateEvent: async (eventId, data, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      let response;
      if (accountId) {
        response = await eventsAPI.updateForAccount(accountId, eventId, data);
      } else {
        response = await eventsAPI.update(eventId, data);
      }
      const updatedEvent = response.data.event || response.data;
      set((state) => ({
        events: state.events.map((event) => (event.id === eventId ? updatedEvent : event)),
        isLoading: false,
      }));
      return { success: true, event: updatedEvent };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar evento';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteEvent: async (eventId, accountId = null) => {
    try {
      set({ isLoading: true, error: null });
      if (accountId) {
        await eventsAPI.deleteForAccount(accountId, eventId);
      } else {
        await eventsAPI.delete(eventId);
      }
      set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar evento';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchReminders: async (accountId) => {
    try {
      const response = await remindersAPI.getByAccount(accountId);
      set({ reminders: response.data.reminders || response.data });
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  fetchAllReminders: async () => {
    try {
      const response = await remindersAPI.getAllUserReminders();
      set({ reminders: response.data.reminders || response.data });
    } catch (error) {
      console.error('Error fetching all reminders:', error);
    }
  },

  createReminder: async (accountId, data) => {
    try {
      const response = await remindersAPI.createForAccount(accountId, data);
      const newReminder = response.data.reminder || response.data;
      set((state) => ({
        reminders: [...state.reminders, newReminder],
      }));
      return { success: true, reminder: newReminder };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al crear recordatorio' };
    }
  },

  deleteReminder: async (accountId, reminderId) => {
    try {
      await remindersAPI.deleteForAccount(accountId, reminderId);
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== reminderId),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al eliminar recordatorio' };
    }
  },

  clearEvents: () => set({ events: [], upcomingEvents: [], reminders: [] }),
  clearError: () => set({ error: null }),
}));

// Notifications Store
const DEFAULT_PREFERENCES = {
  notificationsEnabled: true,
  notificationSound: 'default',
  notificationVolume: 80,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  emailNotifications: true,
  browserNotifications: true,
  timezone: 'UTC',
};

export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  preferences: DEFAULT_PREFERENCES,
  availableSounds: [],

  fetchNotifications: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationsAPI.getAll(params);
      set({
        notifications: response.data.notifications || response.data,
        unreadCount: response.data.unreadCount || 0,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar notificaciones', isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      set({ unreadCount: response.data.count || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, leido: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, leido: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  clearAllNotifications: async () => {
    try {
      await notificationsAPI.clearAll();
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  fetchPreferences: async () => {
    try {
      const response = await preferencesAPI.get();
      const apiPreferences = response.data.preferences || response.data;
      const sounds = response.data.availableSounds || [];
      set({
        preferences: { ...DEFAULT_PREFERENCES, ...apiPreferences },
        availableSounds: sounds,
      });
    } catch (error) {
      console.log('Preferences API fetch error (using defaults):', error.message);
    }
  },

  fetchAvailableSounds: async () => {
    try {
      const response = await preferencesAPI.getSounds();
      set({ availableSounds: response.data.sounds || [] });
    } catch (error) {
      console.error('Error fetching sounds:', error);
    }
  },

  uploadSound: async (formData) => {
    try {
      const response = await preferencesAPI.uploadSound(formData);
      const newSound = response.data.sound || response.data;
      set((state) => ({
        availableSounds: [...state.availableSounds, newSound],
      }));
      return { success: true, sound: newSound };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al subir sonido';
      return { success: false, error: errorMessage };
    }
  },

  deleteSound: async (soundId) => {
    try {
      await preferencesAPI.deleteSound(soundId);
      set((state) => ({
        availableSounds: state.availableSounds.filter((s) => s.id !== soundId),
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar sonido';
      return { success: false, error: errorMessage };
    }
  },

  updatePreferences: async (data) => {
    const currentPreferences = get().preferences || DEFAULT_PREFERENCES;
    const newPreferences = { ...currentPreferences, ...data };
    set({ preferences: newPreferences });

    try {
      await preferencesAPI.update(data);
      return { success: true };
    } catch (error) {
      console.log('Preferences API error:', error.message);
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),
}));

// UI Store
export const useUIStore = create((set) => ({
  isRefreshing: false,
  activeTab: 'dashboard',

  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
