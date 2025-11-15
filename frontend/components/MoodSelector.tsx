import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MoodOption {
  value: number;
  emoji: string;
  color: string;
  label: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😢', color: '#FF6B6B', label: 'Very Sad' },
  { value: 2, emoji: '😔', color: '#FFA07A', label: 'Sad' },
  { value: 3, emoji: '😐', color: '#FFD700', label: 'Okay' },
  { value: 4, emoji: '😊', color: '#90EE90', label: 'Good' },
  { value: 5, emoji: '😄', color: '#4CAF50', label: 'Great' },
];

interface MoodSelectorProps {
  selectedMood: number | null;
  onSelectMood: (mood: MoodOption) => void;
}

export default function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodButton,
              { backgroundColor: mood.color },
              selectedMood === mood.value && styles.selectedMood,
            ]}
            onPress={() => onSelectMood(mood)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moodButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMood: {
    borderColor: '#000',
    borderWidth: 3,
  },
  emoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});