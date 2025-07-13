import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Create animation values for list items
  const [itemAnimations] = useState(() => {
    return Array(20).fill(0).map(() => new Animated.Value(0));
  });
  
  // Firebase instances
  const auth = getAuth(app);
  const database = getDatabase(app);
  
  useEffect(() => {
    // Start loading animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start continuous floating animation for FAB
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    loadComplaints();
  }, []);
  
  // Start animations for list items when complaints are loaded
  useEffect(() => {
    if (!loading && complaints.length > 0) {
      complaints.forEach((_, index) => {
        if (index < itemAnimations.length) {
          Animated.timing(itemAnimations[index], {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [loading, complaints]);
  
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Please log in to view complaints');
        setLoading(false);
        return;
      }
      
      // Reference to get user-specific complaints
      const complaintsRef = ref(database, `users/${currentUser.uid}/complaints`);
      
      // Listen for changes to get user complaints
      onValue(complaintsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const count = Object.keys(data).length;
          setTotalComplaints(count);
          
          const complaintsArray = Object.keys(data).map(key => ({
            id: key,
            userId: currentUser.uid, // Adding userId to each complaint for reference
            ...data[key]
          }));
          
          // Sort by createdAt timestamp (newest first)
          complaintsArray.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setComplaints(complaintsArray);
        } else {
          setComplaints([]);
          setTotalComplaints(0);
        }
        setLoading(false);
      });
      
    } catch (error) {
      console.error("Error loading complaints:", error);
      setError('Failed to load complaints');
      setLoading(false);
    }
  };
  
  const handleComplaintPress = (complaint) => {
    // Navigate to complaint detail screen with the complaint data
    navigation.navigate('Complaindetails', { complaint });
  };
  
  const handleAddComplaint = () => {
    navigation.navigate('AddComplaint');
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return '#FF7959';
      case 'resolved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'new':
      default: return '#007AFF';
    }
  };
  
  const getFormattedDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Render each complaint item with animation
  const renderComplaintItem = ({ item, index }) => {
    // Use pre-initialized animation value from array
    const itemAnimation = index < itemAnimations.length ? itemAnimations[index] : new Animated.Value(1);
    
    return (
      <Animated.View
        style={{
          opacity: itemAnimation,
          transform: [
            {
              translateY: itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={styles.complaintItem}
          onPress={() => handleComplaintPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.complaintHeader}>
            <Text style={styles.complaintTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.dateText}>
              {getFormattedDate(item.createdAt)}
            </Text>
          </View>
          
          <View style={styles.complaintContent}>
            <Text style={styles.complaintDescription} numberOfLines={2}>
              {item.description || 'No description provided'}
            </Text>
          </View>
          
          <View style={styles.complaintFooter}>
            <View style={styles.addressBadge}>  
              <Ionicons 
                name="location-outline" 
                size={14} 
                color="#FF7959" 
              />
              <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7959" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>LoopIn</Text>
            </View>
            <Text style={styles.headerSubtitle}>My Complaints</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadComplaints()}
          >
            <Ionicons name="refresh-outline" size={22} color="#FF7959" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statsIcon}>
              <Ionicons name="document-text" size={28} color="#FF7959" />
            </View>
            <View style={styles.statsInfo}>
              <Text style={styles.statsNumber}>{totalComplaints}</Text>
              <Text style={styles.statsLabel}>Total Reports</Text>
            </View>
          </View>
          <View style={styles.statsIndicator} />
        </View>
      </Animated.View>
      
      {complaints.length > 0 ? (
        <FlatList
          data={complaints}
          renderItem={renderComplaintItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View 
          style={[
            styles.emptyContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={64} color="#FF7959" />
          </View>
          <Text style={styles.emptyText}>No complaints yet</Text>
          <Text style={styles.emptySubText}>Create your first complaint to get started</Text>
          
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddComplaint}
          >
            <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.emptyButtonText}>Add Complaint</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <Animated.View
        style={[
          styles.addButton,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.addButtonTouchable}
          onPress={handleAddComplaint}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    backgroundColor: '#FF7959',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    shadowColor: '#FF7959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 121, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 121, 89, 0.2)',
  },
  statsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    overflow: 'hidden',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 121, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsInfo: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  statsIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF7959',
    borderRadius: 2,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  complaintItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  complaintContent: {
    marginBottom: 16,
  },
  complaintDescription: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 121, 89, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    maxWidth: '65%',
    borderWidth: 1,
    borderColor: 'rgba(255, 121, 89, 0.2)',
  },
  addressText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 121, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 121, 89, 0.2)',
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#FF7959',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF7959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
  },
  addButtonTouchable: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7959',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7959',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 121, 89, 0.3)',
  },
});

export default HomeScreen;