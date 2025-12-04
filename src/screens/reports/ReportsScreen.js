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
import { reportsAPI } from '../../services/api';
import { Card, Loading } from '../../components/common';
import { COLORS, formatCurrency } from '../../constants';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = ({ route }) => {
  const { accountId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReport, setActiveReport] = useState('totals');
  const [data, setData] = useState({});
  const [period, setPeriod] = useState('month');

  const loadReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { periodo: period };

      const [totals, expenses, income, trends] = await Promise.all([
        reportsAPI.getTotals(accountId, params).catch(() => ({ data: {} })),
        reportsAPI.getExpensesByCategory(accountId, params).catch(() => ({ data: [] })),
        reportsAPI.getIncomeByCategory(accountId, params).catch(() => ({ data: [] })),
        reportsAPI.getMonthlyTrends(accountId, params).catch(() => ({ data: [] })),
      ]);

      setData({
        totals: totals.data,
        expensesByCategory: expenses.data.categories || expenses.data || [],
        incomeByCategory: income.data.categories || income.data || [],
        monthlyTrends: trends.data.trends || trends.data || [],
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, period]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  }, [loadReportData]);

  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: () => COLORS.gray[600],
  };

  const reportTabs = [
    { key: 'totals', label: 'Resumen', icon: 'stats-chart' },
    { key: 'expenses', label: 'Gastos', icon: 'trending-down' },
    { key: 'income', label: 'Ingresos', icon: 'trending-up' },
    { key: 'trends', label: 'Tendencias', icon: 'analytics' },
  ];

  const periodOptions = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Año' },
  ];

  if (isLoading) {
    return <Loading text="Cargando reportes..." />;
  }

  return (
    <View style={styles.container}>
      {/* Report Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {reportTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeReport === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveReport(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeReport === tab.key ? COLORS.white : COLORS.gray[600]}
            />
            <Text
              style={[
                styles.tabText,
                activeReport === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {periodOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.periodButton,
              period === opt.key && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(opt.key)}
          >
            <Text
              style={[
                styles.periodText,
                period === opt.key && styles.periodTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Totals Report */}
        {activeReport === 'totals' && (
          <View>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <Card style={[styles.summaryCard, styles.incomeCard]}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
                <Text style={styles.summaryLabel}>Ingresos</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(data.totals?.ingresos || 0)}
                </Text>
              </Card>
              <Card style={[styles.summaryCard, styles.expenseCard]}>
                <Ionicons name="trending-down" size={24} color={COLORS.danger} />
                <Text style={styles.summaryLabel}>Gastos</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(data.totals?.gastos || 0)}
                </Text>
              </Card>
            </View>

            <Card style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance Neto</Text>
              <Text
                style={[
                  styles.balanceValue,
                  {
                    color:
                      (data.totals?.balance || 0) >= 0
                        ? COLORS.success
                        : COLORS.danger,
                  },
                ]}
              >
                {formatCurrency(data.totals?.balance || 0)}
              </Text>
            </Card>

            {/* Income vs Expenses Bar Chart */}
            {data.totals && (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Ingresos vs Gastos</Text>
                <BarChart
                  data={{
                    labels: ['Ingresos', 'Gastos'],
                    datasets: [
                      {
                        data: [
                          parseFloat(data.totals?.ingresos) || 0,
                          parseFloat(data.totals?.gastos) || 0,
                        ],
                        colors: [
                          () => COLORS.success,
                          () => COLORS.danger,
                        ],
                      },
                    ],
                  }}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                  withCustomBarColorFromData
                  flatColor
                />
              </Card>
            )}
          </View>
        )}

        {/* Expenses by Category */}
        {activeReport === 'expenses' && (
          <View>
            {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Gastos por Categoría</Text>
                <PieChart
                  data={data.expensesByCategory.slice(0, 5).map((cat, index) => ({
                    name: cat.categoria || cat.nombre || 'Sin categoría',
                    total: parseFloat(cat.total) || 0,
                    color: [
                      '#ef4444',
                      '#f97316',
                      '#f59e0b',
                      '#84cc16',
                      '#06b6d4',
                    ][index],
                    legendFontColor: COLORS.gray[700],
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="total"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />

                {/* Category List */}
                <View style={styles.categoryList}>
                  {data.expensesByCategory.map((cat, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <View
                          style={[
                            styles.categoryDot,
                            {
                              backgroundColor:
                                [
                                  '#ef4444',
                                  '#f97316',
                                  '#f59e0b',
                                  '#84cc16',
                                  '#06b6d4',
                                ][index % 5],
                            },
                          ]}
                        />
                        <Text style={styles.categoryName}>
                          {cat.categoria || cat.nombre || 'Sin categoría'}
                        </Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(cat.total || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="pie-chart-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={styles.emptyText}>
                  No hay datos de gastos para mostrar
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Income by Category */}
        {activeReport === 'income' && (
          <View>
            {data.incomeByCategory && data.incomeByCategory.length > 0 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Ingresos por Categoría</Text>
                <PieChart
                  data={data.incomeByCategory.slice(0, 5).map((cat, index) => ({
                    name: cat.categoria || cat.nombre || 'Sin categoría',
                    total: parseFloat(cat.total) || 0,
                    color: [
                      '#10b981',
                      '#14b8a6',
                      '#06b6d4',
                      '#3b82f6',
                      '#6366f1',
                    ][index],
                    legendFontColor: COLORS.gray[700],
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="total"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="pie-chart-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={styles.emptyText}>
                  No hay datos de ingresos para mostrar
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Monthly Trends */}
        {activeReport === 'trends' && (
          <View>
            {data.monthlyTrends && data.monthlyTrends.length > 0 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Tendencia Mensual</Text>
                <LineChart
                  data={{
                    labels: data.monthlyTrends.slice(-6).map((t) =>
                      t.mes ? t.mes.substring(5, 7) : ''
                    ),
                    datasets: [
                      {
                        data: data.monthlyTrends
                          .slice(-6)
                          .map((t) => parseFloat(t.ingresos) || 0),
                        color: () => COLORS.success,
                        strokeWidth: 2,
                      },
                      {
                        data: data.monthlyTrends
                          .slice(-6)
                          .map((t) => parseFloat(t.gastos) || 0),
                        color: () => COLORS.danger,
                        strokeWidth: 2,
                      },
                    ],
                    legend: ['Ingresos', 'Gastos'],
                  }}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="analytics-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={styles.emptyText}>
                  No hay datos de tendencias para mostrar
                </Text>
              </Card>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    gap: 6,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: COLORS.white,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  periodText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  periodTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  incomeCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.success,
  },
  expenseCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.danger,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  categoryList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  emptyCard: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  bottomPadding: {
    height: 32,
  },
});

export default ReportsScreen;
