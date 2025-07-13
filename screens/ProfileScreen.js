import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Get auth and database references
  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();

  useEffect(() => {
    // Check if a user is logged in
    const user = auth.currentUser;
    
    if (user) {
      // Create a reference to the user's data location
      const userRef = ref(database, 'users/' + user.uid);
      
      // Set up listener for user data
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData({
            uid: user.uid,
            name: data.name || 'User',
            email: data.email || user.email,
            profileImage: data.profileImage || 'https://via.placeholder.com/150',
            memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2023'
          });
        } else {
          // If no data exists yet in the database
          setUserData({
            uid: user.uid,
            name: 'User',
            email: user.email,
            profileImage: 'https://via.placeholder.com/150',
            memberSince: 'New Member'
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
      
      // Clean up subscription
      return () => unsubscribe();
    } else {
      // No user is signed in
      setLoading(false);
    }
  }, []);

  // Request permission for image library
  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
          return false;
        }
        return true;
      } catch (err) {
        console.error("Error requesting permissions:", err);
        return false;
      }
    }
    return true;
  };

  // Function to upload image to Firebase Storage
  const uploadImageAsync = async (uri) => {
    const user = auth.currentUser;
    if (!user) return null;
  
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a storage path that matches your security rules
      const filename = `${Date.now()}.jpg`;
      const imageRef = storageRef(storage, `users/${user.uid}/profile_images/${filename}`);
      
      // Upload blob
      await uploadBytes(imageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Upload failed", "Sorry, we couldn't upload your photo. Please try again.");
      return null;  
    }
  };

  // Update profile photo in database
  const updateProfilePhoto = async (photoUrl) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, 'users/' + user.uid);
      try {
        await update(userRef, {
          profileImage: photoUrl
        });
        return true;
      } catch (error) {
        console.error("Error updating profile photo in database:", error);
        return false;
      }
    }
    return false;
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      console.log("Launching image picker...");
      
      // Use the original MediaTypeOptions that was working before
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log("Image picker result:", result);

      if (!result.canceled) {
        // Handle both newer and older API responses
        if (result.assets && result.assets.length > 0) {
          handleSelectedImage(result.assets[0].uri);
        } else if (result.uri) {
          // Fallback for older versions of ImagePicker
          handleSelectedImage(result.uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  // Handle selected image
  const handleSelectedImage = async (imageUri) => {
    console.log("Handling selected image:", imageUri);
    setUploadingImage(true);
    
    try {
      // Upload image to Firebase Storage
      const downloadURL = await uploadImageAsync(imageUri);
      
      if (downloadURL) {
        // Update profile photo in database
        const updated = await updateProfilePhoto(downloadURL);
        if (updated) {
          // setUserData is not needed as the realtime listener will update automatically
          Alert.alert("Success", "Profile photo updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error handling selected image:", error);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    console.log("Showing image picker options");
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        // Navigate to login screen (replace with your navigation method)
        console.log('User signed out');
        // navigation.replace('LoginScreen'); // Uncomment if using navigation
      })
      .catch(error => {
        console.error('Error signing out:', error);
      });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF6B47" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {uploadingImage ? (
              <View style={[styles.profileImage, styles.loadingImageContainer]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <Image 
                source={{ uri: userData?.profileImage }} 
                style={styles.profileImage} 
              />
            )}
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={showImagePickerOptions}
              disabled={uploadingImage}
            >
              <Ionicons name="camera" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData?.name}</Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            <Text style={styles.userMeta}>Member since {userData?.memberSince}</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => console.log('Profile Settings')}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={24} color="#ffffff" />
            </View>
            <Text style={styles.menuTitle}>Profile Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuCard} onPress={() => console.log('Notifications')}>
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            </View>
            <Text style={styles.menuTitle}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuCard} onPress={() => console.log('Help & Support')}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
            </View>
            <Text style={styles.menuTitle}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuCard} onPress={() => console.log('Privacy')}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#ffffff" />
            </View>
            <Text style={styles.menuTitle}>Privacy</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B47" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Profile Card
  profileCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B47',
  },
  loadingImageContainer: {
    backgroundColor: '#FF6B47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B47',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: '#666666',
  },
  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  menuIcon: {
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B47',
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B47',
    marginLeft: 8,
  },
});
export default ProfileScreen;