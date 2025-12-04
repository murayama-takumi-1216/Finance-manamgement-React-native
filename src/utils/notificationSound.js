// Notification Sound Utility for React Native
// Uses expo-av for audio playback with local bundled sounds

import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { API_URL } from '../config/api';

// Base URL for API - uses the same URL as the API service
const API_BASE_URL = API_URL || 'http://192.168.1.100:3000';

// Get the server base URL (without /api) for serving uploaded files
const getServerBaseUrl = () => {
  // Remove /api from the end if present
  return API_BASE_URL.replace(/\/api\/?$/, '');
};

// Local bundled sound assets (require must be static)
// Sound files are located in assets/sounds/ folder
const LOCAL_SOUNDS = {
  default: require('../../assets/sounds/default.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  bell: require('../../assets/sounds/bell.wav'),
  ping: require('../../assets/sounds/ping.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  ding: require('../../assets/sounds/ding.wav'),
  alert: require('../../assets/sounds/alert.wav'),
  gentle: require('../../assets/sounds/gentle.wav'),
};

class NotificationSoundManager {
  constructor() {
    this.sound = null;
    this.volume = 0.8;
    this.enabled = true;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  async unloadSound() {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (e) {
        // Ignore unload errors
      }
      this.sound = null;
    }
  }

  // Get local sound asset for each notification sound
  getLocalSound(soundId) {
    return LOCAL_SOUNDS[soundId] || LOCAL_SOUNDS.default;
  }

  async play(soundId = 'default', customUrl = null, onStatusUpdate = null) {
    if (!this.enabled || soundId === 'none') {
      if (onStatusUpdate) {
        onStatusUpdate({ isPlaying: false, duration: 0, position: 0, didJustFinish: true });
      }
      return;
    }

    try {
      await this.init();
      await this.unloadSound();

      let soundSource;
      if (customUrl) {
        // Custom uploaded sound - use server base URL (without /api)
        const uri = customUrl.startsWith('http') ? customUrl : `${getServerBaseUrl()}${customUrl}`;
        soundSource = { uri };
        console.log('Playing custom sound from:', uri);
      } else {
        // Use local bundled sound
        soundSource = this.getLocalSound(soundId);
        console.log('Playing local sound:', soundId);
      }

      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        {
          shouldPlay: true,
          volume: this.volume,
          isLooping: false,
        }
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (onStatusUpdate && status.isLoaded) {
          onStatusUpdate({
            isPlaying: status.isPlaying,
            duration: Math.floor((status.durationMillis || 0) / 1000),
            position: Math.floor((status.positionMillis || 0) / 1000),
            didJustFinish: status.didJustFinish || false,
          });
        }
        if (status.didJustFinish) {
          this.unloadSound();
        }
      });
    } catch (error) {
      console.log('Sound playback error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error de sonido',
        text2: 'No se pudo cargar el sonido.',
        visibilityTime: 2000,
      });
      if (onStatusUpdate) {
        onStatusUpdate({ isPlaying: false, duration: 0, position: 0, didJustFinish: true });
      }
    }
  }

  async preview(soundId, volume, customUrl = null, onStatusUpdate = null) {
    if (soundId === 'none') {
      if (onStatusUpdate) {
        onStatusUpdate({ isPlaying: false, duration: 0, position: 0, didJustFinish: true });
      }
      return;
    }

    if (volume !== undefined) {
      this.setVolume(volume);
    }
    this.enabled = true;

    await this.play(soundId, customUrl, onStatusUpdate);
  }

  getSoundName(soundId) {
    const names = {
      default: 'Por defecto',
      chime: 'Campanilla',
      bell: 'Campana',
      ping: 'Ping',
      pop: 'Pop',
      ding: 'Ding',
      alert: 'Alerta',
      gentle: 'Suave',
      none: 'Sin sonido',
    };
    return names[soundId] || soundId;
  }

  cleanup() {
    this.unloadSound();
  }
}

// Singleton instance
export const notificationSound = new NotificationSoundManager();

// Export available sounds for UI
export const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Por defecto' },
  { id: 'chime', name: 'Campanilla' },
  { id: 'bell', name: 'Campana' },
  { id: 'ping', name: 'Ping' },
  { id: 'pop', name: 'Pop' },
  { id: 'ding', name: 'Ding' },
  { id: 'alert', name: 'Alerta' },
  { id: 'gentle', name: 'Suave' },
  { id: 'none', name: 'Sin sonido' },
];

export default notificationSound;
