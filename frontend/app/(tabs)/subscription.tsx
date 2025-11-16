import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

export default function Subscription() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const packages = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Premium',
      price: 9.99,
      period: 'month',
      savings: null,
    },
    yearly: {
      id: 'yearly',
      name: 'Yearly Premium',
      price: 99.99,
      period: 'year',
      savings: '$20',
    },
  };

  const premiumFeatures = [
    { icon: 'analytics', title: 'Advanced Analytics', description: 'Deep insights into your mood patterns' },
    { icon: 'git-branch', title: 'Worry Tree (CBT)', description: 'Professional therapy tool' },
    { icon: 'trophy', title: 'Achievements & Badges', description: 'Unlock rewards for your progress' },
    { icon: 'bulb', title: 'AI Predictions', description: 'Forecast your future moods' },
    { icon: 'flag', title: 'Goal Setting', description: 'Set and track wellness goals' },
    { icon: 'infinite', title: 'Unlimited Entries', description: 'Log moods as often as you like' },
    { icon: 'download', title: 'Data Export', description: 'Export all your mood data' },
    { icon: 'moon', title: 'Dark Mode', description: 'Easy on the eyes' },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      // Get origin URL for redirect
      const originUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;
      
      // Call backend to create checkout session
      const response = await api.post('/subscription/checkout', {
        package_id: selectedPackage,
        origin_url: originUrl,
      });

      if (response.data.url) {
        // Open Stripe Checkout in browser
        const result = await WebBrowser.openBrowserAsync(response.data.url);
        
        // After user returns, check payment status
        if (result.type === 'cancel' || result.type === 'dismiss') {
          Alert.alert('Payment Cancelled', 'Your payment was cancelled. You can try again anytime.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={48} color="#4CAF50" />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>Unlock all features and get the most out of MoodNest</Text>
        </View>

        {/* Package Selection */}
        <View style={styles.packagesContainer}>
          <TouchableOpacity
            style={[
              styles.packageCard,
              selectedPackage === 'monthly' && styles.packageCardSelected,
            ]}
            onPress={() => setSelectedPackage('monthly')}
          >
            {selectedPackage === 'monthly' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
            <Text style={styles.packageName}>{packages.monthly.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>{packages.monthly.price}</Text>
              <Text style={styles.period}>/{packages.monthly.period}</Text>
            </View>
            <Text style={styles.packageDesc}>Billed monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.packageCard,
              selectedPackage === 'yearly' && styles.packageCardSelected,
            ]}
            onPress={() => setSelectedPackage('yearly')}
          >
            {selectedPackage === 'yearly' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
            {packages.yearly.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {packages.yearly.savings}</Text>
              </View>
            )}
            <Text style={styles.packageName}>{packages.yearly.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>{packages.yearly.price}</Text>
              <Text style={styles.period}>/{packages.yearly.period}</Text>
            </View>
            <Text style={styles.packageDesc}>Billed annually</Text>
            <Text style={styles.monthlyEquivalent}>$8.33/month</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color="#4CAF50" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#FFF" />
              <Text style={styles.subscribeButtonText}>
                Subscribe - ${packages[selectedPackage].price}/{packages[selectedPackage].period}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Secure payment processed by Stripe. Cancel anytime from your account settings.
        </Text>
      </ScrollView>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  packageCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currency: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  period: {
    fontSize: 16,
    color: '#666',
  },
  packageDesc: {
    fontSize: 14,
    color: '#666',
  },
  monthlyEquivalent: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
