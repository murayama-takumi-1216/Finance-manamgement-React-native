import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useStore';
import Loading from '../components/common/Loading';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Navigator
import MainNavigator from './MainNavigator';

// Account Stack Screens
import AccountDetailScreen from '../screens/accounts/AccountDetailScreen';
import MovementsScreen from '../screens/movements/MovementsScreen';
import MovementDetailScreen from '../screens/movements/MovementDetailScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import TagsScreen from '../screens/tags/TagsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import AccountTasksScreen from '../screens/tasks/AccountTasksScreen';
import AccountCalendarScreen from '../screens/calendar/AccountCalendarScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <Loading text="Cargando..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="AccountDetail"
            component={AccountDetailScreen}
            options={{ headerShown: true, title: 'Detalle de Cuenta' }}
          />
          <Stack.Screen
            name="Movements"
            component={MovementsScreen}
            options={{ headerShown: true, title: 'Movimientos' }}
          />
          <Stack.Screen
            name="MovementDetail"
            component={MovementDetailScreen}
            options={{ headerShown: true, title: 'Detalle de Movimiento' }}
          />
          <Stack.Screen
            name="Categories"
            component={CategoriesScreen}
            options={{ headerShown: true, title: 'Categorías' }}
          />
          <Stack.Screen
            name="Tags"
            component={TagsScreen}
            options={{ headerShown: true, title: 'Etiquetas' }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ headerShown: true, title: 'Reportes' }}
          />
          <Stack.Screen
            name="AccountTasks"
            component={AccountTasksScreen}
            options={{ headerShown: true, title: 'Tareas' }}
          />
          <Stack.Screen
            name="AccountCalendar"
            component={AccountCalendarScreen}
            options={{ headerShown: true, title: 'Calendario' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
