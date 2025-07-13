import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';

const { width } = Dimensions.get('window');

const ComplaintDetail = ({ route, navigation }) => {
  // Get complaint data passed from HomeScreen
  const { complaint } = route.params;
  const [detailedComplaint, setDetailedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  useEffect(() => {
    // Animate card entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch the most current complaint data from Firebase
    const fetchComplaintDetails = async () => {
      try {
        const database = getDatabase(app);
        const complaintRef = ref(database, `users/${complaint.userId}/complaints/${complaint.id}`);
        
        onValue(complaintRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDetailedComplaint({
              id: complaint.id,
              ...data
            });
            setLoading(false);
          } else {
            setError('Complaint not found');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error fetching complaint details:", error);
        setError('Failed to load complaint details');
        setLoading(false);
      }
    };
    
    // Use the existing complaint data first, then fetch latest
    setDetailedComplaint(complaint);
    fetchComplaintDetails();
  }, [complaint]);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return '#FF6B6B';
      case 'resolved': return '#4ECDC4';
      case 'rejected': return '#FF8E53';
      case 'new':
      default: return '#FF6B6B';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'in-progress': return 'time-outline';
      case 'resolved': return 'checkmark-circle-outline';
      case 'rejected': return 'close-circle-outline';
      case 'new':
      default: return 'alert-circle-outline';
    }
  };
  
  const getFormattedDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Enhanced function to render media based on mediaType
  const renderMediaItem = (item, index) => {
    // For evidence items with specific type property
    if (item.type) {
      if (item.type === 'image') {
        return (
          <View style={styles.evidenceImageContainer}>
            <Image
              source={{ uri: item.url }}
              style={styles.evidenceImage}
              defaultSource={require('../assets/reg1.jpg')}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
            </View>
          </View>
        );
      } else if (item.type === 'video') {
        return (
          <View style={styles.fileEvidence}>
            <View style={styles.fileIconContainer}>
              <Ionicons name="videocam-outline" size={28} color="#FF6B6B" />
            </View>
            <Text style={styles.fileText}>Video</Text>
          </View>
        );
      }
    }
    
    // For a single mediaURL with mediaType
    if (item.url || typeof item === 'string') {
      const url = item.url || item;
      const type = item.mediaType || detailedComplaint?.mediaType;
      
      if (type === 'photo' || !type) {
        return (
          <View style={styles.evidenceImageContainer}>
            <Image
              source={{ uri: url }}
              style={styles.evidenceImage}
              defaultSource={require('../assets/reg1.jpg')}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
            </View>
          </View>
        );
      } else if (type === 'video') {
        return (
          <View style={styles.fileEvidence}>
            <View style={styles.fileIconContainer}>
              <Ionicons name="videocam-outline" size={28} color="#FF6B6B" />
            </View>
            <Text style={styles.fileText}>Video Evidence</Text>
          </View>
        );
      }
    }
    
    // Default fallback
    return (
      <View style={styles.fileEvidence}>
        <View style={styles.fileIconContainer}>
          <Ionicons name="document-outline" size={28} color="#FF6B6B" />
        </View>
        <Text style={styles.fileText}>
          {item.name || `File ${index + 1}`}
        </Text>
      </View>
    );
  };
  
  if (loading && !detailedComplaint) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      

        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>{detailedComplaint?.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(detailedComplaint?.status) }
              ]}
            >
              <Ionicons 
                name={getStatusIcon(detailedComplaint?.status)} 
                size={14} 
                color="#000" 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>{detailedComplaint?.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>
                {getFormattedDate(detailedComplaint?.createdAt)}
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={20} color="#4ECDC4" />
              </View>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {detailedComplaint?.address || 'Not specified'}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#FF8E53" />
              </View>
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionContent}>
                {detailedComplaint?.description || 'No description provided'}
              </Text>
            </View>
          </View>
          
          {/* Enhanced Evidence Section */}
          {((detailedComplaint?.mediaURL) || 
            (detailedComplaint?.evidence && detailedComplaint?.evidence.length > 0)) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="images-outline" size={20} color="#9B59B6" />
                </View>
                <Text style={styles.sectionTitle}>Evidence</Text>
              </View>
              <View style={styles.evidenceContainer}>
                {detailedComplaint.evidence && detailedComplaint.evidence.length > 0 ? (
                  // Handle evidence array
                  detailedComplaint.evidence.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.evidenceItem}
                      onPress={() => {
                        // Handle evidence item press (e.g., view image fullscreen)
                      }}
                    >
                      {renderMediaItem(item, index)}
                    </TouchableOpacity>
                  ))
                ) : detailedComplaint.mediaURL ? (
                  // Handle single mediaURL with mediaType
                  <TouchableOpacity
                    style={styles.evidenceItem}
                    onPress={() => {
                      // Handle media press
                    }}
                  >
                    {renderMediaItem(detailedComplaint.mediaURL)}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
          
          {/* Enhanced Comments Section */}
          {detailedComplaint?.comments && detailedComplaint?.comments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#3498DB" />
                </View>
                <Text style={styles.sectionTitle}>Comments</Text>
                <View style={styles.commentCount}>
                  <Text style={styles.commentCountText}>
                    {detailedComplaint.comments.length}
                  </Text>
                </View>
              </View>
              <View style={styles.commentsContainer}>
                {detailedComplaint.comments.map((comment, index) => (
                  <View key={index} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {comment.author ? comment.author.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentDate}>
                          {getFormattedDate(comment.timestamp)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  descriptionContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  sectionContent: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
    fontWeight: '500',
  },
  evidenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  evidenceItem: {
    width: (width - 80) / 2,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  evidenceImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileEvidence: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  commentCount: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  commentCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  commentsContainer: {
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  commentText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default ComplaintDetail;