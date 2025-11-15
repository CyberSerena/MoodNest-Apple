import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';

interface MoodEntry {
  timestamp: string;
  mood_value: number;
}

interface MoodChartProps {
  entries: MoodEntry[];
}

export default function MoodChart({ entries }: MoodChartProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No mood data yet</Text>
        <Text style={styles.emptySubtext}>Start logging your moods to see patterns</Text>
      </View>
    );
  }

  const chartData = entries
    .slice(0, 30)
    .reverse()
    .map((entry) => ({
      value: entry.mood_value,
      label: format(parseISO(entry.timestamp), 'MM/dd'),
      dataPointText: String(entry.mood_value),
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Timeline</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 60}
        height={220}
        spacing={40}
        initialSpacing={10}
        color="#4CAF50"
        thickness={3}
        noOfSections={4}
        maxValue={5}
        yAxisColor="#E0E0E0"
        xAxisColor="#E0E0E0"
        yAxisTextStyle={{ color: '#666' }}
        xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
        dataPointsColor="#4CAF50"
        dataPointsRadius={4}
        textShiftY={-8}
        textShiftX={-5}
        textFontSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});