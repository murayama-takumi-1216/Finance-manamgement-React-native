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
import { movementsAPI } from '../../services/api';
import { useCategoriesStore } from '../../store/useStore';
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
  formatCurrency,
  formatDate,
  MOVEMENT_TYPES,
  MOVEMENT_STATUS,
} from '../../constants';

const MovementsScreen = ({ route, navigation }) => {
  const { accountId } = route.params;
  const { categories, fetchCategories } = useCategoriesStore();

  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all, ingreso, gasto

  const [formData, setFormData] = useState({
    tipo: 'gasto',
    monto: '',
    descripcion: '',
    categoria_id: '',
    proveedor: '',
    fecha: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const loadMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { tipo: filter } : {};
      const response = await movementsAPI.getAll(accountId, params);
      // Backend returns { data: [...], pagination: {...} }
      const movementsData = response.data.data || response.data.movements || [];
      setMovements(Array.isArray(movementsData) ? movementsData : []);
    } catch (error) {
      console.error('Error loading movements:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los movimientos',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountId, filter]);

  useEffect(() => {
    loadMovements();
    fetchCategories(accountId);
  }, [loadMovements, fetchCategories, accountId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  }, [loadMovements]);

  const resetForm = () => {
    setFormData({
      tipo: 'gasto',
      monto: '',
      descripcion: '',
      categoria_id: '',
      proveedor: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setSelectedMovement(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (movement) => {
    setSelectedMovement(movement);
    // Map backend field names to frontend form fields
    const fechaStr = movement.fechaOperacion || movement.fecha_operacion || '';
    setFormData({
      tipo: movement.tipo,
      monto: (movement.importe || movement.monto || 0).toString(),
      descripcion: movement.descripcion || '',
      categoria_id: movement.categoria?.id || movement.id_categoria || '',
      proveedor: movement.proveedor || '',
      fecha: fechaStr.split('T')[0],
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (movement) => {
    setSelectedMovement(movement);
    setDeleteDialogVisible(true);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Map frontend field names to backend field names
      const data = {
        tipo: formData.tipo,
        importe: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        id_categoria: formData.categoria_id || null,
        proveedor: formData.proveedor || null,
        fecha_operacion: formData.fecha,
      };

      if (selectedMovement) {
        await movementsAPI.update(accountId, selectedMovement.id, data);
        Toast.show({
          type: 'success',
          text1: 'Movimiento actualizado',
        });
      } else {
        await movementsAPI.create(accountId, data);
        Toast.show({
          type: 'success',
          text1: 'Movimiento creado',
        });
      }

      setModalVisible(false);
      resetForm();
      loadMovements();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error al guardar',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMovement) return;

    setSaving(true);
    try {
      await movementsAPI.delete(accountId, selectedMovement.id);
      Toast.show({
        type: 'success',
        text1: 'Movimiento eliminado',
      });
      setDeleteDialogVisible(false);
      setSelectedMovement(null);
      loadMovements();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error al eliminar',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (movement) => {
    try {
      await movementsAPI.confirm(accountId, movement.id);
      Toast.show({
        type: 'success',
        text1: 'Movimiento confirmado',
      });
      loadMovements();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo confirmar el movimiento',
      });
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.nombre,
  }));

  const renderMovementItem = ({ item }) => {
    const isIncome = item.tipo === 'ingreso';
    const isPending = item.estado === 'pendiente_revision';

    return (
      <Card style={styles.movementCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MovementDetail', {
              accountId,
              movementId: item.id,
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.movementHeader}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: isIncome ? '#dcfce7' : '#fee2e2' },
              ]}
            >
              <Ionicons
                name={isIncome ? 'arrow-down' : 'arrow-up'}
                size={20}
                color={isIncome ? COLORS.success : COLORS.danger}
              />
            </View>
            <View style={styles.movementInfo}>
              <Text style={styles.movementDescription} numberOfLines={1}>
                {item.descripcion}
              </Text>
              <Text style={styles.movementDate}>
                {formatDate(item.fechaOperacion)} • {item.categoria?.nombre || 'Sin categoría'}
              </Text>
            </View>
            <Text
              style={[
                styles.movementAmount,
                { color: isIncome ? COLORS.success : COLORS.danger },
              ]}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(item.importe)}
            </Text>
          </View>

          <View style={styles.movementFooter}>
            <View style={styles.badges}>
              {isPending && (
                <Badge label="Pendiente" variant="warning" size="small" />
              )}
              {item.proveedor && (
                <Text style={styles.providerText}>{item.proveedor}</Text>
              )}
            </View>
            <View style={styles.movementActions}>
              {isPending && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleConfirm(item)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={COLORS.success}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openEditModal(item)}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={COLORS.gray[600]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openDeleteDialog(item)}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (isLoading && movements.length === 0) {
    return <Loading text="Cargando movimientos..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'ingreso', label: 'Ingresos' },
          { key: 'gasto', label: 'Gastos' },
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
        data={movements}
        keyExtractor={(item) => item.id}
        renderItem={renderMovementItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="swap-horizontal-outline"
            title="No hay movimientos"
            message="Crea tu primer movimiento para comenzar a registrar tus finanzas"
            actionLabel="Crear Movimiento"
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
        title={selectedMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
      >
        <Select
          label="Tipo"
          value={formData.tipo}
          options={MOVEMENT_TYPES}
          onSelect={(value) => setFormData({ ...formData, tipo: value })}
        />

        <Input
          label="Monto"
          value={formData.monto}
          onChangeText={(text) => {
            setFormData({ ...formData, monto: text.replace(/[^0-9.]/g, '') });
            if (errors.monto) setErrors({ ...errors, monto: null });
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.monto}
        />

        <Input
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(text) => {
            setFormData({ ...formData, descripcion: text });
            if (errors.descripcion) setErrors({ ...errors, descripcion: null });
          }}
          placeholder="Descripción del movimiento"
          error={errors.descripcion}
        />

        <Select
          label="Categoría"
          value={formData.categoria_id}
          options={categoryOptions}
          onSelect={(value) => {
            setFormData({ ...formData, categoria_id: value });
            if (errors.categoria_id) setErrors({ ...errors, categoria_id: null });
          }}
          error={errors.categoria_id}
        />

        <Input
          label="Proveedor (opcional)"
          value={formData.proveedor}
          onChangeText={(text) => setFormData({ ...formData, proveedor: text })}
          placeholder="Nombre del proveedor"
        />

        <Input
          label="Fecha"
          value={formData.fecha}
          onChangeText={(text) => setFormData({ ...formData, fecha: text })}
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
            title={selectedMovement ? 'Guardar' : 'Crear'}
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
          setSelectedMovement(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Movimiento"
        message="¿Estás seguro de que deseas eliminar este movimiento?"
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  movementCard: {
    marginBottom: 12,
    padding: 16,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  movementAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  movementFooter: {
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
    alignItems: 'center',
    gap: 8,
  },
  providerText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  movementActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
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

export default MovementsScreen;
