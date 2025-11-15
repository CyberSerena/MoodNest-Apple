import React, { useState } from 'react';
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

export default function Home() {
  const { user } = useAuth();
  const { addMood } = useMoodStore();
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [factors, setFactors] = useState({ sleep: 3, stress: 3, energy: 3 });
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      Alert.alert('Success', 'Mood logged successfully!');
      
      // Reset form
      setSelectedMood(null);
      setFactors({ sleep: 3, stress: 3, energy: 3 });
      setJournalText('');
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.subtitle}>How are you feeling right now?</Text>
          </View>

          <View style={styles.card}>
            <MoodSelector
              selectedMood={selectedMood?.value || null}
              onSelectMood={setSelectedMood}
            />
          </View>

          {selectedMood && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tell us more</Text>
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

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Add a note (optional)</Text>
                <TextInput
                  style={styles.journalInput}
                  placeholder="What's on your mind?"
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
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : 'Log Mood'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  card: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});