import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import notificationSound from '../../utils/notificationSound';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

const AlarmModal = ({ visible, onDismiss, onSnooze, reminder }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const audioIntervalRef = useRef(null);

  // Start shake animation
  useEffect(() => {
    if (visible) {
      // Shake animation
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -1,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(200),
        ])
      );

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      shake.start();
      pulse.start();

      return () => {
        shake.stop();
        pulse.stop();
        shakeAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }
  }, [visible, shakeAnim, pulseAnim]);

  // Play sound
  useEffect(() => {
    if (visible && reminder) {
      // Get the notification sound from reminder settings
      const soundId = reminder.notification_sound || reminder.notificationSound || 'default';
      const customUrl = reminder.custom_sound_url || reminder.customSoundUrl || null;

      // Play sound immediately
      notificationSound.play(soundId, customUrl);

      // Repeat every 3 seconds
      audioIntervalRef.current = setInterval(() => {
        notificationSound.play(soundId, customUrl);
      }, 3000);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [visible, reminder]);

  const handleDismiss = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    notificationSound.cleanup();
    onDismiss();
  };

  const handleSnooze = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    notificationSound.cleanup();
    onSnooze();
  };

  const shakeInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Shaking Alarm Icon */}
          <View style={styles.iconWrapper}>
            {/* Pulse ring */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.5, 0],
                  }),
                },
              ]}
            />
            {/* Main icon container */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ rotate: shakeInterpolate }],
                },
              ]}
            >
              <Ionicons name="alarm" size={64} color={COLORS.white} />
            </Animated.View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Recordatorio</Text>

          {/* Message */}
          <Text style={styles.message}>
            {reminder?.mensaje || reminder?.titulo || 'Tienes un recordatorio'}
          </Text>

          {/* Account info if available */}
          {(reminder?.cuenta?.nombre || reminder?.account?.nombre) && (
            <View style={styles.accountTag}>
              <Ionicons name="wallet-outline" size={14} color={COLORS.primary} />
              <Text style={styles.accountText}>
                {reminder?.cuenta?.nombre || reminder?.account?.nombre}
              </Text>
            </View>
          )}

          {/* Time */}
          <Text style={styles.time}>{currentTime}</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.snoozeButton}
              onPress={handleSnooze}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.gray[700]} />
              <Text style={styles.snoozeButtonText}>Repetir en 5 minutos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.okButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 32,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EF4444',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  message: {
    fontSize: 18,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  accountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  time: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 28,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gray[100],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
  },
  snoozeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  okButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AlarmModal;
