import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAccountsStore, useEventsStore, useAuthStore } from '../../store/useStore';
import { reportsAPI } from '../../services/api';
import { Card, Loading, EmptyState } from '../../components/common';
import { COLORS, formatCurrency, formatDate, ACCOUNT_TYPE_COLORS } from '../../constants';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { accounts, fetchAccounts, isLoading: accountsLoading } = useAccountsStore();
  const { upcomingEvents, fetchUpcomingEvents } = useEventsStore();

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await fetchAccounts();
    await fetchUpcomingEvents(5);
  }, [fetchAccounts, fetchUpcomingEvents]);

  const loadDashboardData = useCallback(async (accountId) => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      const response = await reportsAPI.getDashboard(accountId);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  useEffect(() => {
    if (selectedAccount) {
      loadDashboardData(selectedAccount.id);
    }
  }, [selectedAccount, loadDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    if (selectedAccount) {
      await loadDashboardData(selectedAccount.id);
    }
    setRefreshing(false);
  }, [loadData, loadDashboardData, selectedAccount]);

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  if (accountsLoading && accounts.length === 0) {
    return <Loading text="Cargando panel..." />;
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon="wallet-outline"
        title="No tienes cuentas"
        message="Crea tu primera cuenta para comenzar a gestionar tus finanzas"
        actionLabel="Crear Cuenta"
        onAction={() => navigation.navigate('Accounts')}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}
          </Text>
          <Text style={styles.subGreeting}>
            {formatDate(new Date(), 'long')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Account Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.accountSelector}
        contentContainerStyle={styles.accountSelectorContent}
      >
        {accounts.map((account) => {
          const colors = ACCOUNT_TYPE_COLORS[account.tipo] || ACCOUNT_TYPE_COLORS.personal;
          const isSelected = selectedAccount?.id === account.id;
          return (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                isSelected && styles.accountCardSelected,
                { borderColor: colors.from },
              ]}
              onPress={() => setSelectedAccount(account)}
            >
              <Text
                style={[
                  styles.accountName,
                  isSelected && { color: colors.from },
                ]}
                numberOfLines={1}
              >
                {account.nombre}
              </Text>
              <Text style={styles.accountBalance}>
                {formatCurrency(account.balance?.saldo ?? account.saldo ?? 0, account.moneda)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Loading text="Cargando datos..." />
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <Card style={[styles.summaryCard, styles.incomeCard]}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="trending-up" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(
                  dashboardData.totals?.ingresos || selectedAccount?.balance?.totalIngresos || 0,
                  selectedAccount?.moneda
                )}
              </Text>
            </Card>

            <Card style={[styles.summaryCard, styles.expenseCard]}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="trending-down" size={20} color={COLORS.danger} />
              </View>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(
                  dashboardData.totals?.gastos || selectedAccount?.balance?.totalGastos || 0,
                  selectedAccount?.moneda
                )}
              </Text>
            </Card>
          </View>

          {/* Balance Card */}
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Balance Neto</Text>
            <Text
              style={[
                styles.balanceValue,
                {
                  color:
                    (dashboardData.totals?.balance || selectedAccount?.balance?.saldo || 0) >= 0
                      ? COLORS.success
                      : COLORS.danger,
                },
              ]}
            >
              {formatCurrency(
                dashboardData.totals?.balance || selectedAccount?.balance?.saldo || 0,
                selectedAccount?.moneda
              )}
            </Text>
          </Card>

          {/* Income vs Expenses Chart */}
          {dashboardData?.monthlyTrends && dashboardData.monthlyTrends.length > 0 && (
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tendencia Mensual</Text>
              <LineChart
                data={{
                  labels: dashboardData.monthlyTrends.slice(-6).map((t) =>
                    t.mes ? t.mes.substring(5, 7) : ''
                  ),
                  datasets: [
                    {
                      data: dashboardData.monthlyTrends.slice(-6).map((t) =>
                        parseFloat(t.ingresos) || 0
                      ),
                      color: () => COLORS.success,
                      strokeWidth: 2,
                    },
                    {
                      data: dashboardData.monthlyTrends.slice(-6).map((t) =>
                        parseFloat(t.gastos) || 0
                      ),
                      color: () => COLORS.danger,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Ingresos', 'Gastos'],
                }}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card>
          )}

          {/* Expenses by Category */}
          {dashboardData?.expensesByCategory &&
            dashboardData.expensesByCategory.length > 0 && (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Gastos por Categoría</Text>
                <PieChart
                  data={dashboardData.expensesByCategory.slice(0, 5).map((cat, index) => ({
                    name: cat.categoria || 'Sin categoría',
                    total: parseFloat(cat.total) || 0,
                    color: [
                      '#6366f1',
                      '#10b981',
                      '#f59e0b',
                      '#ef4444',
                      '#8b5cf6',
                    ][index],
                    legendFontColor: COLORS.gray[700],
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="total"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </Card>
            )}
        </>
      )}

      {/* Upcoming Events */}
      <Card style={styles.eventsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.slice(0, 3).map((event) => {
            // Handle different date field names from backend
            const eventDate = event.fecha_hora_inicio || event.fechaHoraInicio || event.fecha_inicio || event.fecha;
            const dateObj = eventDate ? new Date(eventDate) : null;

            return (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>
                    {dateObj ? dateObj.getDate() : '-'}
                  </Text>
                  <Text style={styles.eventMonth}>
                    {dateObj ? dateObj.toLocaleDateString('es-ES', { month: 'short' }) : '-'}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.titulo}
                  </Text>
                  <Text style={styles.eventTime}>
                    {dateObj ? formatDate(eventDate, 'time') : '-'}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noEventsText}>No hay eventos próximos</Text>
        )}
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() =>
            selectedAccount &&
            navigation.navigate('Movements', { accountId: selectedAccount.id })
          }
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#e0e7ff' }]}>
            <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>Movimientos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() =>
            selectedAccount &&
            navigation.navigate('Reports', { accountId: selectedAccount.id })
          }
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="bar-chart" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.quickActionText}>Reportes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Tasks')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="checkbox" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.quickActionText}>Tareas</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountSelector: {
    marginTop: 16,
  },
  accountSelectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    minWidth: 150,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    marginRight: 12,
  },
  accountCardSelected: {
    borderWidth: 2,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  noDataCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  eventsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  seeAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  eventDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  eventMonth: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  eventTime: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  noEventsText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingVertical: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});

export default DashboardScreen;
