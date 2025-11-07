import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';

export default function HelpSupportScreen() {
  const phone = '9692460105';
  const email = 'smrutiranjanb712@gmail.com';

  const callNow = () => Linking.openURL(`tel:${phone}`);
  const emailNow = () => Linking.openURL(`mailto:${email}`);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>We’re here to help. Reach us using the options below.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Us</Text>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={callNow}>
            <Text style={styles.primaryBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>E-mail</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
          <TouchableOpacity style={styles.outlineBtn} onPress={emailNow}>
            <Text style={styles.outlineBtnText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>FAQs</Text>
        <Text style={styles.muted}>Coming soon.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#6b7280' },
  value: { fontSize: 16, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  outlineBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db' },
  outlineBtnText: { color: '#111827', fontWeight: '700' },
  muted: { color: '#6b7280' },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
});
