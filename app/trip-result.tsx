import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TripResultScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Details</Text>
      <Text style={styles.subtitle}>Trip ID: {id ?? 'N/A'}</Text>
      <Text style={styles.text}>This is a placeholder for trip summary, route, ETA, and CO₂ savings.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#25634b', marginBottom: 8 },
  text: { color: '#6b7280', textAlign: 'center' },
});
