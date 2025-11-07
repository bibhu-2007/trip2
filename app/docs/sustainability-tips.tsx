import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SustainabilityTipsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sustainability Tips</Text>
      <Text style={styles.tip}>• Try cycling for short distances.</Text>
      <Text style={styles.tip}>• Prefer public transit over single-occupancy cars.</Text>
      <Text style={styles.tip}>• Combine errands to reduce trips.</Text>
      <Text style={styles.tip}>• Carpool with coworkers or classmates.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  tip: { fontSize: 16, color: '#374151', marginBottom: 8 },
});
