import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recenter = () => {
    if (!coords || !mapRef.current) return;
    const region = { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    mapRef.current.animateToRegion(region as any, 500);
  };

  return (
    <View style={styles.container}>
      {coords ? (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            mapType={mapType}
            showsUserLocation
            initialRegion={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          >
            <Marker coordinate={coords} title="You are here" />
          </MapView>
          <View style={styles.fabGroup}>
            <TouchableOpacity style={styles.fab} onPress={recenter}><Text style={styles.fabText}>Locate</Text></TouchableOpacity>
            <TouchableOpacity style={styles.fab} onPress={() => setMapType((t: 'standard' | 'hybrid') => (t === 'standard' ? 'hybrid' : 'standard'))}><Text style={styles.fabText}>Map</Text></TouchableOpacity>
          </View>
        </>
      ) : (
        <ActivityIndicator style={{ flex: 1 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fabGroup: { position: 'absolute', right: 16, bottom: 24, gap: 8 },
  fab: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, opacity: 0.9 },
  fabText: { color: '#fff', fontWeight: '700' },
});
