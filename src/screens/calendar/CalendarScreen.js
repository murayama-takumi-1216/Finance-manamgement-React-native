import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useEventsStore, useAccountsStore } from '../../store/useStore';
import {
  Card,
  Loading,
  Modal,
  Button,
  Input,
  ConfirmDialog,
} from '../../components/common';
import { COLORS, formatDate, formatCurrency } from '../../constants';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

const EVENT_TYPES = [
  { value: 'pago_unico', label: 'Pago Unico', icon: 'card-outline', color: COLORS.primary },
  { value: 'pago_recurrente', label: 'Pago Recurrente', icon: 'repeat-outline', color: '#8B5CF6' },
  { value: 'recordatorio_generico', label: 'Recordatorio', icon: 'alarm-outline', color: COLORS.warning },
];

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Sin repeticion' },
  { value: 'diaria', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
];

const REMINDER_OPTIONS = [
  { value: '0', label: 'Al momento del evento' },
  { value: '15', label: '15 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
  { value: '10080', label: '1 semana antes' },
];

const CalendarScreen = ({ navigation }) => {
  const {
    events: eventsData,
    reminders: remindersData,
    fetchEvents,
    fetchAllReminders,
    createEvent,
    updateEvent,
    deleteEvent,
    createReminder,
    deleteReminder,
    isLoading,
  } = useEventsStore();

  const { selectedAccount, accounts } = useAccountsStore();

  // Helper to get account name from event
  const getAccountName = (event) => {
    // Backend returns cuenta: { id, nombre } for getAll, or just id_cuenta for getByAccount
    if (event.cuenta?.nombre) {
      return event.cuenta.nombre;
    }
    const accountId = event.id_cuenta || event.idCuenta || event.accountId || event.cuenta?.id;
    if (!accountId) return null;
    const account = accounts.find(a => a.id === accountId || a.id === parseInt(accountId));
    return account?.nombre || account?.name || null;
  };

  // Ensure events and reminders are always arrays
  const events = Array.isArray(eventsData) ? eventsData : [];
  const reminders = Array.isArray(remindersData) ? remindersData : [];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Modals
  const [viewEventsModalVisible, setViewEventsModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteReminderDialogVisible, setDeleteReminderDialogVisible] = useState(false);

  // Selected items
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);

  // Date pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  // Event form data
  const [eventFormData, setEventFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'pago_unico',
    monto: '',
    recurrencia: '',
    fecha: new Date(),
  });

  // Reminder form data
  const [reminderFormData, setReminderFormData] = useState({
    mensaje: '',
    fecha: new Date(),
    minutos_antes: '15',
    notification_sound: 'default',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Fetch ALL events (not filtered by account) for the admin calendar view
    fetchEvents(null, { start, end });
    fetchAllReminders();
  }, [fetchEvents, fetchAllReminders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    await Promise.all([fetchEvents(null, { start, end }), fetchAllReminders()]);
    setRefreshing(false);
  }, [fetchEvents, fetchAllReminders]);

  // Event Modal Functions
  const resetEventForm = () => {
    const dateObj = new Date(selectedDate + 'T09:00:00');
    setEventFormData({
      titulo: '',
      descripcion: '',
      tipo: 'pago_unico',
      monto: '',
      recurrencia: '',
      fecha: dateObj,
    });
    setErrors({});
    setSelectedEvent(null);
  };

  const openEventModal = (event = null) => {
    if (event) {
      setSelectedEvent(event);
      setEventFormData({
        titulo: event.titulo || '',
        descripcion: event.descripcion || '',
        tipo: event.tipo || 'pago_unico',
        monto: event.monto ? String(event.monto) : '',
        recurrencia: event.recurrencia || '',
        fecha: new Date(event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio || new Date()),
      });
    } else {
      resetEventForm();
    }
    setViewEventsModalVisible(false);
    setEventModalVisible(true);
  };

  const openViewEventsModal = (dateString) => {
    setSelectedDate(dateString);
    setViewEventsModalVisible(true);
  };

  // Reminder Modal Functions
  const resetReminderForm = () => {
    setReminderFormData({
      mensaje: '',
      fecha: new Date(),
      minutos_antes: '15',
      notification_sound: 'default',
    });
    setErrors({});
  };

  const openReminderModal = () => {
    resetReminderForm();
    setReminderModalVisible(true);
  };

  const validateEvent = () => {
    const newErrors = {};
    if (!eventFormData.titulo.trim()) {
      newErrors.titulo = 'El titulo es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReminder = () => {
    const newErrors = {};
    if (!reminderFormData.mensaje.trim()) {
      newErrors.mensaje = 'El mensaje es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEvent = async () => {
    if (!validateEvent()) return;

    setSaving(true);
    try {
      const payload = {
        titulo: eventFormData.titulo,
        descripcion: eventFormData.descripcion || null,
        fecha_hora_inicio: eventFormData.fecha.toISOString(),
        tipo: eventFormData.tipo,
        monto: eventFormData.monto ? parseFloat(eventFormData.monto) : null,
        recurrencia: eventFormData.recurrencia || null,
        id_cuenta: selectedAccount?.id || null,
      };

      let result;
      if (selectedEvent) {
        // Pass accountId for account-scoped update
        const eventAccountId = selectedEvent.id_cuenta || selectedEvent.idCuenta || selectedAccount?.id;
        result = await updateEvent(selectedEvent.id, payload, eventAccountId);
      } else {
        // Pass accountId for account-scoped creation
        result = await createEvent(payload, selectedAccount?.id);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedEvent ? 'Evento actualizado' : 'Evento creado',
        });
        setEventModalVisible(false);
        resetEventForm();
        // Refresh all events
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1).toISOString().split('T')[0];
        const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
        fetchEvents(null, { start, end });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!validateReminder()) return;

    setSaving(true);
    try {
      const payload = {
        mensaje: reminderFormData.mensaje,
        fecha_recordatorio: reminderFormData.fecha.toISOString(),
        minutos_antes: parseInt(reminderFormData.minutos_antes) || 0,
        notification_sound: reminderFormData.notification_sound,
      };

      const result = await createReminder(selectedAccount?.id, payload);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Recordatorio creado',
        });
        setReminderModalVisible(false);
        resetReminderForm();
        fetchAllReminders();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    try {
      // Pass accountId for account-scoped deletion
      const eventAccountId = selectedEvent.id_cuenta || selectedEvent.idCuenta || selectedAccount?.id;
      const result = await deleteEvent(selectedEvent.id, eventAccountId);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Evento eliminado',
        });
        setDeleteDialogVisible(false);
        setSelectedEvent(null);
        // Refresh all events
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1).toISOString().split('T')[0];
        const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
        fetchEvents(null, { start, end });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async () => {
    if (!selectedReminder) return;

    setSaving(true);
    try {
      const result = await deleteReminder(selectedAccount?.id, selectedReminder.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Recordatorio eliminado',
        });
        setDeleteReminderDialogVisible(false);
        setSelectedReminder(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const openDeleteEventDialog = (event) => {
    setSelectedEvent(event);
    setDeleteDialogVisible(true);
  };

  const openDeleteReminderDialog = (reminder) => {
    setSelectedReminder(reminder);
    setDeleteReminderDialogVisible(true);
  };

  const previewSound = (soundId) => {
    notificationSound.preview(soundId, 80);
  };

  // Generate marked dates for calendar
  const markedDates = events.reduce((acc, event) => {
    const eventDate = event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio;
    if (!eventDate) return acc;
    const date = eventDate.split('T')[0];
    acc[date] = {
      marked: true,
      dotColor: COLORS.primary,
      selected: date === selectedDate,
      selectedColor: COLORS.primary,
    };
    return acc;
  }, {});

  // Add selected date if not already marked
  if (!markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: COLORS.primary,
    };
  } else {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = COLORS.primary;
  }

  // Filter events for selected date
  const selectedDateEvents = events.filter((event) => {
    const eventDate = event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio;
    return eventDate && eventDate.split('T')[0] === selectedDate;
  });

  // Filter reminders for selected date
  const selectedDateReminders = reminders.filter((reminder) => {
    const reminderDate = reminder.fecha_recordatorio || reminder.fechaRecordatorio;
    return reminderDate && reminderDate.split('T')[0] === selectedDate;
  });

  // Upcoming events (next 5)
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio;
      return eventDate && new Date(eventDate) >= new Date();
    })
    .sort((a, b) => {
      const aDate = a.fecha || a.fechaHoraInicio || a.fecha_hora_inicio;
      const bDate = b.fecha || b.fechaHoraInicio || b.fecha_hora_inicio;
      return new Date(aDate) - new Date(bDate);
    })
    .slice(0, 5);

  // Active reminders
  const activeReminders = reminders.filter((r) => !r.enviado).slice(0, 5);

  const getEventTypeInfo = (tipo) => {
    return EVENT_TYPES.find((t) => t.value === tipo) || EVENT_TYPES[0];
  };

  if (isLoading && events.length === 0) {
    return <Loading text="Cargando calendario..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Add Buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openReminderModal}
          >
            <Ionicons name="alarm-outline" size={18} color={COLORS.primary} />
            <Text style={styles.headerButtonText}>Recordatorio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonPrimary]}
            onPress={() => openEventModal()}
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={[styles.headerButtonText, { color: COLORS.white }]}>
              Nuevo Evento
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={(day) => openViewEventsModal(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: COLORS.white,
            calendarBackground: COLORS.white,
            textSectionTitleColor: COLORS.gray[600],
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: COLORS.white,
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.gray[900],
            textDisabledColor: COLORS.gray[300],
            dotColor: COLORS.primary,
            selectedDotColor: COLORS.white,
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.gray[900],
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
          }}
          style={styles.calendar}
        />

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Proximos Eventos</Text>
          </View>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const eventType = getEventTypeInfo(event.tipo);
              const eventDate = event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio;
              const accountName = getAccountName(event);
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <TouchableOpacity
                    onPress={() => openEventModal(event)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventHeader}>
                      <View
                        style={[
                          styles.eventTypeIcon,
                          { backgroundColor: eventType.color + '20' },
                        ]}
                      >
                        <Ionicons
                          name={eventType.icon}
                          size={18}
                          color={eventType.color}
                        />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.titulo}</Text>
                        <Text style={styles.eventDate}>
                          {formatDate(eventDate, 'long')}
                        </Text>
                        {accountName && (
                          <View style={styles.accountTag}>
                            <Ionicons name="wallet-outline" size={12} color={COLORS.gray[500]} />
                            <Text style={styles.accountTagText}>{accountName}</Text>
                          </View>
                        )}
                        {event.monto && (
                          <Text style={styles.eventAmount}>
                            {formatCurrency(event.monto, selectedAccount?.moneda)}
                          </Text>
                        )}
                        {event.recurrencia && (
                          <View style={styles.recurrenceTag}>
                            <Ionicons
                              name="repeat-outline"
                              size={12}
                              color={COLORS.gray[500]}
                            />
                            <Text style={styles.recurrenceText}>
                              {RECURRENCE_OPTIONS.find(
                                (r) => r.value === event.recurrencia
                              )?.label || event.recurrencia}
                            </Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => openDeleteEventDialog(event)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay eventos proximos</Text>
            </View>
          )}
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alarm" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Recordatorios</Text>
          </View>
          {activeReminders.length > 0 ? (
            activeReminders.map((reminder) => {
              const accountName = getAccountName(reminder);
              return (
                <Card
                  key={reminder.id}
                  style={[styles.eventCard, styles.reminderCard]}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons name="alarm" size={18} color={COLORS.warning} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>
                        {reminder.mensaje || reminder.titulo}
                      </Text>
                      {(reminder.fecha_recordatorio || reminder.fechaRecordatorio) && (
                        <Text style={styles.eventDate}>
                          {formatDate(reminder.fecha_recordatorio || reminder.fechaRecordatorio, 'long')} -{' '}
                          {formatDate(reminder.fecha_recordatorio || reminder.fechaRecordatorio, 'time')}
                        </Text>
                      )}
                      {accountName && (
                        <View style={styles.accountTag}>
                          <Ionicons name="wallet-outline" size={12} color={COLORS.gray[500]} />
                          <Text style={styles.accountTagText}>{accountName}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => openDeleteReminderDialog(reminder)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay recordatorios activos</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* View Events Modal (when clicking on a date) */}
      <Modal
        visible={viewEventsModalVisible}
        onClose={() => setViewEventsModalVisible(false)}
        title={formatDate(selectedDate, 'long')}
      >
        <ScrollView style={styles.modalScrollView}>
          {/* Events Section */}
          {selectedDateEvents.length > 0 && (
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.modalSectionTitle}>Eventos</Text>
              </View>
              {selectedDateEvents.map((event) => {
                const eventType = getEventTypeInfo(event.tipo);
                const accountName = getAccountName(event);
                return (
                  <Card key={event.id} style={styles.modalEventCard}>
                    <View style={styles.eventHeader}>
                      <View
                        style={[
                          styles.eventTypeIcon,
                          { backgroundColor: eventType.color + '20' },
                        ]}
                      >
                        <Ionicons
                          name={eventType.icon}
                          size={18}
                          color={eventType.color}
                        />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.titulo}</Text>
                        <Text style={styles.eventTypeLabel}>{eventType.label}</Text>
                        {accountName && (
                          <View style={styles.accountTag}>
                            <Ionicons name="wallet-outline" size={12} color={COLORS.gray[500]} />
                            <Text style={styles.accountTagText}>{accountName}</Text>
                          </View>
                        )}
                        {event.monto && (
                          <Text style={styles.eventAmount}>
                            {formatCurrency(event.monto, selectedAccount?.moneda)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => openEventModal(event)}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={COLORS.gray[600]}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => {
                            setViewEventsModalVisible(false);
                            openDeleteEventDialog(event);
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={COLORS.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Reminders Section */}
          {selectedDateReminders.length > 0 && (
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="alarm" size={16} color={COLORS.warning} />
                <Text style={styles.modalSectionTitle}>Recordatorios</Text>
              </View>
              {selectedDateReminders.map((reminder) => {
                const accountName = getAccountName(reminder);
                return (
                  <Card key={reminder.id} style={[styles.modalEventCard, styles.modalReminderCard]}>
                    <View style={styles.eventHeader}>
                      <View style={styles.reminderIconContainer}>
                        <Ionicons name="alarm" size={18} color={COLORS.warning} />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>
                          {reminder.mensaje || reminder.titulo}
                        </Text>
                        <Text style={styles.eventDate}>
                          {formatDate(reminder.fecha_recordatorio || reminder.fechaRecordatorio, 'time')}
                        </Text>
                        {accountName && (
                          <View style={styles.accountTag}>
                            <Ionicons name="wallet-outline" size={12} color={COLORS.gray[500]} />
                            <Text style={styles.accountTagText}>{accountName}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          setViewEventsModalVisible(false);
                          openDeleteReminderDialog(reminder);
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {selectedDateEvents.length === 0 && selectedDateReminders.length === 0 && (
            <View style={styles.emptyStateModal}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>No hay eventos ni recordatorios</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.modalFooterColumn}>
          <View style={styles.modalFooter}>
            <Button
              title="Agregar Evento"
              onPress={() => openEventModal()}
              style={styles.modalButton}
              icon={<Ionicons name="calendar-outline" size={18} color={COLORS.white} />}
            />
            <Button
              title="Recordatorio"
              variant="outline"
              onPress={() => {
                setViewEventsModalVisible(false);
                // Set reminder date to selected date
                const dateObj = new Date(selectedDate + 'T09:00:00');
                setReminderFormData({
                  mensaje: '',
                  fecha: dateObj,
                  minutos_antes: '15',
                  notification_sound: 'default',
                });
                setReminderModalVisible(true);
              }}
              style={styles.modalButton}
              icon={<Ionicons name="alarm-outline" size={18} color={COLORS.primary} />}
            />
          </View>
          <Button
            title="Cerrar"
            variant="outline"
            onPress={() => setViewEventsModalVisible(false)}
            style={styles.closeButton}
          />
        </View>
      </Modal>

      {/* Create/Edit Event Modal */}
      <Modal
        visible={eventModalVisible}
        onClose={() => {
          setEventModalVisible(false);
          resetEventForm();
        }}
        title={selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
      >
        <ScrollView style={styles.modalScrollView}>
          <Input
            label="Titulo"
            value={eventFormData.titulo}
            onChangeText={(text) => {
              setEventFormData({ ...eventFormData, titulo: text });
              if (errors.titulo) setErrors({ ...errors, titulo: null });
            }}
            placeholder="Titulo del evento"
            error={errors.titulo}
          />

          {/* Date Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha y Hora</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray[600]} />
                <Text style={styles.datePickerText}>
                  {eventFormData.fecha.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.gray[600]} />
                <Text style={styles.datePickerText}>
                  {eventFormData.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={eventFormData.fecha}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  const newDate = new Date(eventFormData.fecha);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setEventFormData({ ...eventFormData, fecha: newDate });
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={eventFormData.fecha}
              mode="time"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) {
                  const newDate = new Date(eventFormData.fecha);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setEventFormData({ ...eventFormData, fecha: newDate });
                }
              }}
            />
          )}

          {/* Event Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Evento</Text>
            <View style={styles.typeOptions}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    eventFormData.tipo === type.value && styles.typeOptionActive,
                    eventFormData.tipo === type.value && { borderColor: type.color },
                  ]}
                  onPress={() => setEventFormData({ ...eventFormData, tipo: type.value })}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={eventFormData.tipo === type.value ? type.color : COLORS.gray[500]}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      eventFormData.tipo === type.value && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount (for payment types) */}
          {(eventFormData.tipo === 'pago_unico' || eventFormData.tipo === 'pago_recurrente') && (
            <Input
              label="Monto"
              value={eventFormData.monto}
              onChangeText={(text) => setEventFormData({ ...eventFormData, monto: text })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={<Ionicons name="cash-outline" size={20} color={COLORS.gray[400]} />}
            />
          )}

          {/* Recurrence */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Recurrencia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recurrenceOptions}>
                {RECURRENCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.recurrenceOption,
                      eventFormData.recurrencia === option.value && styles.recurrenceOptionActive,
                    ]}
                    onPress={() => setEventFormData({ ...eventFormData, recurrencia: option.value })}
                  >
                    <Text
                      style={[
                        styles.recurrenceOptionText,
                        eventFormData.recurrencia === option.value && styles.recurrenceOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Input
            label="Descripcion (opcional)"
            value={eventFormData.descripcion}
            onChangeText={(text) => setEventFormData({ ...eventFormData, descripcion: text })}
            placeholder="Descripcion del evento"
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => {
              setEventModalVisible(false);
              resetEventForm();
            }}
            style={styles.modalButton}
          />
          <Button
            title={selectedEvent ? 'Guardar' : 'Crear'}
            onPress={handleSaveEvent}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Create Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        onClose={() => {
          setReminderModalVisible(false);
          resetReminderForm();
        }}
        title="Nuevo Recordatorio"
      >
        <ScrollView style={styles.modalScrollView}>
          <Input
            label="Mensaje"
            value={reminderFormData.mensaje}
            onChangeText={(text) => {
              setReminderFormData({ ...reminderFormData, mensaje: text });
              if (errors.mensaje) setErrors({ ...errors, mensaje: null });
            }}
            placeholder="Mensaje del recordatorio"
            error={errors.mensaje}
          />

          {/* Date Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha y Hora</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowReminderDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray[600]} />
                <Text style={styles.datePickerText}>
                  {reminderFormData.fecha.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowReminderTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.gray[600]} />
                <Text style={styles.datePickerText}>
                  {reminderFormData.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showReminderDatePicker && (
            <DateTimePicker
              value={reminderFormData.fecha}
              mode="date"
              onChange={(event, date) => {
                setShowReminderDatePicker(false);
                if (date) {
                  const newDate = new Date(reminderFormData.fecha);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setReminderFormData({ ...reminderFormData, fecha: newDate });
                }
              }}
            />
          )}

          {showReminderTimePicker && (
            <DateTimePicker
              value={reminderFormData.fecha}
              mode="time"
              onChange={(event, date) => {
                setShowReminderTimePicker(false);
                if (date) {
                  const newDate = new Date(reminderFormData.fecha);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setReminderFormData({ ...reminderFormData, fecha: newDate });
                }
              }}
            />
          )}

          {/* Reminder Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Recordarme</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recurrenceOptions}>
                {REMINDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.recurrenceOption,
                      reminderFormData.minutos_antes === option.value && styles.recurrenceOptionActive,
                    ]}
                    onPress={() => setReminderFormData({ ...reminderFormData, minutos_antes: option.value })}
                  >
                    <Text
                      style={[
                        styles.recurrenceOptionText,
                        reminderFormData.minutos_antes === option.value && styles.recurrenceOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Notification Sound */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sonido de Notificacion</Text>
            <View style={styles.soundGrid}>
              {NOTIFICATION_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundOption,
                    reminderFormData.notification_sound === sound.id && styles.soundOptionActive,
                  ]}
                  onPress={() => setReminderFormData({ ...reminderFormData, notification_sound: sound.id })}
                >
                  <Text
                    style={[
                      styles.soundOptionText,
                      reminderFormData.notification_sound === sound.id && styles.soundOptionTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {sound.name}
                  </Text>
                  {sound.id !== 'none' && (
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={() => previewSound(sound.id)}
                    >
                      <Ionicons name="play" size={14} color={COLORS.gray[600]} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => {
              setReminderModalVisible(false);
              resetReminderForm();
            }}
            style={styles.modalButton}
          />
          <Button
            title="Guardar"
            onPress={handleSaveReminder}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Delete Event Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleDeleteEvent}
        title="Eliminar Evento"
        message={`¿Estas seguro de que deseas eliminar "${selectedEvent?.titulo}"?`}
        confirmText="Eliminar"
        loading={saving}
      />

      {/* Delete Reminder Dialog */}
      <ConfirmDialog
        visible={deleteReminderDialogVisible}
        onClose={() => {
          setDeleteReminderDialogVisible(false);
          setSelectedReminder(null);
        }}
        onConfirm={handleDeleteReminder}
        title="Eliminar Recordatorio"
        message={`¿Estas seguro de que deseas eliminar este recordatorio?`}
        confirmText="Eliminar"
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  headerButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  eventCard: {
    marginBottom: 12,
    padding: 14,
  },
  reminderCard: {
    backgroundColor: COLORS.warning + '08',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  eventTypeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  eventAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  recurrenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurrenceText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  accountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  accountTagText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  deleteBtn: {
    padding: 6,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateModal: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalEventCard: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: COLORS.gray[50],
  },
  modalReminderCard: {
    backgroundColor: COLORS.warning + '08',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  modalFooterColumn: {
    marginTop: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  datePickerText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  typeOptions: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    marginBottom: 8,
  },
  typeOptionActive: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  recurrenceOptionActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  recurrenceOptionText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  recurrenceOptionTextActive: {
    color: COLORS.primary,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%',
    padding: 10,
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  soundOptionActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  soundOptionText: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
    flex: 1,
  },
  soundOptionTextActive: {
    color: COLORS.primary,
  },
  playBtn: {
    padding: 4,
  },
});

export default CalendarScreen;
