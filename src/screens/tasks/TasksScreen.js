import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTasksStore } from '../../store/useStore';
import {
  Card,
  Loading,
  EmptyState,
  Modal,
  Button,
  Input,
  Select,
  Badge,
  ConfirmDialog,
} from '../../components/common';
import {
  COLORS,
  formatDate,
  TASK_STATUS,
  TASK_PRIORITY,
  getTaskStatusInfo,
  getTaskPriorityInfo,
} from '../../constants';

const TasksScreen = ({ navigation }) => {
  const {
    tasks,
    summary,
    fetchTasks,
    fetchSummary,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    isLoading,
  } = useTasksStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fecha_vencimiento: '',
  });
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    const params = filter !== 'all' ? { estado: filter } : {};
    await Promise.all([fetchTasks(params), fetchSummary()]);
  }, [fetchTasks, fetchSummary, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      estado: 'pendiente',
      prioridad: 'media',
      fecha_vencimiento: '',
    });
    setErrors({});
    setSelectedTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    // Backend returns fechaFin for due date
    const dueDate = task.fecha_vencimiento || task.fechaFin || task.fecha_fin;
    setFormData({
      titulo: task.titulo,
      descripcion: task.descripcion || '',
      estado: task.estado,
      prioridad: task.prioridad || 'media',
      fecha_vencimiento: dueDate ? dueDate.split('T')[0] : '',
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (task) => {
    setSelectedTask(task);
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
      let result;
      if (selectedTask) {
        result = await updateTask(selectedTask.id, formData);
      } else {
        result = await createTask(formData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedTask ? 'Tarea actualizada' : 'Tarea creada',
        });
        setModalVisible(false);
        resetForm();
        loadData();
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
    if (!selectedTask) return;

    setSaving(true);
    try {
      const result = await deleteTask(selectedTask.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Tarea eliminada',
        });
        setDeleteDialogVisible(false);
        setSelectedTask(null);
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

  const handleStatusChange = async (task, newStatus) => {
    const result = await updateTaskStatus(task.id, newStatus);
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Estado actualizado',
      });
      // Reload the list to reflect the status change
      loadData();
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completada':
        return 'success';
      case 'en_progreso':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'alta':
        return 'danger';
      case 'media':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderTaskItem = ({ item }) => {
    const statusInfo = getTaskStatusInfo(item.estado);
    const priorityInfo = getTaskPriorityInfo(item.prioridad);
    const isCompleted = item.estado === 'completada';
    const isInProgress = item.estado === 'en_progreso';
    const isPending = item.estado === 'pendiente';

    // Determine next status: pendiente -> en_progreso -> completada
    const getNextStatus = () => {
      if (isPending) return 'en_progreso';
      if (isInProgress) return 'completada';
      return null; // completed - no next status
    };

    const handleCheckboxPress = () => {
      const nextStatus = getNextStatus();
      if (nextStatus) {
        handleStatusChange(item, nextStatus);
      }
    };

    return (
      <Card style={styles.taskCard}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                isInProgress && styles.checkboxInProgress,
                isCompleted && styles.checkboxCompleted,
              ]}
              onPress={handleCheckboxPress}
              disabled={isCompleted}
              activeOpacity={isCompleted ? 1 : 0.7}
            >
              {isInProgress && (
                <Ionicons name="time" size={14} color={COLORS.white} />
              )}
              {isCompleted && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  isCompleted && styles.taskTitleCompleted,
                ]}
                numberOfLines={1}
              >
                {item.titulo}
              </Text>
              {item.descripcion && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.descripcion}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.taskFooter}>
            <View style={styles.badges}>
              <Badge
                label={statusInfo.label}
                variant={getStatusBadgeVariant(item.estado)}
                size="small"
              />
              <Badge
                label={priorityInfo.label}
                variant={getPriorityBadgeVariant(item.prioridad)}
                size="small"
              />
            </View>
            {(item.fechaFin || item.fecha_fin || item.fecha_vencimiento) && (
              <Text style={styles.dueDate}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.gray[500]} />
                {' '}
                {formatDate(item.fechaFin || item.fecha_fin || item.fecha_vencimiento)}
              </Text>
            )}
          </View>

          <View style={styles.taskActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openDeleteDialog(item)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (isLoading && tasks.length === 0) {
    return <Loading text="Cargando tareas..." />;
  }

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.total || 0}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderTopColor: COLORS.warning }]}>
            <Text style={styles.summaryNumber}>{summary.pendientes || 0}</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderTopColor: COLORS.info }]}>
            <Text style={styles.summaryNumber}>{summary.en_progreso || summary.enProgreso || 0}</Text>
            <Text style={styles.summaryLabel}>En Progreso</Text>
          </Card>
          <Card style={[styles.summaryCard, { borderTopColor: COLORS.success }]}>
            <Text style={styles.summaryNumber}>{summary.completadas || 0}</Text>
            <Text style={styles.summaryLabel}>Completadas</Text>
          </Card>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pendiente', label: 'Por hacer' },
          { key: 'en_progreso', label: 'En progreso' },
          { key: 'completada', label: 'Completadas' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title="No hay tareas"
            message="Crea tu primera tarea para comenzar a organizar tu trabajo"
            actionLabel="Crear Tarea"
            onAction={openCreateModal}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title={selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
      >
        <Input
          label="Título"
          value={formData.titulo}
          onChangeText={(text) => {
            setFormData({ ...formData, titulo: text });
            if (errors.titulo) setErrors({ ...errors, titulo: null });
          }}
          placeholder="Título de la tarea"
          error={errors.titulo}
        />

        <Input
          label="Descripción (opcional)"
          value={formData.descripcion}
          onChangeText={(text) =>
            setFormData({ ...formData, descripcion: text })
          }
          placeholder="Descripción de la tarea"
          multiline
          numberOfLines={3}
        />

        <Select
          label="Estado"
          value={formData.estado}
          options={TASK_STATUS}
          onSelect={(value) => setFormData({ ...formData, estado: value })}
        />

        <Select
          label="Prioridad"
          value={formData.prioridad}
          options={TASK_PRIORITY}
          onSelect={(value) => setFormData({ ...formData, prioridad: value })}
        />

        <Input
          label="Fecha de vencimiento (opcional)"
          value={formData.fecha_vencimiento}
          onChangeText={(text) =>
            setFormData({ ...formData, fecha_vencimiento: text })
          }
          placeholder="YYYY-MM-DD"
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
            title={selectedTask ? 'Guardar' : 'Crear'}
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
          setSelectedTask(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Tarea"
        message={`¿Estás seguro de que deseas eliminar la tarea "${selectedTask?.titulo}"?`}
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    marginBottom: 12,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInProgress: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.gray[500],
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  dueDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  taskActions: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  actionBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export default TasksScreen;
