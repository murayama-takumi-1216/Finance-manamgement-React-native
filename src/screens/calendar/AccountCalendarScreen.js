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

const AccountCalendarScreen = ({ route }) => {
  const { accountId } = route.params;
  const {
    events: eventsData,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useEventsStore();

  // Ensure events is always an array
  const events = Array.isArray(eventsData) ? eventsData : [];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'pago_unico',
  });
  const [eventDate, setEventDate] = useState(new Date());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEvents(accountId);
  }, [fetchEvents, accountId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents(accountId);
    setRefreshing(false);
  }, [fetchEvents, accountId]);

  const resetForm = () => {
    const dateObj = new Date(selectedDate + 'T09:00:00');
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'pago_unico',
    });
    setEventDate(dateObj);
    setErrors({});
    setSelectedEvent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    const eventDateTime = event.fecha_hora_inicio || event.fechaHoraInicio || event.fecha_inicio || event.fecha;
    setFormData({
      titulo: event.titulo,
      descripcion: event.descripcion || '',
      tipo: event.tipo || 'pago_unico',
    });
    setEventDate(eventDateTime ? new Date(eventDateTime) : new Date());
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        fecha_hora_inicio: eventDate.toISOString(),
        tipo: formData.tipo || 'pago_unico',
        id_cuenta: accountId,
      };

      let result;
      if (selectedEvent) {
        result = await updateEvent(selectedEvent.id, payload, accountId);
      } else {
        result = await createEvent(payload, accountId);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedEvent ? 'Evento actualizado' : 'Evento creado',
        });
        setModalVisible(false);
        resetForm();
        // Refresh events
        fetchEvents(accountId);
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
      const result = await deleteEvent(selectedEvent.id, accountId);
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

  const getEventDate = (event) => {
    return event.fecha_hora_inicio || event.fechaHoraInicio || event.fecha_inicio || event.fecha;
  };

  const markedDates = events.reduce((acc, event) => {
    const eventDate = getEventDate(event);
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

  if (!markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: COLORS.primary,
    };
  } else {
    markedDates[selectedDate].selected = true;
  }

  const selectedDateEvents = events.filter((event) => {
    const eventDate = getEventDate(event);
    return eventDate && eventDate.split('T')[0] === selectedDate;
  });

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
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            calendarBackground: COLORS.white,
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: COLORS.white,
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.gray[900],
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.gray[900],
          }}
          style={styles.calendar}
        />

        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsTitle}>
              {formatDate(selectedDate, 'long')}
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => {
              const eventDateTime = getEventDate(event);
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <TouchableOpacity onPress={() => openEditModal(event)}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTime}>
                          {formatDate(eventDateTime, 'time')}
                        </Text>
                        <Text style={styles.eventTitle}>{event.titulo}</Text>
                        {event.tipo && (
                          <Text style={styles.eventType}>{event.tipo}</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => openDeleteDialog(event)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })
          ) : (
            <View style={styles.noEvents}>
              <Text style={styles.noEventsText}>No hay eventos</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
      >
        <Input
          label="Título"
          value={formData.titulo}
          onChangeText={(text) => setFormData({ ...formData, titulo: text })}
          error={errors.titulo}
        />
        <Input
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
          multiline
        />
        <View style={styles.modalButtons}>
          <Button title="Cancelar" variant="outline" onPress={() => setModalVisible(false)} style={styles.modalButton} />
          <Button title="Guardar" onPress={handleSave} loading={saving} style={styles.modalButton} />
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Eliminar Evento"
        message="¿Eliminar este evento?"
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  calendar: { borderBottomWidth: 1, borderBottomColor: COLORS.gray[200] },
  eventsSection: { padding: 16 },
  eventsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  eventsTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray[900] },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  eventCard: { marginBottom: 12, padding: 16 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventTime: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  eventTitle: { fontSize: 16, fontWeight: '500', color: COLORS.gray[900], marginTop: 2 },
  eventType: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  noEvents: { alignItems: 'center', paddingVertical: 40 },
  noEventsText: { fontSize: 14, color: COLORS.gray[500] },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1 },
});

export default AccountCalendarScreen;
