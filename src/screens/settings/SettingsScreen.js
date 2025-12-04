import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import {
  Card,
  Modal,
  Button,
  Input,
  Loading,
} from '../../components/common';
import { COLORS } from '../../constants';

const NOTIFICATION_SOUNDS = [
  { value: 'default', label: 'Por defecto' },
  { value: 'chime', label: 'Campanilla' },
  { value: 'bell', label: 'Campana' },
  { value: 'ding', label: 'Ding' },
  { value: 'pop', label: 'Pop' },
  { value: 'none', label: 'Sin sonido' },
];

const SettingsScreen = ({ navigation }) => {
  const { user, logout, updateProfile, changePassword, isLoading } = useAuthStore();
  const { preferences, fetchPreferences, updatePreferences } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    nombre: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Fetch preferences only on mount
  useEffect(() => {
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const openProfileModal = () => {
    setProfileData({
      nombre: user?.nombre || '',
      email: user?.email || '',
    });
    setErrors({});
    setProfileModalVisible(true);
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    setPasswordModalVisible(true);
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!profileData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Mínimo 6 caracteres';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Perfil actualizado',
        });
        setProfileModalVisible(false);
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

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setSaving(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Contraseña actualizada',
        });
        setPasswordModalVisible(false);
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

  const handleToggleNotifications = async (value) => {
    await updatePreferences({ notificaciones_activas: value });
  };

  const handleToggleEmailNotifications = async (value) => {
    await updatePreferences({ notificaciones_email: value });
  };

  const handleSoundChange = async (soundValue) => {
    await updatePreferences({ sonido_notificacion: soundValue });
    setSoundModalVisible(false);
  };

  const getCurrentSoundLabel = () => {
    const sound = NOTIFICATION_SOUNDS.find(s => s.value === (preferences?.sonido_notificacion || 'default'));
    return sound?.label || 'Por defecto';
  };

  const tabs = [
    { key: 'profile', label: 'Perfil', icon: 'person-outline' },
    { key: 'security', label: 'Seguridad', icon: 'shield-outline' },
    { key: 'notifications', label: 'Notificaciones', icon: 'notifications-outline' },
  ];

  const getUserInitials = () => {
    if (!user?.nombre) return 'U';
    return user.nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? COLORS.primary : COLORS.gray[500]}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View>
            {/* User Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Profile Options */}
            <Card style={styles.optionsCard}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={openProfileModal}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <Text style={styles.optionText}>Editar Perfil</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View>
            <Card style={styles.optionsCard}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={openPasswordModal}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="key-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <Text style={styles.optionText}>Cambiar Contraseña</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            </Card>

            <Card style={[styles.optionsCard, styles.dangerCard]}>
              <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={COLORS.danger}
                  />
                  <Text style={[styles.optionText, { color: COLORS.danger }]}>
                    Cerrar Sesión
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <View>
            <Card style={styles.optionsCard}>
              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View>
                    <Text style={styles.optionText}>Notificaciones Push</Text>
                    <Text style={styles.optionSubtext}>
                      Recibir alertas en el dispositivo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.notificaciones_activas ?? true}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View>
                    <Text style={styles.optionText}>Notificaciones por Email</Text>
                    <Text style={styles.optionSubtext}>
                      Recibir resúmenes por correo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.notificaciones_email ?? false}
                  onValueChange={handleToggleEmailNotifications}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setSoundModalVisible(true)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View>
                    <Text style={styles.optionText}>Sonido de Notificación</Text>
                    <Text style={styles.optionSubtext}>
                      {getCurrentSoundLabel()}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            </Card>

            <Card style={styles.optionsCard}>
              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View>
                    <Text style={styles.optionText}>Vibración</Text>
                    <Text style={styles.optionSubtext}>
                      Vibrar al recibir notificaciones
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.vibracion ?? true}
                  onValueChange={(value) => updatePreferences({ vibracion: value })}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </Card>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Finance Manager v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        title="Editar Perfil"
      >
        <Input
          label="Nombre"
          value={profileData.nombre}
          onChangeText={(text) => {
            setProfileData({ ...profileData, nombre: text });
            if (errors.nombre) setErrors({ ...errors, nombre: null });
          }}
          placeholder="Tu nombre"
          error={errors.nombre}
        />

        <Input
          label="Email"
          value={profileData.email}
          onChangeText={(text) => {
            setProfileData({ ...profileData, email: text });
            if (errors.email) setErrors({ ...errors, email: null });
          }}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <View style={styles.modalButtons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => setProfileModalVisible(false)}
            style={styles.modalButton}
          />
          <Button
            title="Guardar"
            onPress={handleUpdateProfile}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        title="Cambiar Contraseña"
      >
        <Input
          label="Contraseña Actual"
          value={passwordData.currentPassword}
          onChangeText={(text) => {
            setPasswordData({ ...passwordData, currentPassword: text });
            if (errors.currentPassword)
              setErrors({ ...errors, currentPassword: null });
          }}
          placeholder="Tu contraseña actual"
          secureTextEntry
          error={errors.currentPassword}
        />

        <Input
          label="Nueva Contraseña"
          value={passwordData.newPassword}
          onChangeText={(text) => {
            setPasswordData({ ...passwordData, newPassword: text });
            if (errors.newPassword) setErrors({ ...errors, newPassword: null });
          }}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          error={errors.newPassword}
        />

        <Input
          label="Confirmar Nueva Contraseña"
          value={passwordData.confirmPassword}
          onChangeText={(text) => {
            setPasswordData({ ...passwordData, confirmPassword: text });
            if (errors.confirmPassword)
              setErrors({ ...errors, confirmPassword: null });
          }}
          placeholder="Repite la nueva contraseña"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <View style={styles.modalButtons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => setPasswordModalVisible(false)}
            style={styles.modalButton}
          />
          <Button
            title="Cambiar"
            onPress={handleChangePassword}
            loading={saving}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Sound Selection Modal */}
      <Modal
        visible={soundModalVisible}
        onClose={() => setSoundModalVisible(false)}
        title="Sonido de Notificación"
      >
        {NOTIFICATION_SOUNDS.map((sound) => (
          <TouchableOpacity
            key={sound.value}
            style={[
              styles.soundOption,
              preferences?.sonido_notificacion === sound.value && styles.soundOptionActive,
            ]}
            onPress={() => handleSoundChange(sound.value)}
          >
            <Ionicons
              name={sound.value === 'none' ? 'volume-mute-outline' : 'musical-note-outline'}
              size={22}
              color={preferences?.sonido_notificacion === sound.value ? COLORS.primary : COLORS.gray[600]}
            />
            <Text
              style={[
                styles.soundOptionText,
                preferences?.sonido_notificacion === sound.value && styles.soundOptionTextActive,
              ]}
            >
              {sound.label}
            </Text>
            {(preferences?.sonido_notificacion || 'default') === sound.value && (
              <Ionicons name="checkmark" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  optionsCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  dangerCard: {
    marginTop: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  optionSubtext: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginHorizontal: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.gray[50],
    gap: 12,
  },
  soundOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  soundOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[700],
  },
  soundOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default SettingsScreen;
