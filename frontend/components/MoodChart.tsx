import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
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

  const chartData = entries.slice(0, 14).reverse();
  const maxValue = 5;
  const chartHeight = 200;
  const chartWidth = Dimensions.get('window').width - 80;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Timeline (Last 14 Days)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[5, 4, 3, 2, 1].map((val) => (
              <Text key={val} style={styles.yAxisLabel}>
                {val}
              </Text>
            ))}
          </View>

          {/* Chart bars */}
          <View style={styles.barsContainer}>
            <View style={styles.gridLines}>
              {[5, 4, 3, 2, 1].map((val) => (
                <View key={val} style={styles.gridLine} />
              ))}
            </View>
            
            <View style={styles.bars}>
              {chartData.map((entry, index) => {
                const barHeight = (entry.mood_value / maxValue) * chartHeight;
                const moodColors = ['#FF6B6B', '#FFA07A', '#FFD700', '#90EE90', '#4CAF50'];
                const barColor = moodColors[entry.mood_value - 1];
                
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]}>
                      <Text style={styles.barValue}>{entry.mood_value}</Text>
                    </View>
                    <Text style={styles.barLabel}>
                      {format(parseISO(entry.timestamp), 'MM/dd')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
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
  chartContainer: {
    flexDirection: 'row',
    height: 240,
    paddingVertical: 10,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 200,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#666',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    gap: 8,
  },
  barWrapper: {
    alignItems: 'center',
    width: 40,
  },
  bar: {
    width: 32,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 30,
  },
  barValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});