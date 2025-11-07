import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <View style={styles.menu}>
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.item}><Text style={styles.itemText}>Profile</Text></TouchableOpacity>
        </Link>
        <Link href="/theme" asChild>
          <TouchableOpacity style={styles.item}><Text style={styles.itemText}>Theme</Text></TouchableOpacity>
        </Link>
        <Link href="/settings" asChild>
          <TouchableOpacity style={styles.item}><Text style={styles.itemText}>Settings</Text></TouchableOpacity>
        </Link>
        <Link href="/help-support" asChild>
          <TouchableOpacity style={styles.item}><Text style={styles.itemText}>Help & Support</Text></TouchableOpacity>
        </Link>
        <Link href="/about" asChild>
          <TouchableOpacity style={styles.item}><Text style={styles.itemText}>About</Text></TouchableOpacity>
        </Link>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7faf9' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  menu: { backgroundColor: '#fff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  item: { paddingVertical: 14, paddingHorizontal: 12, borderBottomColor: '#eee', borderBottomWidth: StyleSheet.hairlineWidth },
  itemText: { fontSize: 16 },
});
