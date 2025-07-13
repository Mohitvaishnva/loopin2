import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  Easing,
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

const AddComplaintScreen = ({ navigation }) => {
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  
  // References for form field focus
  const addressInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Firebase references
  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();

  useEffect(() => {
    // Staggered card animations
    const animations = cardAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    // Initial animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      ...animations
    ]).start();
  }, []);

  useEffect(() => {
    // Update progress bar animation based on form completion
    const filledFields = [title, address, description, capturedMedia].filter(Boolean).length;
    const totalFields = 4;
    const progress = filledFields / totalFields;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [title, address, description, capturedMedia]);

  const focusNextInput = (nextRef) => {
    if (nextRef && nextRef.current) {
      nextRef.current.focus();
    }
  };

  const clearMedia = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    
    setCapturedMedia(null);
    setMediaType(null);
  };

  const uploadMediaToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExtension = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      
      const mediaStorageRef = storageRef(storage, `complaints/${fileName}`);
      
      await uploadBytes(mediaStorageRef, blob);
      const downloadURL = await getDownloadURL(mediaStorageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading media:", error);
      
      if (error.code === 'storage/unauthorized') {
        Alert.alert(
          'Media Upload Error',
          'Unable to upload media due to permission issues. Your complaint will be submitted without media attachment.',
          [{ text: 'OK' }]
        );
        return null;
      }
      
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for your complaint');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Missing Information', 'Please enter an address');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a description');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Submission animation
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      let mediaURL = null;
      if (capturedMedia) {
        try {
          mediaURL = await uploadMediaToFirebase(capturedMedia);
        } catch (uploadError) {
          console.error("Media upload failed, continuing without media:", uploadError);
        }
      }
      
      const complaintsRef = ref(database, `users/${currentUser.uid}/complaints`);
      const newComplaintRef = push(complaintsRef);
      
      const complaintData = {
        title: title.trim(),
        address: address.trim(),
        description: description.trim(),
        mediaURL: mediaURL,
        mediaType: mediaType,
        createdAt: new Date().toISOString(),
        status: 'new',
        userId: currentUser.uid
      };
      
      await set(newComplaintRef, complaintData);
      
      // Success animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Alert.alert(
        'Success!', 
        'Your complaint has been submitted successfully and is being reviewed.',
        [{ text: 'OK', onPress: () => {
          resetForm();
          navigation.goBack();
        }}]
      ); 
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setAddress('');
    setDescription('');
    setCapturedMedia(null);
    setMediaType(null);
    setFocusedField(null);
  };
  
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'photo');
      }
    } catch (error) {
      console.log('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select from gallery');
    }
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });
    
    return (
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressFill,
            { width: progressWidth }
          ]}
        />
      </View>
    );
  };

  const renderFormCard = (children, index) => {
    const cardTranslateY = cardAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0]
    });
    
    return (
      <Animated.View 
        style={[
          styles.formCard,
          {
            opacity: cardAnimations[index],
            transform: [{ translateY: cardTranslateY }]
          }
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      
      {/* Fixed Header */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim 
          }
        ]}
      >
        <View style={styles.headerContent}>
          
          <Text style={styles.heading}>New Complaint</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <Text style={styles.subtitle}>Help us improve your community</Text>
        {renderProgressBar()}
      </Animated.View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View style={styles.formContainer}>
            {/* Title Card */}
            {renderFormCard(
              <View>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIconContainer}>
                    <Ionicons name="create-outline" size={16} color="#FF6B4A" />
                  </View>
                  <Text style={styles.fieldTitle}>Title</Text>
                  <Text style={styles.fieldRequired}>*</Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    focusedField === 'title' && styles.focusedInput
                  ]}
                  placeholder="What's the issue?"
                  placeholderTextColor="#666"
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => focusNextInput(addressInputRef)}
                  returnKeyType="next"
                />
              </View>
            , 0)}
            
            {/* Address Card */}
            {renderFormCard(
              <View>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIconContainer}>
                    <Ionicons name="location-outline" size={16} color="#4ECDC4" />
                  </View>
                  <Text style={styles.fieldTitle}>Location</Text>
                  <Text style={styles.fieldRequired}>*</Text>
                </View>
                <TextInput
                  ref={addressInputRef}
                  style={[
                    styles.textInput,
                    focusedField === 'address' && styles.focusedInput
                  ]}
                  placeholder="Where is this happening?"
                  placeholderTextColor="#666"
                  value={address}
                  onChangeText={setAddress}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => focusNextInput(descriptionInputRef)}
                  returnKeyType="next"
                />
              </View>
            , 1)}
            
            {/* Description Card */}
            {renderFormCard(
              <View>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIconContainer}>
                    <Ionicons name="document-text-outline" size={16} color="#A78BFA" />
                  </View>
                  <Text style={styles.fieldTitle}>Description</Text>
                  <Text style={styles.fieldRequired}>*</Text>
                </View>
                <TextInput
                  ref={descriptionInputRef}
                  style={[
                    styles.textInput,
                    styles.textAreaInput,
                    focusedField === 'description' && styles.focusedInput
                  ]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor="#666"
                  multiline={true}
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  textAlignVertical="top"
                />
              </View>
            , 2)}
            
            {/* Evidence Card */}
            {renderFormCard(
              <View>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIconContainer}>
                    <Ionicons name="camera-outline" size={16} color="#34D399" />
                  </View>
                  <Text style={styles.fieldTitle}>Evidence</Text>
                  <Text style={styles.fieldOptional}>Optional</Text>
                </View>
                
                {capturedMedia ? (
                  <View style={styles.mediaPreview}>
                    {mediaType === 'photo' ? (
                      <Image source={{ uri: capturedMedia }} style={styles.previewImage} />
                    ) : (
                      <View style={[styles.previewImage, styles.videoPreview]}>
                        <Ionicons name="videocam" size={32} color="#4ECDC4" />
                        <Text style={styles.videoText}>Video Selected</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={clearMedia}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color="#fff" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.mediaPickerButton} 
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <View style={styles.mediaIconContainer}>
                      <Ionicons name="images-outline" size={20} color="#34D399" />
                    </View>
                    <Text style={styles.mediaPickerText}>Add Photo or Video</Text>
                    <Text style={styles.mediaPickerSubtext}>Tap to select from gallery</Text>
                  </TouchableOpacity>
                )}
              </View>
            , 3)}
            
            {/* Submit Button */}
            {renderFormCard(
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  isSubmitting && styles.disabledButton
                ]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <View style={styles.submitButtonContent}>
                  {isSubmitting ? (
                    <>
                      <Ionicons name="hourglass-outline" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Submitting...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Submit Complaint</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            , 4)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    position: 'relative',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B4A',
    borderRadius: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  fieldRequired: {
    color: '#FF6B4A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fieldOptional: {
    color: '#666',
    fontSize: 12,
  },
  textInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 40,
  },
  focusedInput: {
    borderColor: '#FF6B4A',
    borderWidth: 2,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  mediaPickerButton: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mediaPickerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  mediaPickerSubtext: {
    color: '#666',
    fontSize: 12,
  },
  mediaPreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 12,
  },
  videoPreview: {
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  videoText: {
    marginTop: 6,
    fontWeight: '600',
    color: '#4ECDC4',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#FF6B4A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});
export default AddComplaintScreen;