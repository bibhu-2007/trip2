import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';

type Mode = 'Walk' | 'Cycle' | 'Transit' | 'Car' | 'Carpool';
type Trip = { id: string; origin: string; destination: string; mode: Mode; durationMin: number; distanceKm: number; cost: number; co2Saved: number; timestamp: string; favorite?: boolean };
type Filter = 'All' | Mode;
type SortKey = 'Recent' | 'CO2' | 'Duration';

export default function MyTripsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('Recent');

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('myTrips');
        if (raw) setTrips(JSON.parse(raw)); else setTrips(seedTrips);
      } catch { setTrips(seedTrips); }
    })();
  }, []);

  const saveTrips = async (list: Trip[]) => {
    setTrips(list);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('myTrips', JSON.stringify(list));
    } catch {}
  };

  const filtered = useMemo(() => trips.filter(t => filter === 'All' ? true : t.mode === filter), [trips, filter]);
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortKey === 'Recent') return copy.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    if (sortKey === 'CO2') return copy.sort((a, b) => b.co2Saved - a.co2Saved);
    return copy.sort((a, b) => a.durationMin - b.durationMin);
  }, [filtered, sortKey]);

  const totalTrips = trips.length;
  const totalCO2 = trips.reduce((s, t) => s + t.co2Saved, 0);
  const mostUsed = useMemo(() => {
    const counts: Record<Mode, number> = { Walk: 0, Cycle: 0, Transit: 0, Car: 0, Carpool: 0 };
    trips.forEach(t => counts[t.mode]++);
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['Walk', 0])[0] as Mode;
  }, [trips]);
  const avgDuration = totalTrips ? Math.round(trips.reduce((s, t) => s + t.durationMin, 0) / totalTrips) : 0;

  const planAgain = (t: Trip) => {
    router.push({ pathname: '/(tabs)/planner', params: { from: t.origin, to: t.destination } });
  };

  const toggleFav = async (id: string) => {
    const next = trips.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t);
    await saveTrips(next);
  };

  const deleteTrip = async (id: string) => {
    Alert.alert('Delete trip?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await saveTrips(trips.filter(t => t.id !== id)); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 16 }]}>
      <Text style={styles.title}>My Trips</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLine}>🧭 Trips: <Text style={styles.bold}>{totalTrips}</Text></Text>
        <Text style={styles.summaryLine}>🌱 CO₂ Saved: <Text style={styles.bold}>{totalCO2.toFixed(1)} kg</Text></Text>
        <Text style={styles.summaryLine}>🚴 Most Used: <Text style={styles.bold}>{mostUsed}</Text></Text>
        <Text style={styles.summaryLine}>⏱ Avg Duration: <Text style={styles.bold}>{avgDuration} min</Text></Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.rowWrap}>
          {(['All','Walk','Cycle','Transit','Car','Carpool'] as Filter[]).map(f => (
            <TouchableOpacity key={f} style={[styles.pill, filter === f && styles.pillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.rowWrap}>
          {(['Recent','CO2','Duration'] as SortKey[]).map(s => (
            <TouchableOpacity key={s} style={[styles.pill, sortKey === s && styles.pillActive]} onPress={() => setSortKey(s)}>
              <Text style={[styles.pillText, sortKey === s && styles.pillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.card}><Text style={styles.muted}>No trips yet.</Text></View>
      ) : (
        sorted.map(t => (
          <View key={t.id} style={styles.tripCard}>
            <Text style={styles.tripTitle}>{iconFor(t.mode)} {t.mode} Trip</Text>
            <Text style={styles.tripRoute}>{t.origin} → {t.destination}</Text>
            <Text style={styles.tripMeta}>⏱ {t.durationMin} min  •  🌱 {t.co2Saved.toFixed(1)} kg  •  📅 {formatDate(t.timestamp)}</Text>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => planAgain(t)}><Text style={styles.secondaryBtnText}>Plan Again</Text></TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => toggleFav(t.id)}><Text style={styles.outlineBtnText}>{t.favorite ? '★ Favorite' : '☆ Favorite'}</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.dangerBtn} onPress={() => deleteTrip(t.id)}><Text style={styles.dangerBtnText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const iconFor = (m: Mode) => (m === 'Walk' ? '🚶' : m === 'Cycle' ? '🚲' : m === 'Transit' ? '🚌' : m === 'Carpool' ? '🚘' : '🚗');
const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const seedTrips: Trip[] = [
  { id: 't1', origin: 'Bhubaneswar', destination: 'Cuttack', mode: 'Cycle', durationMin: 25, distanceKm: 8, cost: 0, co2Saved: 2.4, timestamp: new Date().toISOString(), favorite: true },
  { id: 't2', origin: 'Home', destination: 'College', mode: 'Transit', durationMin: 35, distanceKm: 12, cost: 10, co2Saved: 0.8, timestamp: new Date(Date.now()-86400000).toISOString() },
  { id: 't3', origin: 'Hostel', destination: 'Railway Station', mode: 'Walk', durationMin: 15, distanceKm: 1.2, cost: 0, co2Saved: 0.1, timestamp: new Date(Date.now()-2*86400000).toISOString() },
];

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  summaryCard: { backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: '#bae6fd' },
  summaryLine: { fontSize: 16, color: '#075985' },
  bold: { fontWeight: '800' },
  controls: { gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: '#f9fafb' },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { color: '#111827', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  tripCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  tripTitle: { fontSize: 16, fontWeight: '800' },
  tripRoute: { color: '#111827' },
  tripMeta: { color: '#6b7280' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secondaryBtn: { backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  secondaryBtnText: { color: '#111827', fontWeight: '700' },
  outlineBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db' },
  outlineBtnText: { color: '#111827', fontWeight: '700' },
  dangerBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  dangerBtnText: { color: '#fff', fontWeight: '700' },
  muted: { color: '#6b7280' },
});
