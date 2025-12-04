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

const AccountTasksScreen = ({ route }) => {
  const { accountId } = route.params;
  const {
    tasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    isLoading,
  } = useTasksStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    estado: 'todo',
    prioridad: 'medium',
    fecha_vencimiento: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTasks({ accountId });
  }, [fetchTasks, accountId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks({ accountId });
    setRefreshing(false);
  }, [fetchTasks, accountId]);

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      estado: 'todo',
      prioridad: 'medium',
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
    setFormData({
      titulo: task.titulo,
      descripcion: task.descripcion || '',
      estado: task.estado,
      prioridad: task.prioridad || 'medium',
      fecha_vencimiento: task.fecha_vencimiento
        ? task.fecha_vencimiento.split('T')[0]
        : '',
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
        result = await updateTask(selectedTask.id, formData, accountId);
      } else {
        result = await createTask(formData, accountId);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedTask ? 'Tarea actualizada' : 'Tarea creada',
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
    if (!selectedTask) return;

    setSaving(true);
    try {
      const result = await deleteTask(selectedTask.id, accountId);
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

  const renderTaskItem = ({ item }) => {
    const statusInfo = getTaskStatusInfo(item.estado);
    const priorityInfo = getTaskPriorityInfo(item.prioridad);
    const isCompleted = item.estado === 'done';

    return (
      <Card style={styles.taskCard}>
        <TouchableOpacity onPress={() => openEditModal(item)} activeOpacity={0.7}>
          <View style={styles.taskHeader}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusInfo.color },
              ]}
            />
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
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => openDeleteDialog(item)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.taskFooter}>
            <View style={styles.badges}>
              <Badge label={statusInfo.label} size="small" />
              <Badge
                label={priorityInfo.label}
                variant={
                  item.prioridad === 'high'
                    ? 'danger'
                    : item.prioridad === 'medium'
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </View>
            {item.fecha_vencimiento && (
              <Text style={styles.dueDate}>
                {formatDate(item.fecha_vencimiento)}
              </Text>
            )}
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
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title="No hay tareas"
            message="Crea tareas para esta cuenta"
            actionLabel="Crear Tarea"
            onAction={openCreateModal}
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

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
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(text) =>
            setFormData({ ...formData, descripcion: text })
          }
          placeholder="Descripción"
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

      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setSelectedTask(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Tarea"
        message={`¿Eliminar "${selectedTask?.titulo}"?`}
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
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
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
  },
  deleteBtn: {
    padding: 4,
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

export default AccountTasksScreen;
