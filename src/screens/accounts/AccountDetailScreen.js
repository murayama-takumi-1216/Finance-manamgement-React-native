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
import { useAccountsStore } from '../../store/useStore';
import { Card, Loading } from '../../components/common';
import {
  COLORS,
  formatCurrency,
  ACCOUNT_TYPE_COLORS,
  getAccountTypeInfo,
} from '../../constants';

const AccountDetailScreen = ({ route, navigation }) => {
  const { accountId } = route.params;
  const { fetchAccountById, currentAccount, isLoading } = useAccountsStore();
  const [refreshing, setRefreshing] = useState(false);

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
  bottomPadding: {
    height: 32,
  },
});

export default AccountDetailScreen;
