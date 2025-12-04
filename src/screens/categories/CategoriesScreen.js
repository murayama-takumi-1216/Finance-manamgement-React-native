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
import { useCategoriesStore } from '../../store/useStore';
import {
  Card,
  Loading,
  EmptyState,
  Modal,
  Button,
  Input,
  Select,
  ConfirmDialog,
} from '../../components/common';
import { COLORS, CATEGORY_COLORS } from '../../constants';

const CategoriesScreen = ({ route }) => {
  const { accountId } = route.params;
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = useCategoriesStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'gasto',
    color: CATEGORY_COLORS[0],
    descripcion: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const tipo = filter !== 'all' ? filter : null;
    fetchCategories(accountId, tipo);
  }, [fetchCategories, accountId, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const tipo = filter !== 'all' ? filter : null;
    await fetchCategories(accountId, tipo);
    setRefreshing(false);
  }, [fetchCategories, accountId, filter]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'gasto',
      color: CATEGORY_COLORS[0],
      descripcion: '',
    });
    setErrors({});
    setSelectedCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      nombre: category.nombre,
      tipo: category.tipo,
      color: category.color || CATEGORY_COLORS[0],
      descripcion: category.descripcion || '',
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setDeleteDialogVisible(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let result;
      if (selectedCategory) {
        result = await updateCategory(accountId, selectedCategory.id, formData);
      } else {
        result = await createCategory(accountId, formData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedCategory ? 'Categoría actualizada' : 'Categoría creada',
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
    if (!selectedCategory) return;

    setSaving(true);
    try {
      const result = await deleteCategory(accountId, selectedCategory.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Categoría eliminada',
        });
        setDeleteDialogVisible(false);
        setSelectedCategory(null);
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

  const renderCategoryItem = ({ item }) => {
    const isIncome = item.tipo === 'ingreso';

    return (
      <Card style={styles.categoryCard}>
        <View style={styles.categoryContent}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color || COLORS.gray[400] },
            ]}
          />
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.nombre}</Text>
            <Text style={styles.categoryType}>
              {isIncome ? 'Ingreso' : 'Gasto'}
            </Text>
          </View>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.gray[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openDeleteDialog(item)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const colorOptions = CATEGORY_COLORS.map((color) => ({
    value: color,
    label: color,
  }));

  if (isLoading && categories.length === 0) {
    return <Loading text="Cargando categorías..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Todas' },
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
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-outline"
            title="No hay categorías"
            message="Crea categorías para organizar tus movimientos"
            actionLabel="Crear Categoría"
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
        title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <Input
          label="Nombre"
          value={formData.nombre}
          onChangeText={(text) => {
            setFormData({ ...formData, nombre: text });
            if (errors.nombre) setErrors({ ...errors, nombre: null });
          }}
          placeholder="Nombre de la categoría"
          error={errors.nombre}
        />

        <Select
          label="Tipo"
          value={formData.tipo}
          options={[
            { value: 'gasto', label: 'Gasto' },
            { value: 'ingreso', label: 'Ingreso' },
          ]}
          onSelect={(value) => setFormData({ ...formData, tipo: value })}
        />

        <Text style={styles.colorLabel}>Color</Text>
        <View style={styles.colorPicker}>
          {CATEGORY_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                formData.color === color && styles.colorOptionSelected,
              ]}
              onPress={() => setFormData({ ...formData, color })}
            >
              {formData.color === color && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Descripción (opcional)"
          value={formData.descripcion}
          onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
          placeholder="Descripción de la categoría"
          multiline
          numberOfLines={2}
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
            title={selectedCategory ? 'Guardar' : 'Crear'}
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
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${selectedCategory?.nombre}"?`}
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
  categoryCard: {
    marginBottom: 12,
    padding: 16,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 40,
    borderRadius: 4,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  categoryActions: {
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
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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

export default CategoriesScreen;
