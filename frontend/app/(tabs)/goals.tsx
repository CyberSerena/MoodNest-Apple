import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  completed: boolean;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Track Mood Daily',
      description: 'Log my mood every day for a week',
      targetDate: '2025-11-22',
      progress: 60,
      completed: false,
    },
    {
      id: '2',
      title: 'Worry Resolution',
      description: 'Resolve 5 worries using the worry tree',
      targetDate: '2025-11-30',
      progress: 40,
      completed: false,
    },
  ]);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '' });

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetDate: newGoal.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      completed: false,
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: '', description: '', targetDate: '' });
    setShowNewGoalModal(false);
  };

  const toggleGoalComplete = (id: string) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed, progress: goal.completed ? goal.progress : 100 } : goal
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🎯</Text>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>Set and track your wellness goals</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setShowNewGoalModal(true)}>
          <Ionicons name="add-circle" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Create New Goal</Text>
        </TouchableOpacity>

        <View style={styles.goalsContainer}>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Create your first wellness goal to get started</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, goal.completed && styles.goalCompleted]}>
                <View style={styles.goalHeader}>
                  <TouchableOpacity onPress={() => toggleGoalComplete(goal.id)}>
                    <Ionicons
                      name={goal.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={32}
                      color={goal.completed ? '#4CAF50' : '#CCC'}
                    />
                  </TouchableOpacity>
                  <View style={styles.goalContent}>
                    <Text style={[styles.goalTitle, goal.completed && styles.goalTitleCompleted]}>
                      {goal.title}
                    </Text>
                    {goal.description && (
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                    )}
                    <Text style={styles.goalDate}>Target: {new Date(goal.targetDate).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>{goal.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* New Goal Modal */}
      <Modal
        visible={showNewGoalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>

            <Text style={styles.inputLabel}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Track mood daily"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What do you want to achieve?"
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNewGoalModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddGoal}>
                <Text style={styles.modalSaveText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F5',
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
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  goalsContainer: {},
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalCompleted: {
    backgroundColor: '#E8F5E9',
  },
  goalHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  goalDate: {
    fontSize: 12,
    color: '#999',
  },
  progressContainer: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '600',
  },
});