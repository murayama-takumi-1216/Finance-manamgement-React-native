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
    if (!isAuthenticated) {
      console.log('[ReminderAlarm] Not authenticated yet, waiting...');
      return;
    }

    console.log('[ReminderAlarm] Authenticated! Fetching reminders...');
    fetchAllReminders().then(() => {
      console.log('[ReminderAlarm] Initial fetch complete');
    });
    const fetchInterval = setInterval(() => {
      console.log('[ReminderAlarm] Periodic fetch');
      fetchAllReminders();
    }, 30000);
    return () => clearInterval(fetchInterval);
  }, [fetchAllReminders, isAuthenticated]);

  const checkReminders = useCallback(() => {
    if (!isAuthenticated) {
      console.log('[ReminderAlarm] Not authenticated, skipping check');
      return;
    }

    if (!Array.isArray(reminders)) {
      console.log('[ReminderAlarm] Reminders not an array:', reminders);
      return;
    }

    // Don't check if an alarm is already showing
    if (activeAlarm) {
      return;
    }

    console.log('[ReminderAlarm] Checking', reminders.length, 'reminders');
    const now = new Date();

    for (const reminder of reminders) {
      // Skip if already dismissed by clicking OK (in this session)
      if (checkedRemindersRef.current.has(reminder.id)) {
        console.log('[ReminderAlarm] Skipping - already dismissed:', reminder.id);
        continue;
      }

      // Skip if already sent/completed by backend (user already saw it)
      if (reminder.enviado) {
        console.log('[ReminderAlarm] Skipping - already enviado:', reminder.id);
        continue;
      }

      // Check if this reminder is snoozed and if snooze time has passed
      const snoozeTime = snoozedReminders[reminder.id];
      if (snoozeTime && new Date(snoozeTime) > now) {
        continue; // Still in snooze period
      }

      // Parse reminder time - handle different field names
      // Note: Backend already stores fecha_recordatorio as the adjusted time (event time - minutos_antes)
      // So we should NOT subtract minutos_antes again
      const reminderTimeStr = reminder.fecha_recordatorio || reminder.fechaRecordatorio;
      if (!reminderTimeStr) {
        console.log('[ReminderAlarm] No date for reminder:', reminder.id);
        continue;
      }

      // The stored fecha_recordatorio IS the alert time (already adjusted)
      const alertTime = new Date(reminderTimeStr);

      // Check if alert time has been reached
      // Allow up to 24 hours window to catch reminders that might have been missed
      // (e.g., if app was closed when reminder was due)
      const timeDiff = now - alertTime;
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 86400000 ms

      if (timeDiff >= 0 && timeDiff < TWENTY_FOUR_HOURS) { // 24 hours window
        // Reminder is due!
        console.log('[ReminderAlarm] TRIGGERING ALARM for:', reminder.id, reminder.mensaje);
        setActiveAlarm(reminder);
        return;
      }

      // Also check for snoozed reminders that are now due
      if (snoozeTime && new Date(snoozeTime) <= now) {
        console.log('[ReminderAlarm] Snoozed reminder is due:', reminder.mensaje);
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
  }, [reminders, snoozedReminders, isAuthenticated, activeAlarm]);

  // Check reminders every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [checkReminders, isAuthenticated]);

  const dismissAlarm = useCallback(() => {
    if (activeAlarm) {
      console.log('[ReminderAlarm] Dismissing reminder:', activeAlarm.id, '- will not show again');
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
