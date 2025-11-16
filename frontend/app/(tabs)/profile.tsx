import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { useRouter, Link } from 'expo-router';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(user?.theme_preference === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notification_enabled ?? true
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/moods/export');
      const jsonData = JSON.stringify(response.data, null, 2);
      
      await Share.share({
        message: `MoodNest Data Export\n\n${jsonData}`,
        title: 'MoodNest Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    const theme = value ? 'dark' : 'light';
    try {
      await api.put('/auth/profile', { theme_preference: theme });
      updateUser({ theme_preference: theme });
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme preference');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await api.put('/auth/profile', { notification_enabled: value });
      updateUser({ notification_enabled: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Premium Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>

          <Link href="/(tabs)/advanced" asChild>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="analytics" size={24} color="#4CAF50" />
                <Text style={styles.menuText}>Advanced Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/predictions" asChild>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="bulb" size={24} color="#4CAF50" />
                <Text style={styles.menuText}>AI Predictions</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/journal" asChild>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="book" size={24} color="#4CAF50" />
                <Text style={styles.menuText}>Journal</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/goals" asChild>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="flag" size={24} color="#4CAF50" />
                <Text style={styles.menuText}>Goals</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={24} color="#4CAF50" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>Change theme appearance</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Mood check-in reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity style={styles.actionCard} onPress={handleExportData}>
            <Ionicons name="download-outline" size={24} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Export Data</Text>
              <Text style={styles.actionDescription}>
                Download your mood history as JSON
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>🌿 MoodNest</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Track, predict, and prepare for your emotional journey with AI-powered
              insights and personalized coping strategies.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#999',
  },
  aboutCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});