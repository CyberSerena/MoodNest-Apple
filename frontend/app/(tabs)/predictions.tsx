import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useMoodStore } from '../../store/moodStore';
import { format, parseISO } from 'date-fns';

export default function Predictions() {
  const { predictions, setPredictions } = useMoodStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/predictions');
      setPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrediction = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/predictions/generate');
      setPredictions([response.data, ...predictions]);
      Alert.alert('Success', 'New prediction generated!');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to generate prediction';
      Alert.alert('Error', message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMoodEmoji = (moodValue: number) => {
    if (moodValue <= 1.5) return '😢';
    if (moodValue <= 2.5) return '😔';
    if (moodValue <= 3.5) return '😐';
    if (moodValue <= 4.5) return '😊';
    return '😄';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FFD700';
    return '#FFA07A';
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
          <View>
            <Text style={styles.title}>AI Forecast</Text>
            <Text style={styles.subtitle}>Prepare for tomorrow</Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generatePrediction}
            disabled={isGenerating}
          >
            <Ionicons name="bulb" size={20} color="#FFF" />
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'New Forecast'}
            </Text>
          </TouchableOpacity>
        </View>

        {predictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>No predictions yet</Text>
            <Text style={styles.emptyText}>
              Log at least 3 moods to generate your first AI-powered prediction
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={generatePrediction}
              disabled={isGenerating}
            >
              <Text style={styles.emptyButtonText}>Generate Forecast</Text>
            </TouchableOpacity>
          </View>
        ) : (
          predictions.map((prediction: any) => (
            <View key={prediction.id} style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <View style={styles.predictionHeaderLeft}>
                  <Text style={styles.predictionEmoji}>
                    {getMoodEmoji(prediction.predicted_mood)}
                  </Text>
                  <View>
                    <Text style={styles.predictionDate}>
                      {format(parseISO(prediction.prediction_date), 'EEEE, MMM dd')}
                    </Text>
                    <Text style={styles.predictionMoodValue}>
                      Predicted: {prediction.predicted_mood.toFixed(1)}/5
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(prediction.confidence) },
                  ]}
                >
                  <Text style={styles.confidenceText}>
                    {Math.round(prediction.confidence * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.reasoningSection}>
                <Text style={styles.sectionTitle}>🧠 Insights</Text>
                <Text style={styles.reasoningText}>{prediction.reasoning}</Text>
              </View>

              <View style={styles.strategiesSection}>
                <Text style={styles.sectionTitle}>💪 Coping Strategies</Text>
                {prediction.coping_strategies.map((strategy: string, index: number) => (
                  <View key={index} style={styles.strategyItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.strategyText}>{strategy}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.predictionFooter}>
                Generated {format(parseISO(prediction.created_at), 'MMM dd, hh:mm a')}
              </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
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
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  predictionCard: {
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
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  predictionEmoji: {
    fontSize: 40,
  },
  predictionDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  predictionMoodValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reasoningSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  strategiesSection: {
    marginBottom: 12,
  },
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  strategyText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  predictionFooter: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});