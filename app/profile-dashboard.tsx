import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

export default function ProfileDashboard() {
  const [profile, setProfile] = useState<{ name?: string; username?: string; email?: string; location?: string; currentLocation?: string; permanentLocation?: string; avatarUri?: string }>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('profileData');
        if (raw) setProfile(JSON.parse(raw));
        const rt = await AsyncStorage.getItem('recentTrips');
        if (rt) setRecent(JSON.parse(rt));
      } catch {}
    })();
  }, []);

  const filled = useMemo(() => {
    const fields = ['name','username','email','location','currentLocation','permanentLocation','avatarUri'] as const;
    const total = fields.length;
    const done = fields.reduce((n, k) => n + (profile[k] ? 1 : 0), 0);
    return { total, done, percent: Math.round((done / total) * 100) };
  }, [profile]);

  const trips = recent.length;
  const saved = recent.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Image source={{ uri: profile.avatarUri || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name || 'Traveler'}</Text>
            <Text style={styles.email}>{profile.email || 'you@example.com'}</Text>
          </View>
          <View style={styles.ring}>
            <Text style={styles.ringText}>{filled.percent}%</Text>
            <Text style={styles.ringSub}>Complete</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Profile</Text>
          <Text style={styles.item}>Name: <Text style={styles.itemValue}>{profile.name || '-'}</Text></Text>
          <Text style={styles.item}>Username: <Text style={styles.itemValue}>{profile.username || '-'}</Text></Text>
          <Text style={styles.item}>Email: <Text style={styles.itemValue}>{profile.email || '-'}</Text></Text>
          <Text style={styles.item}>Location: <Text style={styles.itemValue}>{profile.location || '-'}</Text></Text>
          <Text style={styles.item}>Current: <Text style={styles.itemValue}>{profile.currentLocation || '-'}</Text></Text>
          <Text style={styles.item}>Permanent: <Text style={styles.itemValue}>{profile.permanentLocation || '-'}</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Activities</Text>
          <Text style={styles.muted}>• Planned trips, saved routes, and recent actions will appear here.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Reminders</Text>
          <Text style={styles.muted}>• Set reminders for commute times or trip departures.</Text>
          <TouchableOpacity style={styles.outlineBtn}><Text style={styles.outlineBtnText}>Add Reminder</Text></TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => {
            Alert.alert(
              'Remove this account?',
              'This will clear your profile and recent trips on this device.',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                      await AsyncStorage.removeItem('profileData');
                      await AsyncStorage.removeItem('recentTrips');
                    } catch {}
                    router.replace('/(tabs)/profile');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.dangerBtnText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 16, gap: 12 },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e5e7eb' },
  name: { fontSize: 18, fontWeight: '800', color: '#111827' },
  email: { color: '#6b7280' },
  ring: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  ringSub: { fontSize: 10, color: '#6b7280' },
  cardRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111827' },
  statLabel: { color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  section: { fontSize: 16, fontWeight: '800', color: '#111827' },
  item: { color: '#111827' },
  itemValue: { fontWeight: '700' },
  muted: { color: '#6b7280' },
  outlineBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignSelf: 'flex-start' },
  outlineBtnText: { color: '#111827', fontWeight: '700' },
  dangerBtn: { marginTop: 8, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  dangerBtnText: { color: '#ffffff', fontWeight: '800' },
});
