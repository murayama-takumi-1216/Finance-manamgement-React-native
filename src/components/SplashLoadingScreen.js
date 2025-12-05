import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const SplashLoadingScreen = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideValue, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Spinning animation for the outer ring
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading dots animation
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          // Dot 1
          Animated.timing(dotOpacity1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Dot 2
          Animated.timing(dotOpacity2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Dot 3
          Animated.timing(dotOpacity3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Reset all
          Animated.parallel([
            Animated.timing(dotOpacity1, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotOpacity2, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotOpacity3, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background decorative elements */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeValue,
              transform: [{ translateY: slideValue }],
            },
          ]}
        >
          {/* Logo container with spinner */}
          <View style={styles.logoWrapper}>
            {/* Spinning ring */}
            <Animated.View
              style={[
                styles.spinnerRing,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <View style={styles.spinnerDot} />
            </Animated.View>

            {/* Logo with pulse */}
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: pulseValue }] },
              ]}
            >
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* App name */}
          <Text style={styles.appName}>Finance Manager</Text>
          <Text style={styles.tagline}>Gestiona tus finanzas inteligentemente</Text>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando</Text>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
              <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
              <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View style={styles.progressBarTrack}>
              <ProgressBar />
            </Animated.View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

// Animated progress bar component
const ProgressBar = () => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.progressBarFill,
        { width: progressWidth },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -50,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: 100,
    left: -50,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    bottom: -30,
    right: 50,
  },
  content: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  spinnerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
  },
  spinnerDot: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 48,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  progressBarContainer: {
    width: width * 0.6,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

export default SplashLoadingScreen;
