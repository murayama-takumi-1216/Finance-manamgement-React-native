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
import { useTagsStore } from '../../store/useStore';
import {
  Card,
  Loading,
  EmptyState,
  Modal,
  Button,
  Input,
  ConfirmDialog,
} from '../../components/common';
import { COLORS, CATEGORY_COLORS } from '../../constants';

const TagsScreen = ({ route }) => {
  const { accountId } = route.params;
  const {
    tags,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    isLoading,
  } = useTagsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    color: CATEGORY_COLORS[0],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTags(accountId);
  }, [fetchTags, accountId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTags(accountId);
    setRefreshing(false);
  }, [fetchTags, accountId]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: CATEGORY_COLORS[0],
    });
    setErrors({});
    setSelectedTag(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (tag) => {
    setSelectedTag(tag);
    setFormData({
      nombre: tag.nombre,
      color: tag.color || CATEGORY_COLORS[0],
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (tag) => {
    setSelectedTag(tag);
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
      if (selectedTag) {
        result = await updateTag(accountId, selectedTag.id, formData);
      } else {
        result = await createTag(accountId, formData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedTag ? 'Etiqueta actualizada' : 'Etiqueta creada',
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
    if (!selectedTag) return;

    setSaving(true);
    try {
      const result = await deleteTag(accountId, selectedTag.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Etiqueta eliminada',
        });
        setDeleteDialogVisible(false);
        setSelectedTag(null);
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

  const renderTagItem = ({ item }) => (
    <Card style={styles.tagCard}>
      <View style={styles.tagContent}>
        <View
          style={[
            styles.tagChip,
            { backgroundColor: `${item.color || COLORS.primary}20` },
          ]}
        >
          <View
            style={[
              styles.tagDot,
              { backgroundColor: item.color || COLORS.primary },
            ]}
          />
          <Text
            style={[
              styles.tagName,
              { color: item.color || COLORS.primary },
            ]}
          >
            {item.nombre}
          </Text>
        </View>
        <View style={styles.tagActions}>
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

  if (isLoading && tags.length === 0) {
    return <Loading text="Cargando etiquetas..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTagItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="No hay etiquetas"
            message="Crea etiquetas para organizar mejor tus movimientos"
            actionLabel="Crear Etiqueta"
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
        title={selectedTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
      >
        <Input
          label="Nombre"
          value={formData.nombre}
          onChangeText={(text) => {
            setFormData({ ...formData, nombre: text });
            if (errors.nombre) setErrors({ ...errors, nombre: null });
          }}
          placeholder="Nombre de la etiqueta"
          error={errors.nombre}
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
            title={selectedTag ? 'Guardar' : 'Crear'}
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
          setSelectedTag(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Etiqueta"
        message={`¿Estás seguro de que deseas eliminar la etiqueta "${selectedTag?.nombre}"?`}
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
  tagCard: {
    marginBottom: 12,
    padding: 16,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagActions: {
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

export default TagsScreen;
