import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '../firebase';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [confirmSecureEntry, setConfirmSecureEntry] = useState(true);
  
  // Create refs for TextInput components
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  
  const navigation = useNavigation();
  const auth = getAuth(app);
  const database = getDatabase(app);

  const validateForm = () => {
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const saveUserToDatabase = (userId, userData) => {
    const userRef = ref(database, 'users/' + userId);
    return set(userRef, userData);
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await saveUserToDatabase(user.uid, {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
      
      navigation.replace('HomeScreen');
      
    } catch (error) {
      console.log("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please sign in or use a different email.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is invalid.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled.";
          break;
        default:
          errorMessage = "An unexpected error occurred. Please try again.";
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
              {/* Header Section - Welcome Style */}
              <View style={styles.header}>
                <Text style={styles.welcomeText}>Join the movement</Text>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>LoopIn</Text>
                </View>
                <Text style={styles.subtitle}>Create your account to get started</Text>
              </View>

              {/* Main Content */}
              <View style={styles.mainContent}>
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={18} color="#FF3B30" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Registration Form */}
                <View style={styles.formContainer}>
                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#666"
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => emailInputRef.current?.focus()}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        ref={emailInputRef}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        ref={passwordInputRef}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureEntry}
                        placeholder="Create a password"
                        placeholderTextColor="#666"
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setSecureEntry(!secureEntry)}
                      >
                        <Ionicons 
                          name={secureEntry ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#888" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        ref={confirmPasswordInputRef}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={confirmSecureEntry}
                        placeholder="Confirm your password"
                        placeholderTextColor="#666"
                        returnKeyType="done"
                        onSubmitEditing={handleSignUp}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setConfirmSecureEntry(!confirmSecureEntry)}
                      >
                        <Ionicons 
                          name={confirmSecureEntry ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#888" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements */}
                  <View style={styles.passwordRequirements}>
                    <Ionicons name="information-circle-outline" size={16} color="#666" />
                    <Text style={styles.passwordHint}>
                      Password must be at least 8 characters long
                    </Text>
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity 
                    style={[
                      styles.signUpButton, 
                      (loading || !name || !email || !password || !confirmPassword) && styles.disabledButton
                    ]}
                    onPress={handleSignUp}
                    disabled={loading || !name || !email || !password || !confirmPassword}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Section */}
              <View style={styles.footer}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Sign In Option */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                    <Text style={styles.signInLinkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>

                {/* Forgot Password Option (conditional) */}
                {error?.includes('already registered') && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordLink}
                    onPress={() => navigation.navigate('ForgotPassword', { email })}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  welcomeText: {
    color: '#888',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '400',
  },
  logoContainer: {
    backgroundColor: '#FF7959',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#FF7959',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  errorIcon: {
    marginRight: 12,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingRight: 16,
    height: '100%',
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 16,
  },
  passwordRequirements: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    marginTop: -12,
  },
  passwordHint: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  signUpButton: {
    backgroundColor: '#FF7959',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF7959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    gap: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: '#888',
    fontSize: 16,
  },
  signInLinkText: {
    color: '#FF7959',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF7959',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterScreen;