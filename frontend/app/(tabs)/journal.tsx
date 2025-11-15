import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useMoodStore } from '../../store/moodStore';
import { format, parseISO } from 'date-fns';

export default function Journal() {
  const { moods, setMoods } = useMoodStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/moods?days=90');
      setMoods(response.data);
    } catch (error) {
      console.error('Failed to fetch moods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const moodsWithJournal = moods.filter((mood: any) => mood.journal_text);

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
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>Your mood notes</Text>
        </View>

        {moodsWithJournal.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>No journal entries yet</Text>
            <Text style={styles.emptyText}>
              Add notes when logging your mood to see them here
            </Text>
          </View>
        ) : (
          moodsWithJournal.map((entry: any) => (
            <View key={entry.id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalEmoji}>{entry.mood_emoji}</Text>
                <View style={styles.journalHeaderText}>
                  <Text style={styles.journalDate}>
                    {format(parseISO(entry.timestamp), 'EEEE, MMM dd, yyyy')}
                  </Text>
                  <Text style={styles.journalTime}>
                    {format(parseISO(entry.timestamp), 'hh:mm a')}
                  </Text>
                </View>
              </View>

              <Text style={styles.journalText}>{entry.journal_text}</Text>

              <View style={styles.factorsContainer}>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>🛌 Sleep</Text>
                  <Text style={styles.factorValue}>{entry.factors.sleep}/5</Text>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>🧘 Stress</Text>
                  <Text style={styles.factorValue}>{entry.factors.stress}/5</Text>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>⚡ Energy</Text>
                  <Text style={styles.factorValue}>{entry.factors.energy}/5</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  journalCard: {
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
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  journalEmoji: {
    fontSize: 40,
  },
  journalHeaderText: {
    flex: 1,
  },
  journalDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  journalTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  journalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  factorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  factorItem: {
    alignItems: 'center',
  },
  factorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  factorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});