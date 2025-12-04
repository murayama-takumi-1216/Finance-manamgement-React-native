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
import Toast from 'react-native-toast-message';
import { useEventsStore } from '../../store/useStore';
import {
  Card,
  Loading,
  Modal,
  Button,
  Input,
  ConfirmDialog,
} from '../../components/common';
import { COLORS, formatDate } from '../../constants';

const CalendarScreen = () => {
  const {
    events: eventsData,
    reminders: remindersData,
    fetchEvents,
    fetchAllReminders,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useEventsStore();

  // Ensure events and reminders are always arrays
  const events = Array.isArray(eventsData) ? eventsData : [];
  const reminders = Array.isArray(remindersData) ? remindersData : [];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'reminders'

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEvents();
    fetchAllReminders();
  }, [fetchEvents, fetchAllReminders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchAllReminders()]);
    setRefreshing(false);
  }, [fetchEvents]);

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_inicio: selectedDate + 'T09:00:00',
      fecha_fin: selectedDate + 'T10:00:00',
      ubicacion: '',
    });
    setErrors({});
    setSelectedEvent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      titulo: event.titulo,
      descripcion: event.descripcion || '',
      fecha_inicio: event.fecha_inicio,
      fecha_fin: event.fecha_fin || event.fecha_inicio,
      ubicacion: event.ubicacion || '',
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (event) => {
    setSelectedEvent(event);
    setDeleteDialogVisible(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let result;
      if (selectedEvent) {
        result = await updateEvent(selectedEvent.id, formData);
      } else {
        result = await createEvent(formData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedEvent ? 'Evento actualizado' : 'Evento creado',
        });
        setModalVisible(false);
        resetForm();
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

  const handleDelete = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    try {
      const result = await deleteEvent(selectedEvent.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Evento eliminado',
        });
        setDeleteDialogVisible(false);
        setSelectedEvent(null);
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

  // Generate marked dates for calendar
  const markedDates = events.reduce((acc, event) => {
    if (!event.fecha_inicio) return acc;
    const date = event.fecha_inicio.split('T')[0];
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
  const selectedDateEvents = events.filter(
    (event) => event.fecha_inicio && event.fecha_inicio.split('T')[0] === selectedDate
  );

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
        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
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

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={activeTab === 'events' ? COLORS.primary : COLORS.gray[500]}
            />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Eventos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reminders' && styles.tabActive]}
            onPress={() => setActiveTab('reminders')}
          >
            <Ionicons
              name="alarm-outline"
              size={18}
              color={activeTab === 'reminders' ? COLORS.primary : COLORS.gray[500]}
            />
            <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
              Recordatorios ({reminders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Events Tab Content */}
        {activeTab === 'events' && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={styles.eventsTitle}>
                {formatDate(selectedDate, 'long')}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={openCreateModal}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <TouchableOpacity
                  onPress={() => openEditModal(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTimeContainer}>
                      <Text style={styles.eventTime}>
                        {formatDate(event.fecha_inicio, 'time')}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.titulo}</Text>
                      {event.descripcion && (
                        <Text style={styles.eventDescription} numberOfLines={2}>
                          {event.descripcion}
                        </Text>
                      )}
                      {event.ubicacion && (
                        <View style={styles.locationRow}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={COLORS.gray[500]}
                          />
                          <Text style={styles.eventLocation}>
                            {event.ubicacion}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => openDeleteDialog(event)}
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
            ))
          ) : (
            <View style={styles.noEvents}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={COLORS.gray[300]}
              />
              <Text style={styles.noEventsText}>
                No hay eventos para esta fecha
              </Text>
              <Button
                title="Crear Evento"
                variant="outline"
                size="small"
                onPress={openCreateModal}
                style={styles.createButton}
              />
            </View>
            )}
          </View>
        )}

        {/* Reminders Tab Content */}
        {activeTab === 'reminders' && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={styles.eventsTitle}>Mis Recordatorios</Text>
            </View>

            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <Card key={reminder.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons name="alarm" size={20} color={COLORS.warning} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{reminder.titulo || reminder.mensaje}</Text>
                      {reminder.fecha_recordatorio && (
                        <Text style={styles.eventDescription}>
                          {formatDate(reminder.fecha_recordatorio, 'long')} - {formatDate(reminder.fecha_recordatorio, 'time')}
                        </Text>
                      )}
                      {reminder.canal && (
                        <View style={styles.locationRow}>
                          <Ionicons
                            name={reminder.canal === 'email' ? 'mail-outline' : 'notifications-outline'}
                            size={14}
                            color={COLORS.gray[500]}
                          />
                          <Text style={styles.eventLocation}>
                            {reminder.canal === 'email' ? 'Por email' : 'Notificación'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[
                      styles.reminderStatus,
                      { backgroundColor: reminder.enviado ? COLORS.success + '20' : COLORS.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.reminderStatusText,
                        { color: reminder.enviado ? COLORS.success : COLORS.warning }
                      ]}>
                        {reminder.enviado ? 'Enviado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.noEvents}>
                <Ionicons
                  name="alarm-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={styles.noEventsText}>
                  No hay recordatorios
                </Text>
                <Text style={styles.noEventsSubtext}>
                  Los recordatorios se crean desde los eventos
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title={selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
      >
        <Input
          label="Título"
          value={formData.titulo}
          onChangeText={(text) => {
            setFormData({ ...formData, titulo: text });
            if (errors.titulo) setErrors({ ...errors, titulo: null });
          }}
          placeholder="Título del evento"
          error={errors.titulo}
        />

        <Input
          label="Descripción (opcional)"
          value={formData.descripcion}
          onChangeText={(text) =>
            setFormData({ ...formData, descripcion: text })
          }
          placeholder="Descripción del evento"
          multiline
          numberOfLines={3}
        />

        <Input
          label="Fecha y hora de inicio"
          value={formData.fecha_inicio}
          onChangeText={(text) => {
            setFormData({ ...formData, fecha_inicio: text });
            if (errors.fecha_inicio)
              setErrors({ ...errors, fecha_inicio: null });
          }}
          placeholder="YYYY-MM-DDTHH:MM:SS"
          error={errors.fecha_inicio}
        />

        <Input
          label="Fecha y hora de fin (opcional)"
          value={formData.fecha_fin}
          onChangeText={(text) => setFormData({ ...formData, fecha_fin: text })}
          placeholder="YYYY-MM-DDTHH:MM:SS"
        />

        <Input
          label="Ubicación (opcional)"
          value={formData.ubicacion}
          onChangeText={(text) =>
            setFormData({ ...formData, ubicacion: text })
          }
          placeholder="Ubicación del evento"
        />

        <View style={styles.modalButtons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => {
              setModalVisible(false);
              resetForm();
            }}
            style={styles.modalButton}
          />
          <Button
            title={selectedEvent ? 'Guardar' : 'Crear'}
            onPress={handleSave}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de que deseas eliminar "${selectedEvent?.titulo}"?`}
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
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  eventsSection: {
    padding: 16,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    marginBottom: 12,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
  },
  eventTimeContainer: {
    width: 60,
    marginRight: 12,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  deleteBtn: {
    padding: 4,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 12,
    marginBottom: 16,
  },
  noEventsSubtext: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'center',
  },
  createButton: {
    minWidth: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  reminderStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CalendarScreen;
