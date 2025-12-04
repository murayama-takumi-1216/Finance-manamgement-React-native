// Notification Sound Utility for React Native
// Uses expo-av for audio playback

import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';

// Base URL for API - should match your backend
const API_BASE_URL = 'http://192.168.1.100:3000'; // Update this to your backend URL

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

  // Generate a simple beep using oscillator simulation
  // For mobile we use pre-recorded sounds or generate them
  getSoundUri(soundId) {
    // Use free sound effects from a CDN or bundled sounds
    // These are placeholder URLs - in production, use your own sound files
    const soundUrls = {
      default: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
      chime: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3',
      bell: 'https://cdn.freesound.org/previews/411/411090_5121236-lq.mp3',
      ping: 'https://cdn.freesound.org/previews/536/536420_11943129-lq.mp3',
      pop: 'https://cdn.freesound.org/previews/536/536108_11943129-lq.mp3',
      ding: 'https://cdn.freesound.org/previews/352/352661_6476280-lq.mp3',
      alert: 'https://cdn.freesound.org/previews/536/536113_11943129-lq.mp3',
      gentle: 'https://cdn.freesound.org/previews/352/352650_6476280-lq.mp3',
    };
    return soundUrls[soundId] || soundUrls.default;
  }

  async play(soundId = 'default', customUrl = null) {
    if (!this.enabled || soundId === 'none') {
      return;
    }

    try {
      await this.init();
      await this.unloadSound();

      let uri;
      if (customUrl) {
        // Custom uploaded sound
        uri = customUrl.startsWith('http') ? customUrl : `${API_BASE_URL}${customUrl}`;
      } else {
        uri = this.getSoundUri(soundId);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          volume: this.volume,
          isLooping: false,
        }
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.unloadSound();
        }
      });
    } catch (error) {
      console.log('Sound playback error:', error.message);
    }
  }

  async preview(soundId, volume, customUrl = null) {
    if (soundId === 'none') {
      Toast.show({
        type: 'info',
        text1: 'Sin sonido',
        text2: 'Las notificaciones seran silenciosas',
        visibilityTime: 1500,
      });
      return;
    }

    const originalVolume = this.volume;
    const originalEnabled = this.enabled;

    if (volume !== undefined) {
      this.setVolume(volume);
    }
    this.enabled = true;

    await this.play(soundId, customUrl);

    // Show toast to indicate sound is playing
    Toast.show({
      type: 'success',
      text1: this.getSoundName(soundId),
      text2: 'Reproduciendo...',
      visibilityTime: 1000,
    });

    this.volume = originalVolume;
    this.enabled = originalEnabled;
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
