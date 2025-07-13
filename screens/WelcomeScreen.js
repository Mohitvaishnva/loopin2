import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(40)).current;
  const buttonsAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create pulsing animation for logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Main entrance animation
    Animated.sequence([
      // Logo entrance with rotation
      Animated.parallel([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Content fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Feature cards staggered entrance
      Animated.timing(cardsAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Buttons entrance
      Animated.timing(buttonsAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start pulse animation after entrance
      pulse.start();
    });
  }, []);

  const handleGetStarted = () => {
    // Create ripple effect animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    
    navigation.navigate('RegisterScreen');
  };

  const handleLogin = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    
    navigation.navigate('LoginScreen');
  };

  const FeatureCard = ({ icon, title, subtitle, index, color }) => (
    <Animated.View
      style={[
        styles.featureCard,
        {
          transform: [
            {
              translateY: cardsAnim.interpolate({
                inputRange: [0, 40],
                outputRange: [0, 40],
                extrapolate: 'clamp',
              }),
            },
            {
              scale: scaleAnim,
            },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </Animated.View>
  );

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={Platform.OS === 'android'}
      />
      
      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View style={[styles.bgCircle, styles.bgCircle1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle2, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle3, { opacity: fadeAnim }]} />
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScaleAnim },
                { rotate: logoRotation },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LoopIn</Text>
            <View style={styles.logoGlow} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.welcomeText}>Welcome to the Future</Text>
          <Text style={styles.tagline}>
            Raise Issues • Build Community • Drive Change
          </Text>
        </Animated.View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="people"
            title="Community"
            subtitle="Connect & Collaborate"
            index={0}
            color="#FF6B4A"
          />
          <FeatureCard
            icon="megaphone"
            title="Civic Action"
            subtitle="Make Your Voice Heard"
            index={1}
            color="#4ECDC4"
          />
          <FeatureCard
            icon="trending-up"
            title="Track Progress"
            subtitle="Monitor Real Change"
            index={2}
            color="#45B7D1"
          />
          <FeatureCard
            icon="flash"
            title="Take Action"
            subtitle="Drive Impact"
            index={3}
            color="#96CEB4"
          />
        </View>
      </View>

      {/* Action Buttons Section */}
      <Animated.View
        style={[
          styles.actionSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: buttonsAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>I have an account</Text>
        </TouchableOpacity>

        <View style={styles.appDescription}>
          <Text style={styles.descriptionText}>✨ A civic responsibility app</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.05,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: '#FF6B4A',
    top: -150,
    right: -150,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: '#4ECDC4',
    bottom: -100,
    left: -100,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: '#45B7D1',
    top: '50%',
    left: -75,
  },
  headerSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    position: 'relative',
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    backgroundColor: '#FF6B4A',
    opacity: 0.3,
    zIndex: -1,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  featuresSection: {
    flex: 0.35,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  actionSection: {
    flex: 0.25,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  getStartedButton: {
    backgroundColor: '#FF6B4A',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 8,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#333333',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  appDescription: {
    alignItems: 'center',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;