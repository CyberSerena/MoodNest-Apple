import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MoodSelector from '../../components/MoodSelector';
import FactorSlider from '../../components/FactorSlider';
import api from '../../utils/api';
import { useMoodStore } from '../../store/moodStore';
import { useAuth } from '../../contexts/AuthContext';

interface MoodOption {
  value: number;
  emoji: string;
  color: string;
  label: string;
}

const MOTIVATIONAL_QUOTES = [
  "Every day is a fresh start",
  "Your mental health matters",
  "Progress, not perfection",
  "Be kind to yourself today",
  "Small steps lead to big changes",
  "You're doing better than you think",
];

export default function Home() {
  const { user } = useAuth();
  const { addMood, moods } = useMoodStore();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [factors, setFactors] = useState({ sleep: 3, stress: 3, energy: 3 });
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();
    return moods.filter(m => new Date(m.timestamp).toDateString() === today).length;
  };

  const handleMoodSelect = (mood: MoodOption) => {
    setSelectedMood(mood);
    setShowDetails(true);
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please select how you\'re feeling');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/moods', {
        mood_value: selectedMood.value,
        mood_emoji: selectedMood.emoji,
        mood_color: selectedMood.color,
        factors,
        journal_text: journalText || null,
        timestamp: new Date().toISOString(),
      });

      addMood(response.data);
      Alert.alert('Success!', '✨ Mood logged successfully!', [
        { text: 'Great!', onPress: () => {
          setSelectedMood(null);
          setFactors({ sleep: 3, stress: 3, energy: 3 });
          setJournalText('');
          setShowDetails(false);
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log mood');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
          <View style={styles.headerGradient}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{user?.name}! 🌟</Text>
              </View>
              <View style={styles.todayBadge}>
                <Ionicons name="calendar" size={16} color="#4CAF50" />
                <Text style={styles.todayCount}>{getTodayCount()} today</Text>
              </View>
            </View>
            <View style={styles.quoteCard}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
              <Text style={styles.quote}>"{quote}"</Text>
            </View>
          </View>

          {/* Quick Mood Selection */}
          <View style={styles.quickMoodSection}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <Text style={styles.sectionSubtitle}>Tap an emoji to get started</Text>
            
            <MoodSelector
              selectedMood={selectedMood?.value || null}
              onSelectMood={handleMoodSelect}
            />
          </View>

          {/* Details Section */}
          {showDetails && selectedMood && (
            <>
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <Ionicons name="information-circle" size={24} color="#4CAF50" />
                  <Text style={styles.detailsTitle}>Tell us more</Text>
                </View>
                
                <FactorSlider
                  label="Sleep Quality"
                  icon="🛌"
                  value={factors.sleep}
                  onValueChange={(value) => setFactors({ ...factors, sleep: value })}
                />
                <FactorSlider
                  label="Stress Level"
                  icon="🧘"
                  value={factors.stress}
                  onValueChange={(value) => setFactors({ ...factors, stress: value })}
                />
                <FactorSlider
                  label="Energy Level"
                  icon="⚡"
                  value={factors.energy}
                  onValueChange={(value) => setFactors({ ...factors, energy: value })}
                />
              </View>

              <View style={styles.journalCard}>
                <View style={styles.journalHeader}>
                  <Ionicons name="create" size={20} color="#4CAF50" />
                  <Text style={styles.journalTitle}>Add a note (optional)</Text>
                </View>
                <TextInput
                  style={styles.journalInput}
                  placeholder="What's on your mind? Any thoughts or feelings..."
                  placeholderTextColor="#999"
                  value={journalText}
                  onChangeText={setJournalText}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{journalText.length}/500</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : 'Log My Mood'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Empty State */}
          {!showDetails && (
            <View style={styles.emptyState}>
              <Ionicons name="hand-left" size={48} color="#4CAF50" />
              <Text style={styles.emptyTitle}>Tap a mood above</Text>
              <Text style={styles.emptyText}>
                Select how you're feeling to log your mood entry
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerGradient: {
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quote: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  quickMoodSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  journalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F9FFF9',
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
