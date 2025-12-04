import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventsStore, useAuthStore } from '../store/useStore';

export function useReminderAlarm() {
  const { reminders, fetchAllReminders } = useEventsStore();
  const { isAuthenticated } = useAuthStore();
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [snoozedReminders, setSnoozedReminders] = useState({});
  const checkedRemindersRef = useRef(new Set());

  // Fetch reminders on mount and every 30 seconds (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllReminders();
    const fetchInterval = setInterval(fetchAllReminders, 30000);
    return () => clearInterval(fetchInterval);
  }, [fetchAllReminders, isAuthenticated]);

  const checkReminders = useCallback(() => {
    if (!isAuthenticated || !Array.isArray(reminders)) return;

    const now = new Date();

    for (const reminder of reminders) {
      // Skip if already shown and dismissed (not snoozed)
      if (checkedRemindersRef.current.has(reminder.id) && !snoozedReminders[reminder.id]) {
        continue;
      }

      // Skip if already sent/completed
      if (reminder.enviado) {
        continue;
      }

      // Check if this reminder is snoozed and if snooze time has passed
      const snoozeTime = snoozedReminders[reminder.id];
      if (snoozeTime && new Date(snoozeTime) > now) {
        continue; // Still in snooze period
      }

      // Parse reminder time - handle different field names
      const reminderTimeStr = reminder.fecha_recordatorio || reminder.fechaRecordatorio;
      if (!reminderTimeStr) continue;

      const reminderTime = new Date(reminderTimeStr);

      // Get minutes before setting
      const minutosBefore = parseInt(reminder.minutos_antes || reminder.minutosAntes || 0);

      // Calculate the actual alert time (reminder time minus minutes before)
      const alertTime = new Date(reminderTime.getTime() - minutosBefore * 60 * 1000);

      // Check if alert time has been reached (within the last 2 minutes to avoid missing it)
      const timeDiff = now - alertTime;
      if (timeDiff >= 0 && timeDiff < 120000) {
        // Reminder is due!
        setActiveAlarm(reminder);
        return;
      }

      // Also check for snoozed reminders that are now due
      if (snoozeTime && new Date(snoozeTime) <= now) {
        setActiveAlarm(reminder);
        // Remove from snoozed
        setSnoozedReminders(prev => {
          const next = { ...prev };
          delete next[reminder.id];
          return next;
        });
        return;
      }
    }
  }, [reminders, snoozedReminders, isAuthenticated]);

  // Check reminders every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [checkReminders, isAuthenticated]);

  const dismissAlarm = useCallback(() => {
    if (activeAlarm) {
      checkedRemindersRef.current.add(activeAlarm.id);
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  const snoozeAlarm = useCallback(() => {
    if (activeAlarm) {
      // Set snooze for 5 minutes from now
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
      setSnoozedReminders(prev => ({
        ...prev,
        [activeAlarm.id]: snoozeTime.toISOString(),
      }));
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  return {
    activeAlarm,
    dismissAlarm,
    snoozeAlarm,
  };
}

export default useReminderAlarm;
