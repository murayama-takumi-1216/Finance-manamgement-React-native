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
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAccountsStore } from '../../store/useStore';
import { Card, Loading, Modal, Input, Select, Button, ConfirmDialog } from '../../components/common';
import {
  COLORS,
  formatCurrency,
  ACCOUNT_TYPE_COLORS,
  getAccountTypeInfo,
} from '../../constants';

const MEMBER_ROLES = [
  { value: 'viewer', label: 'Visor' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrador' },
];

const AccountDetailScreen = ({ route, navigation }) => {
  const { accountId } = route.params;
  const { fetchAccountById, currentAccount, isLoading, inviteUser, removeMember } = useAccountsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const loadAccount = useCallback(async () => {
    await fetchAccountById(accountId);
  }, [fetchAccountById, accountId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    if (currentAccount) {
      navigation.setOptions({
        title: currentAccount.nombre,
      });
    }
  }, [currentAccount, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccount();
    setRefreshing(false);
  }, [loadAccount]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingresa un correo electrónico',
      });
      return;
    }

    setInviting(true);
    try {
      const result = await inviteUser(accountId, { email: inviteEmail, rol: inviteRole });
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Invitación enviada',
          text2: 'El usuario ha sido invitado a la cuenta',
        });
        setInviteModalVisible(false);
        setInviteEmail('');
        setInviteRole('viewer');
        loadAccount();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'No se pudo enviar la invitación',
        });
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (member) => {
    setMemberToRemove(member);
    setDeleteDialogVisible(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemoving(true);
    try {
      const result = await removeMember(accountId, memberToRemove.usuario_id || memberToRemove.usuarioId);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Miembro eliminado',
        });
        setDeleteDialogVisible(false);
        setMemberToRemove(null);
        loadAccount();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'No se pudo eliminar el miembro',
        });
      }
    } finally {
      setRemoving(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
      case 'propietario':
        return COLORS.primary;
      case 'admin':
      case 'administrador':
        return COLORS.success;
      case 'editor':
        return COLORS.warning;
      default:
        return COLORS.gray[500];
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
      case 'propietario':
        return 'Propietario';
      case 'admin':
      case 'administrador':
        return 'Admin';
      case 'editor':
        return 'Editor';
      case 'viewer':
      case 'visor':
        return 'Visor';
      default:
        return role;
    }
  };

  if (isLoading && !currentAccount) {
    return <Loading text="Cargando cuenta..." />;
  }

  if (!currentAccount) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={64} color={COLORS.gray[300]} />
        <Text style={styles.errorText}>Cuenta no encontrada</Text>
      </View>
    );
  }

  const colors =
    ACCOUNT_TYPE_COLORS[currentAccount.tipo] || ACCOUNT_TYPE_COLORS.personal;
  const typeInfo = getAccountTypeInfo(currentAccount.tipo);

  const menuItems = [
    {
      id: 'movements',
      title: 'Movimientos',
      subtitle: 'Ver ingresos y gastos',
      icon: 'swap-horizontal',
      color: '#6366f1',
      onPress: () =>
        navigation.navigate('Movements', { accountId: currentAccount.id }),
    },
    {
      id: 'categories',
      title: 'Categorías',
      subtitle: 'Gestionar categorías',
      icon: 'folder',
      color: '#10b981',
      onPress: () =>
        navigation.navigate('Categories', { accountId: currentAccount.id }),
    },
    {
      id: 'tags',
      title: 'Etiquetas',
      subtitle: 'Gestionar etiquetas',
      icon: 'pricetag',
      color: '#f59e0b',
      onPress: () =>
        navigation.navigate('Tags', { accountId: currentAccount.id }),
    },
    {
      id: 'reports',
      title: 'Reportes',
      subtitle: 'Ver análisis financiero',
      icon: 'bar-chart',
      color: '#8b5cf6',
      onPress: () =>
        navigation.navigate('Reports', { accountId: currentAccount.id }),
    },
    {
      id: 'tasks',
      title: 'Tareas',
      subtitle: 'Gestionar tareas de la cuenta',
      icon: 'checkbox',
      color: '#ec4899',
      onPress: () =>
        navigation.navigate('AccountTasks', { accountId: currentAccount.id }),
    },
    {
      id: 'calendar',
      title: 'Calendario',
      subtitle: 'Ver eventos y recordatorios',
      icon: 'calendar',
      color: '#06b6d4',
      onPress: () =>
        navigation.navigate('AccountCalendar', { accountId: currentAccount.id }),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Account Header Card */}
      <LinearGradient
        colors={[colors.from, colors.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerTop}>
          <View style={styles.typeIconContainer}>
            <Ionicons name={typeInfo.icon} size={28} color={COLORS.white} />
          </View>
          <Text style={styles.accountType}>{typeInfo.label}</Text>
        </View>

        <Text style={styles.accountName}>{currentAccount.nombre}</Text>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Saldo actual</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(currentAccount.balance?.saldo || 0, currentAccount.moneda)}
          </Text>
        </View>

        {currentAccount.descripcion && (
          <Text style={styles.description}>{currentAccount.descripcion}</Text>
        )}
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.success} />
          <Text style={styles.statLabel}>Ingresos</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {formatCurrency(currentAccount.balance?.totalIngresos || 0, currentAccount.moneda)}
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="trending-down" size={24} color={COLORS.danger} />
          <Text style={styles.statLabel}>Gastos</Text>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>
            {formatCurrency(currentAccount.balance?.totalGastos || 0, currentAccount.moneda)}
          </Text>
        </Card>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Gestión de cuenta</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}
            >
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Account Members Section */}
      <View style={styles.membersSection}>
        <View style={styles.membersSectionHeader}>
          <View style={styles.membersTitleRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Miembros de la cuenta</Text>
              <Text style={styles.membersCount}>
                {(currentAccount.miembros || currentAccount.members || []).length} miembro(s)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setInviteModalVisible(true)}
          >
            <Ionicons name="person-add" size={18} color={COLORS.white} />
            <Text style={styles.inviteButtonText}>Invitar</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.membersCard}>
          {(currentAccount.miembros || currentAccount.members || []).length === 0 ? (
            <Text style={styles.noMembersText}>No hay miembros adicionales</Text>
          ) : (
            (currentAccount.miembros || currentAccount.members || []).map((member, index) => (
              <View
                key={member.id || member.usuario_id || index}
                style={[
                  styles.memberItem,
                  index < (currentAccount.miembros || currentAccount.members || []).length - 1 && styles.memberItemBorder,
                ]}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(member.usuario?.nombre || member.email || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.usuario?.nombre || member.nombre || 'Usuario'}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {member.usuario?.email || member.email}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: `${getRoleBadgeColor(member.rol)}15` }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(member.rol) }]}>
                    {getRoleLabel(member.rol)}
                  </Text>
                </View>
                {member.rol !== 'owner' && member.rol !== 'propietario' && (
                  <TouchableOpacity
                    style={styles.removeMemberBtn}
                    onPress={() => handleRemoveMember(member)}
                  >
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Invite Member Modal */}
      <Modal
        visible={inviteModalVisible}
        onClose={() => {
          setInviteModalVisible(false);
          setInviteEmail('');
          setInviteRole('viewer');
        }}
        title="Invitar miembro"
      >
        <Input
          label="Correo electrónico"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Select
          label="Rol"
          value={inviteRole}
          options={MEMBER_ROLES}
          onSelect={setInviteRole}
        />
        <View style={styles.modalButtons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => {
              setInviteModalVisible(false);
              setInviteEmail('');
              setInviteRole('viewer');
            }}
            style={styles.modalButton}
          />
          <Button
            title="Invitar"
            onPress={handleInviteMember}
            loading={inviting}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Remove Member Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setMemberToRemove(null);
        }}
        onConfirm={confirmRemoveMember}
        title="Eliminar miembro"
        message={`¿Estás seguro de que deseas eliminar a ${memberToRemove?.usuario?.nombre || memberToRemove?.email || 'este miembro'} de esta cuenta?`}
        confirmText="Eliminar"
        loading={removing}
      />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },
  headerCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  accountName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  balanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  membersSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  inviteButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  membersCard: {
    padding: 0,
    overflow: 'hidden',
  },
  noMembersText: {
    padding: 20,
    textAlign: 'center',
    color: COLORS.gray[500],
    fontSize: 14,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeMemberBtn: {
    marginLeft: 8,
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
});

export default AccountDetailScreen;
