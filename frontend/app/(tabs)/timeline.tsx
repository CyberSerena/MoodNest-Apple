import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MoodChart from '../../components/MoodChart';
import api from '../../utils/api';
import { useMoodStore } from '../../store/moodStore';
import { format, parseISO } from 'date-fns';

export default function Timeline() {
  const { moods, setMoods } = useMoodStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    fetchMoods();
  }, [daysFilter]);

  const fetchMoods = async () => {
    setIsLoading(true);
    try {
      const [moodsResponse, statsResponse] = await Promise.all([
        api.get(`/moods?days=${daysFilter}`),
        api.get(`/moods/stats?days=${daysFilter}`),
      ]);
      setMoods(moodsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch moods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodLabel = (value: number) => {
    const labels = ['', 'Very Sad', 'Sad', 'Okay', 'Good', 'Great'];
    return labels[value] || '';
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
          <Text style={styles.title}>Mood Timeline</Text>
          <Text style={styles.subtitle}>Your emotional journey</Text>
        </View>

        <View style={styles.filterContainer}>
          {[7, 14, 30, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.filterButton,
                daysFilter === days && styles.filterButtonActive,
              ]}
              onPress={() => setDaysFilter(days)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  daysFilter === days && styles.filterButtonTextActive,
                ]}
              >
                {days}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_entries}</Text>
                <Text style={styles.statLabel}>Entries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.average_mood?.toFixed(1) || '0'}
                </Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {getMoodLabel(Math.round(stats.average_mood || 0))}
                </Text>
                <Text style={styles.statLabel}>Overall</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.chartCard}>
          <MoodChart entries={moods} />
        </View>

        <View style={styles.entriesCard}>
          <Text style={styles.entriesTitle}>Recent Entries</Text>
          {moods.length === 0 ? (
            <Text style={styles.emptyText}>No mood entries yet</Text>
          ) : (
            moods.slice(0, 10).map((entry: any) => (
              <View key={entry.id} style={styles.entryItem}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryEmoji}>{entry.mood_emoji}</Text>
                  <View>
                    <Text style={styles.entryDate}>
                      {format(parseISO(entry.timestamp), 'MMM dd, yyyy')}
                    </Text>
                    <Text style={styles.entryTime}>
                      {format(parseISO(entry.timestamp), 'hh:mm a')}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.moodBadge,
                    { backgroundColor: entry.mood_color },
                  ]}
                >
                  <Text style={styles.moodBadgeText}>{entry.mood_value}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entriesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    paddingVertical: 20,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryEmoji: {
    fontSize: 32,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  entryTime: {
    fontSize: 14,
    color: '#999',
  },
  moodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});