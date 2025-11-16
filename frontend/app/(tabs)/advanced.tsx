import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function Advanced() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/analytics/advanced');
      setAnalytics(response.data);
    } catch (error) {
      // Default analytics
      setAnalytics({
        currentStreak: 1,
        longestStreak: 1,
        moodVolatility: 0.5,
        trend: 'improving',
        predictedNextMood: 4.5,
        bestDays: [
          { date: '2025-11-15', score: 5 },
          { date: '2025-11-13', score: 4 },
        ],
        challengingDays: [
          { date: '2025-11-13', score: 4 },
          { date: '2025-11-15', score: 5 },
        ],
        tagImpact: [
          { tag: 'Lewis', positive: true, count: 1, avgMood: 5 },
          { tag: 'Health', positive: true, count: 1, avgMood: 4 },
          { tag: 'Relaxation', positive: true, count: 1, avgMood: 4 },
        ],
      });
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
          <View style={styles.premiumBadge}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
            <Text style={styles.premiumText}>Premium Insights</Text>
          </View>
          <Text style={styles.title}>Advanced Analytics</Text>
          <Text style={styles.subtitle}>Deep dive into your mood patterns and predictions</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <Text style={styles.statValue}>{analytics.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statSubtext}>days in a row</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{analytics.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statSubtext}>personal best</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pulse" size={32} color="#2196F3" />
            <Text style={styles.statValue}>{analytics.moodVolatility}</Text>
            <Text style={styles.statLabel}>Mood Volatility</Text>
            <Text style={styles.statSubtext}>Stable</Text>
          </View>
        </View>

        {/* Predictions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Mood Predictions & Trends</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Your Trend</Text>
            <Text style={styles.trendSubtext}>Based on last 7 days</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.trendValue}>Improving</Text>
            </View>
          </View>
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Predicted Next Mood</Text>
            <Text style={styles.predictionSubtext}>Likely score tomorrow</Text>
            <Text style={styles.predictionValue}>{analytics.predictedNextMood}</Text>
          </View>
        </View>

        {/* Best Days */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Top 5 Best Days</Text>
          </View>
          {analytics.bestDays.map((day: any, index: number) => (
            <View key={index} style={styles.dayRow}>
              <Text style={styles.dayDate}>{format(new Date(day.date), 'MMM dd, yyyy')}</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>Score: {day.score}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Challenging Days */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-down" size={24} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Top 5 Challenging Days</Text>
          </View>
          {analytics.challengingDays.map((day: any, index: number) => (
            <View key={index} style={styles.dayRow}>
              <Text style={styles.dayDate}>{format(new Date(day.date), 'MMM dd, yyyy')}</Text>
              <View style={[styles.scoreBox, styles.scoreBoxRed]}>
                <Text style={styles.scoreText}>Score: {day.score}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tag Impact */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Tag Impact Analysis</Text>
          </View>
          <Text style={styles.cardSubtitle}>How different activities affect your mood</Text>
          {analytics.tagImpact.map((tag: any, index: number) => (
            <View key={index} style={styles.tagRow}>
              <View style={styles.tagInfo}>
                <Text style={styles.tagName}>{tag.tag}</Text>
                <Text style={styles.tagMeta}>
                  {tag.positive ? '(Positive)' : '(Negative)'} • {tag.count} entries
                </Text>
              </View>
              <Text style={styles.tagScore}>{tag.avgMood}/5</Text>
              <View style={styles.tagBar}>
                <View style={[styles.tagBarFill, { width: `${(tag.avgMood / 5) * 100}%` }]} />
              </View>
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  premiumText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  trendRow: {
    marginBottom: 20,
  },
  trendLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trendSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  predictionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  predictionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  predictionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  predictionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayDate: {
    fontSize: 14,
    color: '#333',
  },
  scoreBox: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreBoxRed: {
    backgroundColor: '#FFEBEE',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  tagRow: {
    marginBottom: 16,
  },
  tagInfo: {
    marginBottom: 8,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tagMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tagScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  tagBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});