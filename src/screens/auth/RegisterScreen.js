import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/useStore';
import { Button, Input } from '../../components/common';
import { COLORS } from '../../constants';

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const { register, isLoading, error, clearError } = useAuthStore();

  const validate = () => {
    const newErrors = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();

    if (!validate()) {
      return;
    }

    const result = await register(nombre.trim(), email.trim().toLowerCase(), password);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Registro exitoso',
        text2: 'Bienvenido a Finance Manager',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para comenzar
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre"
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                if (errors.nombre) {
                  setErrors({ ...errors, nombre: null });
                }
              }}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              error={errors.nombre}
            />

            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: null });
                }
              }}
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: null });
                }
              }}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: null });
                }
              }}
              placeholder="Repite tu contraseña"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {error && (
              <Text style={styles.errorMessage}>{error}</Text>
            )}

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorMessage: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default RegisterScreen;
