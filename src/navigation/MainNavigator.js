import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Tab Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Accounts':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'checkbox' : 'checkbox-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: COLORS.gray[900],
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Panel',
          headerTitle: 'Panel de Control',
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          title: 'Cuentas',
          headerTitle: 'Mis Cuentas',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tareas',
          headerTitle: 'Mis Tareas',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendario',
          headerTitle: 'Calendario',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ajustes',
          headerTitle: 'Configuración',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
