import { View, Text, StyleSheet, FlatList } from 'react-native';

const items = [
  { id: 'n1', title: 'Transit delay on your saved route', time: '5m ago' },
  { id: 'n2', title: 'New carpool available near you', time: '1h ago' },
  { id: 'n3', title: 'Eco tip: Use transit to save CO₂', time: 'Yesterday' },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔔 {item.title}</Text>
            <Text style={styles.cardMeta}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontWeight: '600' },
  cardMeta: { color: '#6b7280', marginTop: 4 },
});
