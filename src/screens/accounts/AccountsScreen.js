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
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAccountsStore } from '../../store/useStore';
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
import {
  COLORS,
  formatCurrency,
  ACCOUNT_TYPES,
  CURRENCIES,
  ACCOUNT_TYPE_COLORS,
  getAccountTypeInfo,
} from '../../constants';

const AccountsScreen = ({ navigation }) => {
  const {
    accounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    isLoading,
  } = useAccountsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'personal',
    moneda: 'USD',
    descripcion: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'personal',
      moneda: 'USD',
      descripcion: '',
    });
    setErrors({});
    setSelectedAccount(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (account) => {
    setSelectedAccount(account);
    setFormData({
      nombre: account.nombre,
      tipo: account.tipo,
      moneda: account.moneda,
      descripcion: account.descripcion || '',
    });
    setModalVisible(true);
  };

  const openDeleteDialog = (account) => {
    setSelectedAccount(account);
    setDeleteDialogVisible(true);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo es requerido';
    }

    if (!formData.moneda) {
      newErrors.moneda = 'La moneda es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let result;
      if (selectedAccount) {
        result = await updateAccount(selectedAccount.id, formData);
      } else {
        result = await createAccount(formData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: selectedAccount ? 'Cuenta actualizada' : 'Cuenta creada',
          text2: selectedAccount
            ? 'Los cambios se guardaron correctamente'
            : 'La cuenta se creó correctamente',
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
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const result = await deleteAccount(selectedAccount.id);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Cuenta eliminada',
          text2: 'La cuenta se eliminó correctamente',
        });
        setDeleteDialogVisible(false);
        setSelectedAccount(null);
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

  const renderAccountCard = ({ item }) => {
    const colors = ACCOUNT_TYPE_COLORS[item.tipo] || ACCOUNT_TYPE_COLORS.personal;
    const typeInfo = getAccountTypeInfo(item.tipo);

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.from, colors.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accountCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.typeIconContainer}>
              <Ionicons name={typeInfo.icon} size={24} color={COLORS.white} />
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(item)}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openDeleteDialog(item)}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.accountName} numberOfLines={1}>
            {item.nombre}
          </Text>

          <Text style={styles.accountBalance}>
            {formatCurrency(item.balance?.saldo ?? item.saldo ?? 0, item.moneda)}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.accountType}>{typeInfo.label}</Text>
            <Text style={styles.accountCurrency}>{item.moneda}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading && accounts.length === 0) {
    return <Loading text="Cargando cuentas..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccountCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="No tienes cuentas"
            message="Crea tu primera cuenta para comenzar a gestionar tus finanzas"
            actionLabel="Crear Cuenta"
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
        title={selectedAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
      >
        <Input
          label="Nombre"
          value={formData.nombre}
          onChangeText={(text) => {
            setFormData({ ...formData, nombre: text });
            if (errors.nombre) setErrors({ ...errors, nombre: null });
          }}
          placeholder="Nombre de la cuenta"
          error={errors.nombre}
        />

        <Select
          label="Tipo de cuenta"
          value={formData.tipo}
          options={ACCOUNT_TYPES}
          onSelect={(value) => setFormData({ ...formData, tipo: value })}
          error={errors.tipo}
        />

        <Select
          label="Moneda"
          value={formData.moneda}
          options={CURRENCIES}
          onSelect={(value) => setFormData({ ...formData, moneda: value })}
          error={errors.moneda}
        />

        <Input
          label="Descripción (opcional)"
          value={formData.descripcion}
          onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
          placeholder="Descripción de la cuenta"
          multiline
          numberOfLines={3}
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
            title={selectedAccount ? 'Guardar' : 'Crear'}
            onPress={handleSave}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setSelectedAccount(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Cuenta"
        message={`¿Estás seguro de que deseas eliminar la cuenta "${selectedAccount?.nombre}"? Esta acción no se puede deshacer.`}
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
  cardContainer: {
    marginBottom: 16,
  },
  accountCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  accountBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  accountCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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

export default AccountsScreen;
