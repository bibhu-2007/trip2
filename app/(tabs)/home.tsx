import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Link, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

type Trip = {
  id: string;
  from: string;
  to: string;
  mode: 'car' | 'bike' | 'train' | 'walk';
  time: string;
  co2SavedKg: number;
  status: 'Completed' | 'Planned';
};

const MODE_ICON: Record<Trip['mode'], string> = {
  car: '🚗',
  bike: '🚴‍♂️',
  train: '🚆',
  walk: '🚶‍♀️',
};

export default function HomeScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [name] = useState('Traveler');
  const [ecoScore] = useState(68);
  const [ecoLevel] = useState('Eco Explorer');
  const [totalTrips] = useState(24);
  const [totalCO2Saved] = useState(124.3);
  const [ecoPoints] = useState(820);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const recentTrips: Trip[] = useMemo(
    () => [
      { id: 't1', from: 'Home', to: 'Work', mode: 'train', time: 'Today 8:10 AM', co2SavedKg: 1.6, status: 'Completed' },
      { id: 't2', from: 'Work', to: 'Gym', mode: 'bike', time: 'Yesterday 6:20 PM', co2SavedKg: 0.4, status: 'Completed' },
      { id: 't3', from: 'Home', to: 'College', mode: 'car', time: 'Tomorrow 7:30 AM', co2SavedKg: 0.0, status: 'Planned' },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoadingLoc(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } finally {
        setLoadingLoc(false);
      }
    })();
  }, []);

  const leafletHtml = (lat: number, lng: number) => `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([${lat}, ${lng}]).addTo(map);
        </script>
      </body>
    </html>`;

  const openTrip = (trip: Trip) => router.push({ pathname: '/trip-result', params: { id: trip.id } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]}>
      {/* Header greeting & bell via tab headerRight; inline greeting here */}
      <Text style={styles.greet}>Hello, {name} 👋</Text>
      <Text style={styles.motivation}>You’ve saved 12.4 kg CO₂ this week!</Text>

      {/* Stats cards */}
      <View style={styles.row}>
        <View style={[styles.card, styles.cardThird]}>
          <Text style={styles.cardLabel}>Trips</Text>
          <Text style={styles.cardValue}>{totalTrips}</Text>
        </View>
        <View style={[styles.card, styles.cardThird]}>
          <Text style={styles.cardLabel}>CO₂ Saved</Text>
          <Text style={styles.cardValue}>{totalCO2Saved.toFixed(1)} kg</Text>
        </View>
        <View style={[styles.card, styles.cardThird]}>
          <Text style={styles.cardLabel}>EcoScore</Text>
          <Text style={styles.cardValue}>{ecoScore}</Text>
        </View>
      </View>

      {/* Plan a Trip */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan a Trip</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/planner')}>
          <Text style={styles.primaryBtnText}>Plan My Trip</Text>
        </TouchableOpacity>
        <View style={styles.chipsRow}>
          <TouchableOpacity style={styles.chip} onPress={() => router.push({ pathname: '/(tabs)/planner', params: { from: 'Home', to: 'Work' } })}>
            <Text style={styles.chipText}>Home → Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => router.push({ pathname: '/(tabs)/planner', params: { from: 'Work', to: 'College' } })}>
            <Text style={styles.chipText}>Work → College</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => router.push('/(tabs)/planner')}>
            <Text style={styles.chipText}>Custom Trip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Trips */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        <FlatList
          scrollEnabled={false}
          data={recentTrips}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openTrip(item)} style={styles.tripRow}>
              <Text style={styles.tripIcon}>{MODE_ICON[item.mode]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripTitle}>{item.to}</Text>
                <Text style={styles.tripMeta}>{item.time} • {item.status}</Text>
              </View>
              <Text style={styles.co2Saved}>-{item.co2SavedKg.toFixed(1)} kg</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* EcoScore Widget */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>EcoScore</Text>
        <Text style={styles.ecoLevel}>🌱 Level 3 – {ecoLevel}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, ecoScore)}%` }]} />
        </View>
        <Text style={styles.ecoStats}>Total saved: {totalCO2Saved.toFixed(1)} kg • ecoPoints: {ecoPoints}</Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.outlineBtnText}>View Rewards</Text>
        </TouchableOpacity>
      </View>

      {/* Carpool Highlights */}
      <View style={[styles.card, styles.banner]}>
        <Text style={styles.bannerText}>🚗 Join carpools near you!</Text>
        <Text style={styles.bannerSub}>3 carpools available within 2 km</Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push({ pathname: '/(tabs)/planner', params: { filter: 'carpool' } })}>
          <Text style={styles.outlineBtnText}>View all carpools</Text>
        </TouchableOpacity>
      </View>

      {/* Carbon Savings Tips */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Carbon Savings Tips</Text>
        <Text style={styles.tipText}>Try cycling for short distances!</Text>
        <Link href="/docs/sustainability-tips" asChild>
          <TouchableOpacity style={styles.outlineBtn}><Text style={styles.outlineBtnText}>Learn more</Text></TouchableOpacity>
        </Link>
      </View>

      {/* Map Preview */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Map Preview</Text>
        <View style={styles.mapPreview}>
          {coords && !loadingLoc ? (
            <WebView originWhitelist={["*"]} style={{ flex: 1 }} source={{ html: leafletHtml(coords.latitude, coords.longitude) }} />
          ) : (
            <View style={[styles.mapPreview, styles.mapPlaceholder]} />
          )}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/planner')}>
          <Text style={styles.primaryBtnText}>Start a trip from here</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7faf9' },
  content: { padding: 16, gap: 12 },
  greet: { fontSize: 22, fontWeight: '700' },
  motivation: { color: '#25634b', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardThird: { flex: 1 },
  cardLabel: { color: '#6b7280', fontSize: 12 },
  cardValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#1f9d74', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { backgroundColor: '#eef6f3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  chipText: { color: '#25634b', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  tripRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  tripIcon: { fontSize: 20, marginRight: 12 },
  tripTitle: { fontSize: 15, fontWeight: '600' },
  tripMeta: { color: '#6b7280', marginTop: 2 },
  co2Saved: { color: '#1f9d74', fontWeight: '700', marginLeft: 8 },
  ecoLevel: { marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#eef2f7', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1f9d74' },
  ecoStats: { color: '#6b7280', marginTop: 8, marginBottom: 8 },
  outlineBtn: { borderColor: '#1f9d74', borderWidth: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  outlineBtnText: { color: '#1f9d74', fontWeight: '700' },
  banner: { backgroundColor: '#e9fbf2', borderColor: '#b5eed5', borderWidth: 1 },
  bannerText: { fontWeight: '700' },
  bannerSub: { color: '#25634b', marginTop: 4 },
  tipText: { color: '#374151' },
  mapPreview: { height: 160, borderRadius: 12, overflow: 'hidden' },
  mapPlaceholder: { backgroundColor: '#f1f5f9' },
});
