import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
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
  { id: 'default', name: 'Por defecto', type: 'builtin' },
  { id: 'chime', name: 'Campanilla', type: 'builtin' },
  { id: 'bell', name: 'Campana', type: 'builtin' },
  { id: 'ping', name: 'Ping', type: 'builtin' },
  { id: 'pop', name: 'Pop', type: 'builtin' },
  { id: 'ding', name: 'Ding', type: 'builtin' },
  { id: 'alert', name: 'Alerta', type: 'builtin' },
  { id: 'gentle', name: 'Suave', type: 'builtin' },
  { id: 'none', name: 'Sin sonido', type: 'builtin' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Nueva York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Bogota', label: 'Bogotá' },
  { value: 'America/Lima', label: 'Lima' },
  { value: 'America/Santiago', label: 'Santiago' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/London', label: 'Londres' },
  { value: 'Europe/Paris', label: 'París' },
  { value: 'UTC', label: 'UTC' },
];

const SettingsScreen = ({ navigation }) => {
  const { user, logout, updateProfile, changePassword, isLoading } = useAuthStore();
  const { preferences, fetchPreferences, updatePreferences, availableSounds } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [quietHoursStartModalVisible, setQuietHoursStartModalVisible] = useState(false);
  const [quietHoursEndModalVisible, setQuietHoursEndModalVisible] = useState(false);
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
  const soundRef = useRef(null);

  // Play notification sound preview
  const playNotificationSound = async (soundId) => {
    if (soundId === 'none') return;

    try {
      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Map sound IDs to frequencies and patterns for synthesis
      const soundConfigs = {
        default: { frequency: 880, duration: 200, type: 'sine' },
        chime: { frequency: 1200, duration: 300, type: 'sine' },
        bell: { frequency: 660, duration: 400, type: 'triangle' },
        ping: { frequency: 1000, duration: 150, type: 'sine' },
        pop: { frequency: 400, duration: 100, type: 'square' },
        ding: { frequency: 800, duration: 250, type: 'sine' },
        alert: { frequency: 600, duration: 350, type: 'sawtooth' },
        gentle: { frequency: 500, duration: 400, type: 'sine' },
      };

      const config = soundConfigs[soundId] || soundConfigs.default;

      // Use a simple beep sound as preview
      // Note: For production, you might want to use actual sound files
      const { sound } = await Audio.Sound.createAsync(
        { uri: `https://www.soundjay.com/buttons/beep-0${Math.floor(Math.random() * 9) + 1}.wav` },
        { shouldPlay: true, volume: (preferences?.notificationVolume || 80) / 100 }
      );

      soundRef.current = sound;

      // Auto unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.log('Error playing sound preview:', error);
      // Show a toast as fallback
      Toast.show({
        type: 'info',
        text1: 'Vista previa de sonido',
        text2: `Sonido: ${soundId}`,
        visibilityTime: 1000,
      });
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

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

  // Preference handlers
  const handleToggleNotifications = async (value) => {
    await updatePreferences({ notificationsEnabled: value });
  };

  const handleToggleEmailNotifications = async (value) => {
    await updatePreferences({ emailNotifications: value });
  };

  const handleToggleBrowserNotifications = async (value) => {
    await updatePreferences({ browserNotifications: value });
  };

  const handleToggleQuietHours = async (value) => {
    await updatePreferences({ quietHoursEnabled: value });
  };

  const handleVolumeChange = async (value) => {
    await updatePreferences({ notificationVolume: Math.round(value) });
  };

  const handleSoundChange = async (soundId) => {
    await updatePreferences({ notificationSound: soundId });
    setSoundModalVisible(false);
  };

  const handleTimezoneChange = async (timezone) => {
    await updatePreferences({ timezone });
    setTimezoneModalVisible(false);
  };

  const handleQuietHoursStartChange = async (time) => {
    await updatePreferences({ quietHoursStart: time });
    setQuietHoursStartModalVisible(false);
  };

  const handleQuietHoursEndChange = async (time) => {
    await updatePreferences({ quietHoursEnd: time });
    setQuietHoursEndModalVisible(false);
  };

  const getCurrentSoundLabel = () => {
    const allSounds = [...NOTIFICATION_SOUNDS, ...(availableSounds || [])];
    const sound = allSounds.find(s => s.id === (preferences?.notificationSound || 'default'));
    return sound?.name || 'Por defecto';
  };

  const getCurrentTimezoneLabel = () => {
    const tz = TIMEZONES.find(t => t.value === (preferences?.timezone || 'UTC'));
    return tz?.label || preferences?.timezone || 'UTC';
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

  const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

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
            {/* General Notifications */}
            <Card style={[styles.optionsCard, { marginTop: 0 }]}>
              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Notificaciones</Text>
                    <Text style={styles.optionSubtext}>
                      Activar/desactivar todas las notificaciones
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.notificationsEnabled ?? true}
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
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Notificaciones por Email</Text>
                    <Text style={styles.optionSubtext}>
                      Recibir notificaciones por correo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.emailNotifications ?? true}
                  onValueChange={handleToggleEmailNotifications}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Notificaciones Push</Text>
                    <Text style={styles.optionSubtext}>
                      Recibir alertas en el dispositivo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.browserNotifications ?? true}
                  onValueChange={handleToggleBrowserNotifications}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </Card>

            {/* Sound Settings */}
            <Text style={styles.sectionTitle}>Sonido</Text>
            <Card style={styles.optionsCard}>
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
                  <View style={styles.optionTextContainer}>
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

              <View style={styles.divider} />

              <View style={styles.sliderItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="volume-high-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Volumen</Text>
                    <Text style={styles.optionSubtext}>
                      {preferences?.notificationVolume ?? 80}%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={preferences?.notificationVolume ?? 80}
                  onSlidingComplete={handleVolumeChange}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.gray[300]}
                  thumbTintColor={COLORS.primary}
                />
              </View>
            </Card>

            {/* Quiet Hours */}
            <Text style={styles.sectionTitle}>Horario Silencioso</Text>
            <Card style={styles.optionsCard}>
              <View style={styles.switchItem}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="moon-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Activar Horario Silencioso</Text>
                    <Text style={styles.optionSubtext}>
                      No recibir notificaciones durante este horario
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences?.quietHoursEnabled ?? false}
                  onValueChange={handleToggleQuietHours}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              {preferences?.quietHoursEnabled && (
                <>
                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setQuietHoursStartModalVisible(true)}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name="time-outline"
                        size={22}
                        color={COLORS.gray[600]}
                      />
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>Hora de Inicio</Text>
                        <Text style={styles.optionSubtext}>
                          {preferences?.quietHoursStart || '22:00'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.gray[400]}
                    />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setQuietHoursEndModalVisible(true)}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name="time-outline"
                        size={22}
                        color={COLORS.gray[600]}
                      />
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>Hora de Fin</Text>
                        <Text style={styles.optionSubtext}>
                          {preferences?.quietHoursEnd || '08:00'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                </>
              )}
            </Card>

            {/* Timezone */}
            <Text style={styles.sectionTitle}>Zona Horaria</Text>
            <Card style={styles.optionsCard}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setTimezoneModalVisible(true)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="globe-outline"
                    size={22}
                    color={COLORS.gray[600]}
                  />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Zona Horaria</Text>
                    <Text style={styles.optionSubtext}>
                      {getCurrentTimezoneLabel()}
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
        <ScrollView style={styles.modalScrollView}>
          {NOTIFICATION_SOUNDS.map((sound) => (
            <View
              key={sound.id}
              style={[
                styles.soundOption,
                preferences?.notificationSound === sound.id && styles.soundOptionActive,
              ]}
            >
              <TouchableOpacity
                style={styles.soundOptionContent}
                onPress={() => handleSoundChange(sound.id)}
              >
                <Ionicons
                  name={sound.id === 'none' ? 'volume-mute-outline' : 'musical-note-outline'}
                  size={22}
                  color={preferences?.notificationSound === sound.id ? COLORS.primary : COLORS.gray[600]}
                />
                <Text
                  style={[
                    styles.soundOptionText,
                    preferences?.notificationSound === sound.id && styles.soundOptionTextActive,
                  ]}
                >
                  {sound.name}
                </Text>
                {(preferences?.notificationSound || 'default') === sound.id && (
                  <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              {sound.id !== 'none' && (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => playNotificationSound(sound.id)}
                >
                  <Ionicons name="play-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </Modal>

      {/* Timezone Selection Modal */}
      <Modal
        visible={timezoneModalVisible}
        onClose={() => setTimezoneModalVisible(false)}
        title="Zona Horaria"
      >
        <ScrollView style={styles.modalScrollView}>
          {TIMEZONES.map((tz) => (
            <TouchableOpacity
              key={tz.value}
              style={[
                styles.soundOption,
                preferences?.timezone === tz.value && styles.soundOptionActive,
              ]}
              onPress={() => handleTimezoneChange(tz.value)}
            >
              <Ionicons
                name="globe-outline"
                size={22}
                color={preferences?.timezone === tz.value ? COLORS.primary : COLORS.gray[600]}
              />
              <Text
                style={[
                  styles.soundOptionText,
                  preferences?.timezone === tz.value && styles.soundOptionTextActive,
                ]}
              >
                {tz.label}
              </Text>
              {preferences?.timezone === tz.value && (
                <Ionicons name="checkmark" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Quiet Hours Start Modal */}
      <Modal
        visible={quietHoursStartModalVisible}
        onClose={() => setQuietHoursStartModalVisible(false)}
        title="Hora de Inicio"
      >
        <ScrollView style={styles.modalScrollView}>
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour.value}
              style={[
                styles.soundOption,
                preferences?.quietHoursStart === hour.value && styles.soundOptionActive,
              ]}
              onPress={() => handleQuietHoursStartChange(hour.value)}
            >
              <Ionicons
                name="time-outline"
                size={22}
                color={preferences?.quietHoursStart === hour.value ? COLORS.primary : COLORS.gray[600]}
              />
              <Text
                style={[
                  styles.soundOptionText,
                  preferences?.quietHoursStart === hour.value && styles.soundOptionTextActive,
                ]}
              >
                {hour.label}
              </Text>
              {preferences?.quietHoursStart === hour.value && (
                <Ionicons name="checkmark" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Quiet Hours End Modal */}
      <Modal
        visible={quietHoursEndModalVisible}
        onClose={() => setQuietHoursEndModalVisible(false)}
        title="Hora de Fin"
      >
        <ScrollView style={styles.modalScrollView}>
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour.value}
              style={[
                styles.soundOption,
                preferences?.quietHoursEnd === hour.value && styles.soundOptionActive,
              ]}
              onPress={() => handleQuietHoursEndChange(hour.value)}
            >
              <Ionicons
                name="time-outline"
                size={22}
                color={preferences?.quietHoursEnd === hour.value ? COLORS.primary : COLORS.gray[600]}
              />
              <Text
                style={[
                  styles.soundOptionText,
                  preferences?.quietHoursEnd === hour.value && styles.soundOptionTextActive,
                ]}
              >
                {hour.label}
              </Text>
              {preferences?.quietHoursEnd === hour.value && (
                <Ionicons name="checkmark" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
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
    marginBottom: 8,
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
  optionTextContainer: {
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
  sliderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
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
  modalScrollView: {
    maxHeight: 400,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.gray[50],
  },
  soundOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  soundOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  playButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SettingsScreen;
