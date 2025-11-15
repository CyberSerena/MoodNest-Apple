import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface FactorSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: string;
}

export default function FactorSlider({
  label,
  value,
  onValueChange,
  min = 1,
  max = 5,
  icon,
}: FactorSliderProps) {
  const getValueColor = (val: number) => {
    if (val <= 2) return '#FF6B6B';
    if (val <= 3) return '#FFD700';
    return '#4CAF50';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {icon && `${icon} `}{label}
        </Text>
        <View style={[styles.valueBadge, { backgroundColor: getValueColor(value) }]}>
          <Text style={styles.valueText}>{value}</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={getValueColor(value)}
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor={getValueColor(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});