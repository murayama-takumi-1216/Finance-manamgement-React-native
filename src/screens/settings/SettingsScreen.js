import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import {
  Card,
  Modal,
  Button,
  Input,
  Loading,
} from '../../components/common';
import { COLORS } from '../../constants';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

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
  const { preferences, fetchPreferences, updatePreferences, availableSounds, uploadSound, deleteSound, fetchAvailableSounds } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [quietHoursStartModalVisible, setQuietHoursStartModalVisible] = useState(false);
  const [quietHoursEndModalVisible, setQuietHoursEndModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);
  const [deletingSoundId, setDeletingSoundId] = useState(null);
  const [playingModalVisible, setPlayingModalVisible] = useState(false);
  const [currentlyPlayingSound, setCurrentlyPlayingSound] = useState(null);
  const [playingTime, setPlayingTime] = useState(0);
  const playingTimerRef = React.useRef(null);

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

  // Stop playing and clear timer
  const stopPlaying = () => {
    if (playingTimerRef.current) {
      clearInterval(playingTimerRef.current);
      playingTimerRef.current = null;
    }
    setPlayingModalVisible(false);
    setCurrentlyPlayingSound(null);
    setPlayingTime(0);
    notificationSound.cleanup();
  };

  // Play notification sound preview using the utility
  const playNotificationSound = (soundId, customUrl = null) => {
    // Clear any existing timer
    if (playingTimerRef.current) {
      clearInterval(playingTimerRef.current);
    }

    // Find sound name
    const builtInSound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
    const customSound = (availableSounds || []).find(s => s.id === soundId);
    const soundName = builtInSound?.name || customSound?.name || customSound?.filename || 'Sonido';

    setCurrentlyPlayingSound({ id: soundId, name: soundName });
    setPlayingTime(0);
    setPlayingModalVisible(true);

    notificationSound.preview(soundId, preferences?.notificationVolume || 80, customUrl);

    // Start timer to update elapsed time every second
    playingTimerRef.current = setInterval(() => {
      setPlayingTime(prev => prev + 1);
    }, 1000);

    // Auto-close modal after 5 seconds (most notification sounds are short)
    setTimeout(() => {
      stopPlaying();
    }, 5000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (playingTimerRef.current) {
        clearInterval(playingTimerRef.current);
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

  // Fetch preferences and available sounds on mount
  useEffect(() => {
    fetchPreferences();
    fetchAvailableSounds();
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

  const handleUploadSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) return;

      setUploadingSound(true);

      const formData = new FormData();
      formData.append('sound', {
        uri: file.uri,
        type: file.mimeType || 'audio/mpeg',
        name: file.name,
      });

      const uploadResult = await uploadSound(formData);

      if (uploadResult.success) {
        Toast.show({
          type: 'success',
          text1: 'Sonido subido',
          text2: 'El sonido se ha subido correctamente',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: uploadResult.error,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo subir el sonido',
      });
    } finally {
      setUploadingSound(false);
    }
  };

  const handleDeleteSound = async (soundId) => {
    setDeletingSoundId(soundId);
    try {
      const result = await deleteSound(soundId);
      if (result.success) {
        // If the deleted sound was selected, reset to default
        if (preferences?.notificationSound === soundId) {
          await updatePreferences({ notificationSound: 'default' });
        }
        Toast.show({
          type: 'success',
          text1: 'Sonido eliminado',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error,
        });
      }
    } finally {
      setDeletingSoundId(null);
    }
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
            {/* Sound Settings */}
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Sonido</Text>
            <Card style={styles.optionsCard}>
              {/* Volume Slider */}
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

              <View style={styles.divider} />

              {/* Sound Selection Label */}
              <View style={styles.soundSelectionHeader}>
                <Text style={styles.soundSelectionTitle}>Sonido de Notificación</Text>
              </View>

              {/* Built-in Sounds */}
              {NOTIFICATION_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundItem,
                    (preferences?.notificationSound || 'default') === sound.id && styles.soundItemActive,
                  ]}
                  onPress={() => handleSoundChange(sound.id)}
                >
                  <View style={styles.soundItemLeft}>
                    <Ionicons
                      name={sound.id === 'none' ? 'volume-mute-outline' : 'musical-note-outline'}
                      size={20}
                      color={(preferences?.notificationSound || 'default') === sound.id ? COLORS.primary : COLORS.gray[500]}
                    />
                    <Text
                      style={[
                        styles.soundItemText,
                        (preferences?.notificationSound || 'default') === sound.id && styles.soundItemTextActive,
                      ]}
                    >
                      {sound.name}
                    </Text>
                  </View>
                  <View style={styles.soundItemRight}>
                    {sound.id !== 'none' && (
                      <TouchableOpacity
                        style={styles.testButton}
                        onPress={() => playNotificationSound(sound.id)}
                      >
                        <Ionicons name="play-circle" size={26} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                    {(preferences?.notificationSound || 'default') === sound.id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Custom Sounds - Filter out built-in sounds */}
              {(() => {
                const builtInIds = NOTIFICATION_SOUNDS.map(s => s.id);
                const customSounds = (availableSounds || []).filter(s => !builtInIds.includes(s.id));
                if (customSounds.length === 0) return null;
                return (
                  <>
                    <View style={styles.customSoundsDivider}>
                      <Text style={styles.customSoundsLabel}>Sonidos Personalizados</Text>
                    </View>
                    {customSounds.map((sound) => (
                      <View
                        key={sound.id}
                        style={[
                          styles.soundItem,
                          preferences?.notificationSound === sound.id && styles.soundItemActive,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.soundItemLeft}
                          onPress={() => handleSoundChange(sound.id)}
                        >
                          <Ionicons
                            name="musical-note-outline"
                            size={20}
                            color={preferences?.notificationSound === sound.id ? COLORS.primary : COLORS.gray[500]}
                          />
                          <Text
                            style={[
                              styles.soundItemText,
                              preferences?.notificationSound === sound.id && styles.soundItemTextActive,
                            ]}
                          >
                            {sound.name || sound.filename || 'Sonido personalizado'}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.soundItemRight}>
                          <TouchableOpacity
                            style={styles.testButton}
                            onPress={() => playNotificationSound(sound.id, sound.url)}
                          >
                            <Ionicons name="play-circle" size={26} color={COLORS.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButtonInline}
                            onPress={() => handleDeleteSound(sound.id)}
                            disabled={deletingSoundId === sound.id}
                          >
                            {deletingSoundId === sound.id ? (
                              <ActivityIndicator size="small" color={COLORS.danger} />
                            ) : (
                              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                            )}
                          </TouchableOpacity>
                          {preferences?.notificationSound === sound.id && (
                            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                          )}
                        </View>
                      </View>
                    ))}
                  </>
                );
              })()}

              {/* Upload Button */}
              <TouchableOpacity
                style={styles.uploadButtonInline}
                onPress={handleUploadSound}
                disabled={uploadingSound}
              >
                {uploadingSound ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.uploadButtonInlineText}>Subir Sonido Personalizado</Text>
                  </>
                )}
              </TouchableOpacity>
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

      {/* Playing Music Modal */}
      <Modal
        visible={playingModalVisible}
        onClose={stopPlaying}
        title="Reproduciendo Sonido"
      >
        <View style={styles.playingModalContent}>
          <View style={styles.playingIconContainer}>
            <Ionicons name="musical-notes" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.playingSoundName}>
            {currentlyPlayingSound?.name || 'Sonido'}
          </Text>
          <View style={styles.playingTimeContainer}>
            <Text style={styles.playingTimeText}>
              0:{playingTime.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.playingProgressBar}>
            <View style={[styles.playingProgressFill, { width: `${Math.min((playingTime / 5) * 100, 100)}%` }]} />
          </View>
          <View style={styles.playingVolumeInfo}>
            <Ionicons name="volume-high-outline" size={18} color={COLORS.gray[500]} />
            <Text style={styles.playingVolumeText}>
              Volumen: {preferences?.notificationVolume ?? 80}%
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopPlaying}
          >
            <Ionicons name="stop-circle" size={24} color={COLORS.white} />
            <Text style={styles.stopButtonText}>Detener</Text>
          </TouchableOpacity>
        </View>
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
  soundSelectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  soundSelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
  },
  soundItemActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  soundItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  soundItemText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  soundItemTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  soundItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testButton: {
    padding: 4,
  },
  customSoundsDivider: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  customSoundsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
  },
  deleteButtonInline: {
    padding: 4,
  },
  uploadButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonInlineText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  playingModalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  playingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playingSoundName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  playingTimeContainer: {
    marginBottom: 8,
  },
  playingTimeText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  playingProgressBar: {
    width: '80%',
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  playingProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  playingVolumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  playingVolumeText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
