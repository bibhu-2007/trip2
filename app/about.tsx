import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Link } from 'expo-router';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildDate = 'November 2025';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About SmartTrip</Text>

      <Text style={styles.section}>🧭 App Overview</Text>
      <Text style={styles.body}>
        SmartTrip helps users plan eco-friendly routes by comparing multiple transport modes based on time, cost, and carbon emissions. It encourages sustainable travel, helps reduce your personal CO₂ footprint, and rewards eco-conscious commuting.
      </Text>

      <Text style={styles.section}>🚀 Key Features</Text>
      <View style={styles.list}>
        <Text style={styles.item}>• 🌍 Smart trip planner (multi-mode routes)</Text>
        <Text style={styles.item}>• 🚗 Carpool matching</Text>
        <Text style={styles.item}>• 🌱 CO₂ savings tracker (EcoScore)</Text>
        <Text style={styles.item}>• 🏆 Rewards for sustainable trips</Text>
        <Text style={styles.item}>• 🔔 Real-time alerts & trip history</Text>
      </View>

      <Text style={styles.section}>🧠 Mission & Vision</Text>
      <Text style={styles.body}>
        Our mission is to make daily travel more sustainable and smarter through data-driven planning. We aim to help every commuter save time, money, and the planet — one trip at a time.
      </Text>

      <Text style={styles.section}>👩‍💻 Developer / Team</Text>
      <View style={styles.list}>
        <Text style={styles.item}>• Developed by Bibhu Prasad Panda</Text>
        <Text style={styles.item}>• BCA Final Year Project – 2025</Text>
        <Text style={styles.item}>• Department of Computer Applications, XYZ University</Text>
      </View>

      <Text style={styles.section}>🔧 Technologies Used</Text>
      <View style={styles.list}>
        <Text style={styles.item}>• React Native (Expo Managed Workflow)</Text>
        <Text style={styles.item}>• Firebase (Auth • Firestore • Functions)</Text>
        <Text style={styles.item}>• Google Maps / OpenRouteService</Text>
        <Text style={styles.item}>• Climatiq API (carbon estimation)</Text>
        <Text style={styles.item}>• TypeScript • Tailwind RN • Axios</Text>
      </View>

      <Text style={styles.section}>🪪 App Info</Text>
      <View style={styles.list}>
        <Text style={styles.item}>{`• App version: v${version}`}</Text>
        <Text style={styles.item}>{`• Build date: ${buildDate}`}</Text>
        <Text style={styles.item}>• License: MIT / Educational Project</Text>
      </View>

      <Text style={styles.section}>📄 Legal & Links</Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}><Text style={styles.link}>🔒 Privacy Policy</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}><Text style={styles.link}>📜 Terms of Service</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@smarttrip.app')}><Text style={styles.link}>📧 support@smarttrip.app</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/your-org/smarttrip')}><Text style={styles.link}>🌐 Project Website / GitHub</Text></TouchableOpacity>
      </View>

      <Text style={styles.section}>🧱 Future Enhancements</Text>
      <View style={styles.list}>
        <Text style={styles.item}>• Real-time pollution tracking</Text>
        <Text style={styles.item}>• AI-based route recommendations</Text>
        <Text style={styles.item}>• Deeper public transport integrations</Text>
      </View>

      <View style={styles.footerActions}>
        <Link href="/(tabs)/home" asChild>
          <TouchableOpacity style={styles.backBtn}><Text style={styles.backBtnText}>Back to Home</Text></TouchableOpacity>
        </Link>
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.backBtnSecondary}><Text style={styles.backBtnSecondaryText}>Go to Profile</Text></TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  body: { fontSize: 16, lineHeight: 22, color: '#111827' },
  list: { gap: 6, marginTop: 6 },
  item: { fontSize: 16, lineHeight: 22, color: '#111827' },
  links: { gap: 8, marginTop: 6 },
  link: { color: '#2563eb', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  backBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  backBtnSecondary: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  backBtnSecondaryText: { color: '#111827', fontWeight: '700' },
});
