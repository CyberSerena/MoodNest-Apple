import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  requirement: number;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ progress: 0, total: 10, completion: 0 });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/achievements');
      setAchievements(response.data.achievements);
      setStats(response.data.stats);
    } catch (error) {
      // Default achievements if API fails
      const defaultAchievements: Achievement[] = [
        { id: '1', title: 'First Step', description: 'Log your first mood entry', icon: '🌟', unlocked: true, progress: 1, requirement: 1 },
        { id: '2', title: 'Week Warrior', description: 'Log moods for 7 days in a row', icon: '🔥', unlocked: false, progress: 3, requirement: 7 },
        { id: '3', title: 'Month Master', description: 'Log moods for 30 days in a row', icon: '🏆', unlocked: false, progress: 3, requirement: 30 },
        { id: '4', title: 'Century Club', description: 'Log 100 mood entries', icon: '💯', unlocked: false, progress: 15, requirement: 100 },
        { id: '5', title: 'Happy Days', description: 'Log 10 very good moods', icon: '😄', unlocked: false, progress: 2, requirement: 10 },
        { id: '6', title: 'Growth Mindset', description: 'Use 50 journal prompts', icon: '🌱', unlocked: false, progress: 0, requirement: 50 },
        { id: '7', title: 'Worry Warrior', description: 'Complete 10 worry trees', icon: '🌳', unlocked: true, progress: 10, requirement: 10 },
        { id: '8', title: 'Peace Seeker', description: 'Resolve 20 worries', icon: '🕊️', unlocked: false, progress: 5, requirement: 20 },
        { id: '9', title: 'Consistent Tracker', description: 'Log moods for 365 days', icon: '📅', unlocked: false, progress: 3, requirement: 365 },
      ];
      setAchievements(defaultAchievements);
      const unlocked = defaultAchievements.filter(a => a.unlocked).length;
      setStats({ progress: unlocked, total: defaultAchievements.length, completion: Math.round((unlocked / defaultAchievements.length) * 100) });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🏆</Text>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>Unlock badges as you progress on your wellness journey</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressLabel}>Completion</Text>
          </View>
          <View style={styles.progressValues}>
            <Text style={styles.progressValue}>{stats.progress} / {stats.total}</Text>
            <Text style={styles.completionValue}>{stats.completion}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats.completion}%` }]} />
          </View>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.unlocked && styles.achievementUnlocked,
              ]}
            >
              <View style={styles.achievementIcon}>
                <Text style={[styles.iconEmoji, !achievement.unlocked && styles.iconLocked]}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </Text>
              </View>
              <Text style={[styles.achievementTitle, !achievement.unlocked && styles.textLocked]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDesc, !achievement.unlocked && styles.textLocked]}>
                {achievement.description}
              </Text>
              {achievement.unlocked ? (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>✓ Unlocked</Text>
                </View>
              ) : (
                <View style={styles.progressInfo}>
                  <Text style={styles.lockedText}>Locked</Text>
                  <Text style={styles.progressText}>
                    {achievement.progress}/{achievement.requirement}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  achievementUnlocked: {
    backgroundColor: '#FFF5E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.3,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  textLocked: {
    opacity: 0.5,
  },
  unlockedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unlockedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
});