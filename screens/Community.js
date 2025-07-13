import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,  
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

const { width, height } = Dimensions.get('window');

const Community = () => {
  const insets = useSafeAreaInsets();
  
  // Animated values
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activePost, setActivePost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('forYou');
  const navigation = useNavigation();
  
  const auth = getAuth();
  const database = getDatabase();
  
  // Load posts from Firebase
  const loadPosts = (filterType = 'forYou') => {
    setRefreshing(true);
    
    try {
      // Get reference to posts in Firebase
      const postsRef = ref(database, 'posts');
      
      // Create query based on filter
      let postsQuery;
      if (filterType === 'trending') {
        // Order by likes for trending
        postsQuery = query(postsRef, orderByChild('likes'), limitToLast(10));
      } else {
        // For "For You" we'll just get the most recent posts
        postsQuery = query(postsRef, orderByChild('timestamp'), limitToLast(20));
      }
      
      // Listen for data
      onValue(postsQuery, (snapshot) => {
        const postsData = [];
        snapshot.forEach((childSnapshot) => {
          const post = childSnapshot.val();
          postsData.push({
            id: childSnapshot.key,
            name: post.userName || 'Anonymous',
            avatar: post.userProfilePic || require('../assets/reg1.jpg'), // Fallback to default
            timeAgo: getTimeAgo(post.timestamp),
            content: post.text,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            image: post.imageUrl ? { uri: post.imageUrl } : null,
            gradient: getRandomGradient()
          });
        });
        
        // Sort data by timestamp (newest first)
        postsData.sort((a, b) => b.timestamp - a.timestamp);
        
        setPosts(postsData);
        setRefreshing(false);
      }, (error) => {
        console.error("Error loading posts:", error);
        Alert.alert("Error", "Could not load posts. Please try again later.");
        setRefreshing(false);
      });
    } catch (error) {
      console.error("Error setting up posts listener:", error);
      setRefreshing(false);
    }
  };
  
  // Helper function to get random gradient for posts
  const getRandomGradient = () => {
    const gradients = [
      ['#FF6B6B', '#FF8E8E'],
      ['#4ECDC4', '#7BDBD5'],
      ['#45B7D1', '#6DD5FA'],
      ['#96CEB4', '#BFEDD5'],
      ['#FFA07A', '#FFB84A']
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
  };
  
  // Helper function to calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };
  
  // Load initial posts
  useEffect(() => {
    loadPosts();
    
    // Cleanup function
    return () => {
      // Firebase listeners are automatically detached when the component unmounts
    };
  }, []);
  
  // Handle refresh
  const onRefresh = () => {
    loadPosts(activeFilter);
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    loadPosts(filter);
  };

  // Handle like press with animation
  const handleLikePress = (postId) => {
    setActivePost(postId);
    
    // Update likes count locally for immediate feedback
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {...post, likes: post.likes + 1}
          : post
      )
    );
    
    // Update likes in Firebase (would need to implement)
    // updatePostLikes(postId);
    
    // Reset active post after animation
    setTimeout(() => setActivePost(null), 1000);
  };

  return (
    <View style={styles.container}>
      {/* Status Bar Configuration */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#0A0A0A" 
        translucent={true}
        hidden={false}
      />
      
      {/* Safe Area View for iOS/Android compatibility */}
      <SafeAreaView style={styles.safeArea}>
        {/* Animated Header */}
        <Animated.View style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
            opacity: scrollY.interpolate({
              inputRange: [0, 50, 100],
              outputRange: [1, 0.9, 1],
              extrapolate: 'clamp'
            }),
            transform: [
              { 
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -5],
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}>
        
        </Animated.View>
        
        {/* Filter tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'forYou' && styles.activeFilterTab]}
            onPress={() => handleFilterChange('forYou')}
          >
            <Text style={activeFilter === 'forYou' ? styles.activeFilterText : styles.filterText}>
              For You
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'trending' && styles.activeFilterTab]}
            onPress={() => handleFilterChange('trending')}
          >
            <Text style={activeFilter === 'trending' ? styles.activeFilterText : styles.filterText}>
              Trending
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Timeline Content */}
        <Animated.ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#FF6B6B"
              colors={['#FF6B6B', '#4ECDC4']}
            />
          }
        >
          {refreshing && posts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4']}
                  style={styles.emptyIconGradient}
                >
                  <Feather name="users" size={50} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyText}>No posts to display</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4']}
                  style={styles.refreshButtonGradient}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map((post, index) => (
              <View 
                key={post.id} 
                style={[
                  styles.postContainer,
                  {
                    transform: [
                      { 
                        scale: activePost === post.id ? 1.02 : 1
                      }
                    ],
                    shadowOpacity: activePost === post.id ? 0.3 : 0.1,
                  }
                ]}
              >
                {/* User info */}
                <View style={styles.userInfoContainer}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={['#FF6B6B', '#4ECDC4']}
                        style={styles.avatarGradient}
                      >
                        {typeof post.avatar === 'string' ? (
                          <Image source={{ uri: post.avatar }} style={styles.avatar} />
                        ) : (
                          <Image source={post.avatar} style={styles.avatar} />
                        )}
                      </LinearGradient>
                    </View>
                    <View>
                      <Text style={styles.userName}>{post.name}</Text>
                      <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                
                {/* Post content */}
                <Text style={styles.postContent}>{post.content}</Text>
                
                {/* Post image if available */}
                {post.image && (
                  <View style={styles.imageContainer}>
                    {typeof post.image === 'string' ? (
                      <Image source={{ uri: post.image }} style={styles.postImage} />
                    ) : (
                      <Image source={post.image} style={styles.postImage} />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.imageOverlay}
                    />
                  </View>
                )}
                
                {/* Interaction buttons */}
                <View style={styles.interactionContainer}>
                  <View style={styles.interactionItem}>
                    <TouchableOpacity 
                      style={styles.interactionButton}
                      onPress={() => handleLikePress(post.id)}
                    >
                      <LinearGradient
                        colors={activePost === post.id ? ['#FF6B6B', '#FF8E8E'] : ['#2A2A2A', '#1A1A1A']}
                        style={styles.interactionBackground}
                      >
                        <Feather 
                          name="heart" 
                          size={18} 
                          color={activePost === post.id ? "#fff" : "#888"} 
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.interactionCount}>{post.likes}</Text>
                  </View>
                  
                  <View style={styles.interactionItem}>
                    <TouchableOpacity style={styles.interactionButton}>
                      <LinearGradient
                        colors={['#2A2A2A', '#1A1A1A']}
                        style={styles.interactionBackground}
                      >
                        <Feather name="message-circle" size={18} color="#888" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.interactionCount}>{post.comments}</Text>
                  </View>
                  
                  <View style={styles.interactionItem}>
                    <TouchableOpacity style={styles.interactionButton}>
                      <LinearGradient
                        colors={['#2A2A2A', '#1A1A1A']}
                        style={styles.interactionBackground}
                      >
                        <Feather name="share" size={18} color="#888" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.interactionCount}>{post.shares}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
              </View>
            ))
          )}
          
          {/* Bottom spacing for FAB */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
        
        {/* Floating Action Button for creating a post */}
        <TouchableOpacity 
          style={[
            styles.fabContainer, 
            { 
              bottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 
            }
          ]}
          onPress={() => navigation.navigate('Addpost')}
        >
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            style={styles.fab}
          >
            <Feather name="edit-3" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    zIndex: 10,
    position: 'relative',
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#0A0A0A',
  },
  filterTab: {
    marginRight: 32,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeFilterTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B6B',
    borderRadius: 2,
  },
  filterText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingText: {
    color: '#888',
    fontSize: 18,
    fontFamily: 'System',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'System',
  },
  refreshButton: {
    marginTop: 20,
  },
  refreshButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
  },
  postContainer: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    fontFamily: 'System',
  },
  timeAgo: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#fff',
    fontFamily: 'System',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    marginRight: 8,
  },
  interactionBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionCount: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Community;