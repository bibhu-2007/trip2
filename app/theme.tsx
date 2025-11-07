import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export default function ThemeScreen() {
  const { theme, setTheme } = useAppTheme();

  const applyTheme = async (next: 'light' | 'dark') => {
    setTheme(next);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('appTheme', next);
    } catch {}
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <Text style={styles.subtitle}>Choose your preferred appearance.</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Appearance</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pill, theme === 'light' && styles.pillActive]}
            onPress={() => applyTheme('light')}
          >
            <Text style={[styles.pillText, theme === 'light' && styles.pillTextActive]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, theme === 'dark' && styles.pillActive]}
            onPress={() => applyTheme('dark')}
          >
            <Text style={[styles.pillText, theme === 'dark' && styles.pillTextActive]}>Dark</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.muted}>Current: {theme === 'dark' ? 'Dark' : 'Light'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  section: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: '#f9fafb' },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { color: '#111827', fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  muted: { color: '#6b7280' },
});
