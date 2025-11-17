import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

interface Worry {
  id: string;
  worry_text: string;
  category: 'let_go' | 'take_action' | 'scheduled' | 'resolved';
  intensity: number;
  created_at: string;
  resolved_at?: string;
}

export default function WorryTree() {
  const [worries, setWorries] = useState<Worry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewWorryModal, setShowNewWorryModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolvingWorry, setResolvingWorry] = useState<{ id: string; text: string } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [newWorry, setNewWorry] = useState({ text: '', intensity: 5 });

  useEffect(() => {
    fetchWorries();
  }, []);

  const fetchWorries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/worry-tree');
      setWorries(response.data);
    } catch (error) {
      console.error('Failed to fetch worries:', error);
      setWorries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeWorries = worries.filter((w) => w.category !== 'resolved');
  const resolvedWorries = worries.filter((w) => w.category === 'resolved');
  
  const stats = {
    total: worries.length,
    active: activeWorries.length,
    resolved: resolvedWorries.length,
    resolutionRate: worries.length > 0 ? Math.round((resolvedWorries.length / worries.length) * 100) : 0,
    avgIntensity: worries.length > 0 ? (worries.reduce((sum, w) => sum + w.intensity, 0) / worries.length).toFixed(1) : '0',
  };
  const categorizedWorries = {
    let_go: worries.filter((w) => w.category === 'let_go'),
    take_action: worries.filter((w) => w.category === 'take_action'),
    scheduled: worries.filter((w) => w.category === 'scheduled'),
    resolved: worries.filter((w) => w.category === 'resolved'),
  };

  const handleAddWorry = async () => {
    if (!newWorry.text.trim()) {
      Alert.alert('Error', 'Please enter your worry');
      return;
    }

    try {
      const response = await api.post('/worry-tree', {
        worry_text: newWorry.text,
        intensity: newWorry.intensity,
      });
      setWorries([response.data, ...worries]);
      setNewWorry({ text: '', intensity: 5 });
      setShowNewWorryModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add worry');
    }
  };

  const handleCategorizeWorry = async (worryId: string, category: string, resolutionNote?: string) => {
    try {
      const payload: any = { category };
      if (category === 'resolved' && resolutionNote) {
        payload.resolution_note = resolutionNote;
      }
      await api.put(`/worry-tree/${worryId}`, payload);
      fetchWorries();
    } catch (error) {
      Alert.alert('Error', 'Failed to update worry');
    }
  };

  const handleResolveWithNote = (worryId: string, worryText: string) => {
    setResolvingWorry({ id: worryId, text: worryText });
    setResolutionNote('');
    setShowResolutionModal(true);
  };

  const confirmResolve = async () => {
    if (resolvingWorry) {
      await handleCategorizeWorry(resolvingWorry.id, 'resolved', resolutionNote || undefined);
      setShowResolutionModal(false);
      setResolvingWorry(null);
      setResolutionNote('');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌳 Worry Tree</Text>
          <Text style={styles.subtitle}>CBT Tool - Premium Feature</Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Worries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💚</Text>
            <Text style={styles.statValue}>{stats.avgIntensity}</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowNewWorryModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Start New Worry Tree</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'tree' && styles.viewButtonActive]}
            onPress={() => setViewMode('tree')}
          >
            <Ionicons name="git-branch" size={18} color={viewMode === 'tree' ? '#FFF' : '#4CAF50'} />
            <Text style={[styles.viewButtonText, viewMode === 'tree' && styles.viewButtonTextActive]}>
              Tree View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={18} color={viewMode === 'list' ? '#FFF' : '#4CAF50'} />
            <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextActive]}>
              List View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tree Visualization */}
        {viewMode === 'tree' && (
          <View style={styles.treeContainer}>
            <View style={styles.treeVisual}>
              <Text style={styles.treeEmoji}>🌳</Text>
              <View style={styles.treeMessage}>
                {activeWorries.length === 0 ? (
                  <>
                    <Text style={styles.treeMessageTitle}>Your tree is peaceful!</Text>
                    <Text style={styles.treeMessageText}>
                      No active worries right now. Click "Start New Worry Tree" to add a worry.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.treeMessageTitle}>{activeWorries.length} Active Worries</Text>
                    <Text style={styles.treeMessageText}>
                      Tap on categories below to manage your worries
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Worry Categories with Actual Worries */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>🌳 Your Worry Categories</Text>
          
          {/* Let Go Category */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>🍃</Text>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>Let Go ({categorizedWorries.let_go.length})</Text>
                <Text style={styles.categoryDesc}>Can't control it - release the worry</Text>
              </View>
            </View>
            {categorizedWorries.let_go.length === 0 ? (
              <Text style={styles.emptyCategory}>No worries in this category</Text>
            ) : (
              categorizedWorries.let_go.map((worry) => (
                <TouchableOpacity
                  key={worry.id}
                  style={styles.worryItemSmall}
                  onPress={() => {
                    Alert.alert(
                      'Worry Actions',
                      worry.worry_text,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: '✅ Resolve',
                          onPress: () => handleResolveWithNote(worry.id, worry.worry_text),
                        },
                        {
                          text: '🌱 Take Action',
                          onPress: () => handleCategorizeWorry(worry.id, 'take_action'),
                        },
                        {
                          text: '🍂 Schedule',
                          onPress: () => handleCategorizeWorry(worry.id, 'scheduled'),
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.worryTextSmall}>{worry.worry_text}</Text>
                  <Text style={styles.worryIntensitySmall}>⚡{worry.intensity}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Take Action Category */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>🌱</Text>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>Take Action ({categorizedWorries.take_action.length})</Text>
                <Text style={styles.categoryDesc}>You can do something about this</Text>
              </View>
            </View>
            {categorizedWorries.take_action.length === 0 ? (
              <Text style={styles.emptyCategory}>No worries in this category</Text>
            ) : (
              categorizedWorries.take_action.map((worry) => (
                <TouchableOpacity
                  key={worry.id}
                  style={styles.worryItemSmall}
                  onPress={() => {
                    Alert.alert(
                      'Worry Actions',
                      worry.worry_text,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: '✅ Resolve',
                          onPress: () => handleResolveWithNote(worry.id, worry.worry_text),
                        },
                        {
                          text: '🍃 Let Go',
                          onPress: () => handleCategorizeWorry(worry.id, 'let_go'),
                        },
                        {
                          text: '🍂 Schedule',
                          onPress: () => handleCategorizeWorry(worry.id, 'scheduled'),
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.worryTextSmall}>{worry.worry_text}</Text>
                  <Text style={styles.worryIntensitySmall}>⚡{worry.intensity}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Scheduled Category */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>🍂</Text>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>Scheduled ({categorizedWorries.scheduled.length})</Text>
                <Text style={styles.categoryDesc}>Deal with it later</Text>
              </View>
            </View>
            {categorizedWorries.scheduled.length === 0 ? (
              <Text style={styles.emptyCategory}>No worries in this category</Text>
            ) : (
              categorizedWorries.scheduled.map((worry) => (
                <TouchableOpacity
                  key={worry.id}
                  style={styles.worryItemSmall}
                  onPress={() => {
                    Alert.alert(
                      'Worry Actions',
                      worry.worry_text,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: '✅ Resolve',
                          onPress: () => handleResolveWithNote(worry.id, worry.worry_text),
                        },
                        {
                          text: '🍃 Let Go',
                          onPress: () => handleCategorizeWorry(worry.id, 'let_go'),
                        },
                        {
                          text: '🌱 Take Action',
                          onPress: () => handleCategorizeWorry(worry.id, 'take_action'),
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.worryTextSmall}>{worry.worry_text}</Text>
                  <Text style={styles.worryIntensitySmall}>⚡{worry.intensity}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Resolved Category */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>✅</Text>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>Resolved ({categorizedWorries.resolved.length})</Text>
                <Text style={styles.categoryDesc}>Peace achieved!</Text>
              </View>
            </View>
            {categorizedWorries.resolved.length === 0 ? (
              <Text style={styles.emptyCategory}>No resolved worries yet</Text>
            ) : (
              categorizedWorries.resolved.map((worry) => (
                <TouchableOpacity
                  key={worry.id}
                  style={[styles.worryItemSmall, styles.worryResolved]}
                  onPress={() => {
                    Alert.alert(
                      'Resolved Worry',
                      worry.worry_text,
                      [
                        { text: 'OK', style: 'cancel' },
                        {
                          text: 'Move to Let Go',
                          onPress: () => handleCategorizeWorry(worry.id, 'let_go'),
                        },
                        {
                          text: 'Move to Action',
                          onPress: () => handleCategorizeWorry(worry.id, 'take_action'),
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={[styles.worryTextSmall, styles.worryTextResolved]}>{worry.worry_text}</Text>
                  <Text style={styles.worryIntensitySmall}>⚡{worry.intensity}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* List View */}
        {viewMode === 'list' && worries.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>All Worries</Text>
            {worries.map((worry) => (
              <View key={worry.id} style={styles.worryItem}>
                <View style={styles.worryHeader}>
                  <Text style={styles.worryText}>{worry.worry_text}</Text>
                  <Text style={styles.worryIntensity}>
                    Intensity: {worry.intensity}/10
                  </Text>
                </View>
                <View style={styles.worryActions}>
                  <TouchableOpacity
                    style={[styles.actionChip, worry.category === 'let_go' && styles.actionChipActive]}
                    onPress={() => handleCategorizeWorry(worry.id, 'let_go')}
                  >
                    <Text style={styles.actionChipText}>Let Go</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionChip, worry.category === 'take_action' && styles.actionChipActive]}
                    onPress={() => handleCategorizeWorry(worry.id, 'take_action')}
                  >
                    <Text style={styles.actionChipText}>Action</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionChip, worry.category === 'scheduled' && styles.actionChipActive]}
                    onPress={() => handleCategorizeWorry(worry.id, 'scheduled')}
                  >
                    <Text style={styles.actionChipText}>Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionChip, worry.category === 'resolved' && styles.actionChipActive]}
                    onPress={() => handleCategorizeWorry(worry.id, 'resolved')}
                  >
                    <Text style={styles.actionChipText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* New Worry Modal */}
      <Modal
        visible={showNewWorryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewWorryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowNewWorryModal(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add New Worry</Text>
              
              <Text style={styles.inputLabel}>What's worrying you?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your worry..."
                value={newWorry.text}
                onChangeText={(text) => setNewWorry({ ...newWorry, text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Intensity (1-10)</Text>
              <View style={styles.intensityContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.intensityButton,
                      newWorry.intensity === num && styles.intensityButtonActive,
                    ]}
                    onPress={() => setNewWorry({ ...newWorry, intensity: num })}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        newWorry.intensity === num && styles.intensityTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowNewWorryModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddWorry}>
                  <Text style={styles.modalSaveText}>Add Worry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Resolution Note Modal */}
      <Modal
        visible={showResolutionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResolutionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowResolutionModal(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>✅ Resolve Worry</Text>
              
              <Text style={styles.worryTextPreview}>{resolvingWorry?.text}</Text>
              
              <Text style={styles.inputLabel}>How did you resolve this? (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="E.g., Talked to someone, made a plan, took action..."
                value={resolutionNote}
                onChangeText={setResolutionNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowResolutionModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={confirmResolve}>
                  <Text style={styles.modalSaveText}>Mark as Resolved</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#FFF',
  },
  viewButtonActive: {
    backgroundColor: '#4CAF50',
  },
  viewButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 12,
  },
  viewButtonTextActive: {
    color: '#FFF',
  },
  treeContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    minHeight: 300,
  },
  treeVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  treeMessage: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
  },
  treeMessageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  treeMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    marginTop: 20,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  categorySection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#999',
  },
  emptyCategory: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  worryItemSmall: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  worryResolved: {
    backgroundColor: '#E8F5E9',
  },
  worryTextSmall: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  worryTextResolved: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  worryIntensitySmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 8,
  },
  listContainer: {
    marginTop: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  worryItem: {
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
  worryHeader: {
    marginBottom: 12,
  },
  worryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  worryIntensity: {
    fontSize: 14,
    color: '#666',
  },
  worryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#FFF',
  },
  actionChipActive: {
    backgroundColor: '#4CAF50',
  },
  actionChipText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  intensityText: {
    fontSize: 14,
    color: '#666',
  },
  intensityTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
