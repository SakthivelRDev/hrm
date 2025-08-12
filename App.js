import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import EmployeeTabNavigator from './navigation/EmployeeTabNavigator';
import AdminTabNavigator from './navigation/AdminTabNavigator';
import SuperAdminTabNavigator from './navigation/SuperAdminTabNavigator';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { View, ActivityIndicator } from 'react-native';
import { defaultHeaderOptions } from './navigation/headerOptions';

const Stack = createNativeStackNavigator();

function MainScreen() {
  const { user, userRole } = useAuth();

  // If user is authenticated but role not yet loaded, show a loader
  if (user && !userRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Render based on role
  if (userRole === 'super_admin') return <SuperAdminTabNavigator />;
  if (userRole === 'admin') return <AdminTabNavigator />;
  if (userRole === 'employee') return <EmployeeTabNavigator />;

  // Not logged in or role not matched
  return null;
}

function RootNavigator() {
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Stop loading when:
    // - logged out (user === null), or
    // - logged in and role resolved (user && userRole !== null)
    if (user === null || (user && userRole !== null)) {
      setIsLoading(false);
    }
  }, [user, userRole]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={defaultHeaderOptions}>
      {user ? (
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Register' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}