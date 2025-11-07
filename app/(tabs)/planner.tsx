import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, TextInput, Share } from 'react-native';
import * as Linking from 'expo-linking';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import MapView, { Marker, Polyline } from 'react-native-maps';

type Mode = 'Walk' | 'Cycle' | 'Transit' | 'Car' | 'Carpool';
type Prefs = { fastest: boolean; lowestCarbon: boolean; cheapest: boolean; avoidTraffic: boolean };
type Result = { mode: Mode; durationMin: number; co2Kg: number; cost: number; ecoSavedKg?: number };
type SavedTrip = { from: string; to: string; mode: Mode; durationMin: number; co2Kg: number; cost: number; date: string };

export default function TripPlannerScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState<Mode>('Walk');
  const [prefs, setPrefs] = useState<Prefs>({ fastest: true, lowestCarbon: false, cheapest: false, avoidTraffic: false });
  const [results, setResults] = useState<Result[]>([]);
  const [recent, setRecent] = useState<SavedTrip[]>([]);
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [usePlainFrom, setUsePlainFrom] = useState(false);
  const [usePlainTo, setUsePlainTo] = useState(false);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [distKm, setDistKm] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  const [qtpDest, setQtpDest] = useState('');
  const [qtpDestCoords, setQtpDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [qtpLoading, setQtpLoading] = useState(false);
  const [qtpResult, setQtpResult] = useState<{ mode: Mode; price: number; durationMin: number; distKm: number } | null>(null);
  const [qtpNearby, setQtpNearby] = useState<Array<{ name: string; lat: number; lng: number; vicinity?: string }>>([]);
  const [qtpNearbyLoading, setQtpNearbyLoading] = useState(false);

  const mockDB: Record<string, { distKm: number; nearby: Array<{ name: string; lat: number; lng: number; vicinity?: string }> }> = {
    paris: { distKm: 8.5, nearby: [
      { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
      { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376 },
      { name: 'Notre-Dame', lat: 48.8530, lng: 2.3499 },
    ] },
    delhi: { distKm: 12.2, nearby: [
      { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
      { name: 'Qutub Minar', lat: 28.5245, lng: 77.1855 },
      { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
    ] },
    london: { distKm: 9.1, nearby: [
      { name: 'Big Ben', lat: 51.5007, lng: -0.1246 },
      { name: 'London Eye', lat: 51.5033, lng: -0.1196 },
      { name: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
    ] },
    mumbai: { distKm: 10.4, nearby: [
      { name: 'Gateway of India', lat: 18.9220, lng: 72.8347 },
      { name: 'Marine Drive', lat: 18.9432, lng: 72.8238 },
      { name: 'Elephanta Caves', lat: 18.9633, lng: 72.9316 },
    ] },
    goa: { distKm: 6.8, nearby: [
      { name: 'Baga Beach', lat: 15.5529, lng: 73.7517 },
      { name: 'Calangute Beach', lat: 15.5449, lng: 73.7553 },
      { name: 'Fort Aguada', lat: 15.4920, lng: 73.7733 },
    ] },
  };

  const getMock = (dest: string) => {
    const key = (dest || '').toLowerCase();
    const hit = Object.keys(mockDB).find(k => key.includes(k));
    if (hit) return mockDB[hit];
    return { distKm: 5.0, nearby: [] };
  };

  useEffect(() => {
    if (params.from || params.to) {
      if (typeof params.from === 'string') setFrom(params.from);
      if (typeof params.to === 'string') setTo(params.to);
    }
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('recentTrips');
        if (raw) setRecent(JSON.parse(raw));
      } catch {}
    })();
  }, [params.from, params.to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        setQtpNearbyLoading(true);
        if (apiKey && qtpDestCoords) {
          const { latitude, longitude } = qtpDestCoords;
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&keyword=attractions&key=${apiKey}`;
          const { data } = await axios.get(url);
          const items = (data?.results || []).slice(0, 12).map((r: any) => ({
            name: r.name,
            lat: r.geometry?.location?.lat,
            lng: r.geometry?.location?.lng,
            vicinity: r.vicinity,
          })).filter((r: any) => r.lat && r.lng);
          setQtpNearby(items);
        } else if (qtpDest) {
          const mock = getMock(qtpDest);
          setQtpNearby(mock.nearby);
        } else {
          setQtpNearby([]);
        }
      } catch {
        const mock = qtpDest ? getMock(qtpDest) : { nearby: [] } as any;
        setQtpNearby(mock.nearby || []);
      } finally {
        setQtpNearbyLoading(false);
      }
    };
    fetchNearby();
  }, [qtpDestCoords, apiKey, qtpDest]);

  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Enable location to use current position.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    setFrom(coords);
    setOriginCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
  };

  const planTrip = async () => {
    if (!originCoords || !destCoords) {
      Alert.alert('Enter locations', 'Please select valid From and To.');
      return;
    }
    setLoading(true);
    try {
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;
      const gMode = mode === 'Walk' ? 'walking' : mode === 'Cycle' ? 'bicycling' : mode === 'Transit' ? 'transit' : 'driving';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.latitude},${originCoords.longitude}&destination=${destCoords.latitude},${destCoords.longitude}&mode=${gMode}&key=${key}`;
      const { data } = await axios.get(url);
      const route = data?.routes?.[0];
      const overview = route?.overview_polyline?.points;
      if (overview) {
        const decoded = polyline.decode(overview).map(([lat, lng]: [number, number]) => ({ latitude: lat, longitude: lng }));
        setRouteCoords(decoded);
      } else {
        setRouteCoords([]);
      }
      const leg = route?.legs?.[0];
      const durMin = Math.round((leg?.duration?.value ?? 0) / 60);
      const dKm = (leg?.distance?.value ?? 0) / 1000;
      setDistKm(dKm);
      const calc: Result[] = [
        { mode: 'Walk', durationMin: Math.max(1, Math.round(dKm * 12)), co2Kg: 0, cost: 0 },
        { mode: 'Cycle', durationMin: Math.max(1, Math.round(dKm * 6)), co2Kg: 0.0, cost: 0 },
        { mode: 'Transit', durationMin: durMin || Math.round(dKm * 4), co2Kg: Math.max(0.05, dKm * 0.05), cost: Math.round(Math.max(10, dKm * 2)) },
        { mode: 'Car', durationMin: durMin || Math.round(dKm * 3.5), co2Kg: Math.max(0.2, dKm * 0.2), cost: Math.round(Math.max(10, dKm * 6)) },
        { mode: 'Carpool', durationMin: durMin || Math.round(dKm * 3.2), co2Kg: Math.max(0.1, dKm * 0.1), cost: Math.round(Math.max(10, dKm * 3)), ecoSavedKg: Math.max(0.1, dKm * 0.1) },
      ];
      let list = calc;
      if (prefs.fastest) list = [...list].sort((a, b) => a.durationMin - b.durationMin);
      if (prefs.lowestCarbon) list = [...list].sort((a, b) => a.co2Kg - b.co2Kg);
      if (prefs.cheapest) list = [...list].sort((a, b) => a.cost - b.cost);
      setResults(list);
      setStep(3);
    } catch (e) {
      Alert.alert('Routing failed', 'Check API key and network.');
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async (r: Result) => {
    const tr: SavedTrip = { from, to, mode: r.mode, durationMin: r.durationMin, co2Kg: r.co2Kg, cost: r.cost, date: new Date().toISOString() };
    const updated = [tr, ...recent].slice(0, 5);
    setRecent(updated);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('recentTrips', JSON.stringify(updated));
      Alert.alert('Saved', 'Trip saved.');
    } catch {}
  };

  const modes: Mode[] = useMemo(() => ['Walk', 'Cycle', 'Transit', 'Car', 'Carpool'], []);
  const iconFor = (m: Mode) => (m === 'Walk' ? '🚶' : m === 'Cycle' ? '🚲' : m === 'Transit' ? '🚌' : m === 'Carpool' ? '🚘' : '🚗');
  const ecoScore = (r: Result) => {
    const maxCost = Math.max(...results.map(x => x.cost), r.cost || 1);
    const maxDur = Math.max(...results.map(x => x.durationMin), r.durationMin || 1);
    const normCo2 = Math.min(1, r.co2Kg / Math.max(0.001, Math.max(...results.map(x => x.co2Kg), r.co2Kg)));
    const normCost = Math.min(1, r.cost / Math.max(1, maxCost));
    const normDur = Math.min(1, r.durationMin / Math.max(1, maxDur));
    const score = 100 - (normCo2 * 60 + normCost * 20 + normDur * 20);
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  const recommend = useMemo(() => {
    if (!results.length) return null as any;
    const fastest = [...results].sort((a,b)=>a.durationMin-b.durationMin)[0];
    const cheapest = [...results].sort((a,b)=>a.cost-b.cost)[0];
    const best = [...results].sort((a,b)=>ecoScore(b)-ecoScore(a))[0];
    return { fastest, cheapest, best };
  }, [results]);
  const shareTrip = async (r: Result) => {
    const s = `${iconFor(r.mode)} ${r.mode}\nDistance: ${distKm.toFixed(1)} km\nDuration: ${r.durationMin} min\nCO₂: ${r.co2Kg.toFixed(1)} kg\nCost: ${r.cost === 0 ? 'Free' : `₹${r.cost}`}\nEcoScore: ${ecoScore(r)}/100`;
    try { await Share.share({ message: s }); } catch {}
  };

  const quickPlan = async () => {
    try {
      if (!qtpDest) {
        Alert.alert('No destination', 'There is no entered destination for Quick Plan.');
        return;
      }
      setQtpLoading(true);
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

      if (!key || !qtpDestCoords) {
        const mock = getMock(qtpDest);
        const dKm = mock.distKm;
        const dMin = Math.round(dKm * 3.5);
        const options: { mode: Mode; price: number; durationMin: number }[] = [
          { mode: 'Walk', price: 0, durationMin: Math.max(1, Math.round(dKm * 12)) },
          { mode: 'Cycle', price: 0, durationMin: Math.max(1, Math.round(dKm * 6)) },
          { mode: 'Transit', price: Math.round(Math.max(10, dKm * 2)), durationMin: dMin || Math.round(dKm * 4) },
          { mode: 'Carpool', price: Math.round(Math.max(10, dKm * 3)), durationMin: dMin || Math.round(dKm * 3.2) },
          { mode: 'Car', price: Math.round(Math.max(10, dKm * 6)), durationMin: dMin || Math.round(dKm * 3.5) },
        ];
        const cheapest = [...options].sort((a,b)=>a.price-b.price)[0];
        setQtpResult({ mode: cheapest.mode, price: cheapest.price, durationMin: cheapest.durationMin, distKm: dKm });
        const nearby = getMock(qtpDest).nearby;
        if (nearby.length) setQtpNearby(nearby);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const mock = getMock(qtpDest);
        const dKm = mock.distKm;
        const dMin = Math.round(dKm * 3.5);
        const options: { mode: Mode; price: number; durationMin: number }[] = [
          { mode: 'Walk', price: 0, durationMin: Math.max(1, Math.round(dKm * 12)) },
          { mode: 'Cycle', price: 0, durationMin: Math.max(1, Math.round(dKm * 6)) },
          { mode: 'Transit', price: Math.round(Math.max(10, dKm * 2)), durationMin: dMin || Math.round(dKm * 4) },
          { mode: 'Carpool', price: Math.round(Math.max(10, dKm * 3)), durationMin: dMin || Math.round(dKm * 3.2) },
          { mode: 'Car', price: Math.round(Math.max(10, dKm * 6)), durationMin: dMin || Math.round(dKm * 3.5) },
        ];
        const cheapest = [...options].sort((a,b)=>a.price-b.price)[0];
        setQtpResult({ mode: cheapest.mode, price: cheapest.price, durationMin: cheapest.durationMin, distKm: dKm });
        const nearby = getMock(qtpDest).nearby;
        if (nearby.length) setQtpNearby(nearby);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const oLat = pos.coords.latitude, oLng = pos.coords.longitude;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${qtpDestCoords.latitude},${qtpDestCoords.longitude}&mode=driving&key=${key}`;
      const { data } = await axios.get(url);
      const leg = data?.routes?.[0]?.legs?.[0];
      const dKm = (leg?.distance?.value ?? 0) / 1000;
      const dMin = Math.round((leg?.duration?.value ?? 0) / 60);
      const options: { mode: Mode; price: number; durationMin: number }[] = [
        { mode: 'Walk', price: 0, durationMin: Math.max(1, Math.round(dKm * 12)) },
        { mode: 'Cycle', price: 0, durationMin: Math.max(1, Math.round(dKm * 6)) },
        { mode: 'Transit', price: Math.round(Math.max(10, dKm * 2)), durationMin: dMin || Math.round(dKm * 4) },
        { mode: 'Carpool', price: Math.round(Math.max(10, dKm * 3)), durationMin: dMin || Math.round(dKm * 3.2) },
        { mode: 'Car', price: Math.round(Math.max(10, dKm * 6)), durationMin: dMin || Math.round(dKm * 3.5) },
      ];
      const cheapest = [...options].sort((a,b)=>a.price-b.price)[0];
      setQtpResult({ mode: cheapest.mode, price: cheapest.price, durationMin: cheapest.durationMin, distKm: dKm });
    } catch (e) {
      const mock = qtpDest ? getMock(qtpDest) : { distKm: 5 } as any;
      const dKm = mock.distKm || 5;
      const dMin = Math.round(dKm * 3.5);
      const options: { mode: Mode; price: number; durationMin: number }[] = [
        { mode: 'Walk', price: 0, durationMin: Math.max(1, Math.round(dKm * 12)) },
        { mode: 'Cycle', price: 0, durationMin: Math.max(1, Math.round(dKm * 6)) },
        { mode: 'Transit', price: Math.round(Math.max(10, dKm * 2)), durationMin: dMin || Math.round(dKm * 4) },
        { mode: 'Carpool', price: Math.round(Math.max(10, dKm * 3)), durationMin: dMin || Math.round(dKm * 3.2) },
        { mode: 'Car', price: Math.round(Math.max(10, dKm * 6)), durationMin: dMin || Math.round(dKm * 3.5) },
      ];
      const cheapest = [...options].sort((a,b)=>a.price-b.price)[0];
      setQtpResult({ mode: cheapest.mode, price: cheapest.price, durationMin: cheapest.durationMin, distKm: dKm });
    } finally {
      setQtpLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 16 }]}>
      <Text style={styles.title}>Plan Trip</Text>
      <TouchableOpacity
        style={[styles.primaryBtn, { alignSelf: 'flex-start', marginTop: 6 }]}
        onPress={() => Linking.openURL('https://www.redbus.in/')}
      >
        <Text style={styles.primaryBtnText}>Buy Ticket</Text>
      </TouchableOpacity>

      {/* Quick Trip Planner (QTP) */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>QTP</Text>
          {qtpResult && <Text style={styles.badge}>{qtpResult.mode} • {qtpResult.durationMin}m</Text>}
        </View>
        {apiKey ? (
          <GooglePlacesAutocomplete
            placeholder="Where to?"
            fetchDetails
            onPress={(data, details: any) => {
              const loc = details?.geometry?.location;
              if (loc) {
                setQtpDest(data.description || `${loc.lat}, ${loc.lng}`);
                setQtpDestCoords({ latitude: loc.lat, longitude: loc.lng });
              }
            }}
            query={{ key: apiKey, language: 'en' }}
            enablePoweredByContainer={false}
            textInputProps={{ value: qtpDest, onChangeText: setQtpDest }}
            styles={{ textInput: styles.input as any, listView: { zIndex: 20 } }}
          />
        ) : (
          <TextInput style={styles.input} placeholder="Where to?" value={qtpDest} onChangeText={setQtpDest} />
        )}
        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.outlineBtn} onPress={quickPlan} disabled={qtpLoading}>
            <Text style={styles.outlineBtnText}>{qtpLoading ? 'Checking…' : 'Quick Plan'}</Text>
          </TouchableOpacity>
          {qtpResult && (
            <Text style={styles.resultLine}>Affordable price: {qtpResult.price === 0 ? 'Free' : `₹${qtpResult.price}`} • {qtpResult.distKm.toFixed(1)} km</Text>
          )}
        </View>
        {qtpResult && (
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setMode(qtpResult.mode);
                setStep(2);
                if (qtpDest && qtpDestCoords) {
                  setTo(qtpDest);
                  setDestCoords(qtpDestCoords);
                }
              }}
            >
              <Text style={styles.secondaryBtnText}>Use in Planner</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby visiting areas for destination */}
        {((apiKey && qtpDestCoords) || (!apiKey && qtpDest)) && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Nearby visiting areas</Text>
            {qtpNearbyLoading ? (
              <Text style={styles.muted}>Loading nearby…</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {qtpNearby.map((p, idx) => (
                  <TouchableOpacity
                    key={`${p.name}-${idx}`}
                    style={styles.chip}
                    onPress={() => {
                      setQtpDest(p.name + (p.vicinity ? `, ${p.vicinity}` : ''));
                      setQtpDestCoords({ latitude: p.lat, longitude: p.lng });
                    }}
                  >
                    <Text style={styles.chipText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
                {qtpNearby.length === 0 && <Text style={styles.muted}>No popular spots found nearby.</Text>}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.section}>How would you like to travel?</Text>
          <View style={styles.modesWrap}>
            {modes.map(m => (
              <TouchableOpacity key={m} style={[styles.modeCard, mode === m && styles.modeCardActive]} onPress={() => { setMode(m); setStep(2); }}>
                <Text style={[styles.modeCardText, mode === m && styles.modeCardTextActive]}>{iconFor(m)} {m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowCompare(s => !s)}><Text style={styles.outlineBtnText}>Compare All Modes</Text></TouchableOpacity>
        </View>
      )}

      {step >= 2 && (
      <View style={styles.card}>
        <Text style={styles.label}>From</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            {apiKey && !usePlainFrom ? (
              <GooglePlacesAutocomplete
                placeholder="Start location"
                fetchDetails
                onPress={(data, details: any) => {
                  const loc = details?.geometry?.location;
                  if (loc) {
                    setFrom(data.description || `${loc.lat}, ${loc.lng}`);
                    setOriginCoords({ latitude: loc.lat, longitude: loc.lng });
                  }
                }}
                onFail={() => setUsePlainFrom(true)}
                onNotFound={() => setUsePlainFrom(true)}
                query={{ key: apiKey, language: 'en' }}
                enablePoweredByContainer={false}
                textInputProps={{ value: from, onChangeText: setFrom }}
                styles={{ textInput: styles.input as any, listView: { zIndex: 10 } }}
              />
            ) : (
              <TextInput style={styles.input} placeholder="Start location" value={from} onChangeText={setFrom} />
            )}
          </View>
          <TouchableOpacity style={styles.smallBtn} onPress={useCurrentLocation}><Text style={styles.smallBtnText}>📡</Text></TouchableOpacity>
        </View>

        <Text style={styles.label}>To</Text>
        {apiKey && !usePlainTo ? (
          <GooglePlacesAutocomplete
            placeholder="Destination"
            fetchDetails
            onPress={(data, details: any) => {
              const loc = details?.geometry?.location;
              if (loc) {
                setTo(data.description || `${loc.lat}, ${loc.lng}`);
                setDestCoords({ latitude: loc.lat, longitude: loc.lng });
              }
            }}
            onFail={() => setUsePlainTo(true)}
            onNotFound={() => setUsePlainTo(true)}
            query={{ key: apiKey, language: 'en' }}
            enablePoweredByContainer={false}
            textInputProps={{ value: to, onChangeText: setTo }}
            styles={{ textInput: styles.input as any, listView: { zIndex: 9 } }}
          />
        ) : (
          <TextInput style={styles.input} placeholder="Destination" value={to} onChangeText={setTo} />
        )}

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.outlineBtn} onPress={swap}><Text style={styles.outlineBtnText}>Swap 🔁</Text></TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={async ()=>{ await planTrip(); }} disabled={loading}><Text style={styles.primaryBtnText}>{loading ? 'Planning...' : 'Plan Trip'}</Text></TouchableOpacity>
        </View>
      </View>
      )}

      {step >= 2 && (
        <>
          <Text style={styles.section}>Modes</Text>
          <View style={styles.modesWrap}>
            {modes.map(m => (
              <TouchableOpacity key={m} style={[styles.pill, mode === m && styles.pillActive]} onPress={() => setMode(m)}>
                <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>
                  {iconFor(m)} {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step >= 2 && (
        <View style={styles.card}>
          <Text style={styles.section}>Preferences</Text>
          <View style={styles.rowBetween}><Text style={styles.itemTitle}>Fastest Route</Text><Switch value={prefs.fastest} onValueChange={v => setPrefs(p => ({ ...p, fastest: v }))} /></View>
          <View style={styles.rowBetween}><Text style={styles.itemTitle}>Lowest Carbon Emission</Text><Switch value={prefs.lowestCarbon} onValueChange={v => setPrefs(p => ({ ...p, lowestCarbon: v }))} /></View>
          <View style={styles.rowBetween}><Text style={styles.itemTitle}>Cheapest Cost</Text><Switch value={prefs.cheapest} onValueChange={v => setPrefs(p => ({ ...p, cheapest: v }))} /></View>
          <View style={styles.rowBetween}><Text style={styles.itemTitle}>Avoid Traffic</Text><Switch value={prefs.avoidTraffic} onValueChange={v => setPrefs(p => ({ ...p, avoidTraffic: v }))} /></View>
        </View>
      )}

      {results.length > 0 && step === 3 && (
        <>
          <Text style={styles.section}>Results</Text>
          {results.map((r) => (
            <View key={r.mode} style={styles.resultCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.resultTitle}>
                  {iconFor(r.mode)} {r.mode}
                </Text>
                <Text style={styles.badge}>{r.durationMin} min</Text>
              </View>
              <Text style={styles.resultLine}>Distance: {distKm.toFixed(1)} km</Text>
              <Text style={styles.resultLine}>CO₂: {r.co2Kg.toFixed(1)} kg{r.ecoSavedKg ? ` • Saved ${r.ecoSavedKg.toFixed(1)} kg` : ''}</Text>
              <Text style={styles.resultLine}>Cost: {r.cost === 0 ? 'Free' : `₹${r.cost}`}</Text>
              <Text style={styles.resultLine}>EcoScore: {ecoScore(r)}/100</Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.min(100, (r.cost / Math.max(1, Math.max(...results.map(x=>x.cost)))))*100}%`, backgroundColor: '#fbbf24' }]} /></View>
                <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.min(100, (r.durationMin / Math.max(1, Math.max(...results.map(x=>x.durationMin)))))*100}%`, backgroundColor: '#60a5fa' }]} /></View>
                <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.min(100, (r.co2Kg / Math.max(0.001, Math.max(...results.map(x=>x.co2Kg)))))*100}%`, backgroundColor: '#34d399' }]} /></View>
              </View>
              <View style={styles.rowBetween}>
                <TouchableOpacity style={styles.outlineBtn}><Text style={styles.outlineBtnText}>Map View</Text></TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => shareTrip(r)}><Text style={styles.secondaryBtnText}>Share</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => saveTrip(r)}><Text style={styles.primaryBtnText}>Save Trip</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {recommend && (
            <View style={styles.card}>
              <Text style={styles.section}>Recommendations</Text>
              <Text style={styles.resultLine}>Best: {iconFor(recommend.best.mode)} {recommend.best.mode} • EcoScore {ecoScore(recommend.best)}/100</Text>
              <Text style={styles.resultLine}>Fastest: {iconFor(recommend.fastest.mode)} {recommend.fastest.mode} • {recommend.fastest.durationMin} min</Text>
              <Text style={styles.resultLine}>Cheapest: {iconFor(recommend.cheapest.mode)} {recommend.cheapest.mode} • {recommend.cheapest.cost === 0 ? 'Free' : `₹${recommend.cheapest.cost}`}</Text>
              <View style={styles.rowBetween}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setStep(2)}><Text style={styles.outlineBtnText}>Recalculate</Text></TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowCompare(s=>!s)}><Text style={styles.outlineBtnText}>Compare All Modes</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {showCompare && (
            <View style={styles.card}>
              <Text style={styles.section}>All Modes</Text>
              {['Walk','Cycle','Transit','Carpool','Car'].map((name)=>{
                const r = results.find(x=>x.mode===name as Mode) || results[0];
                return (
                  <View key={name} style={{ marginVertical: 6 }}>
                    <Text style={styles.itemTitle}>{iconFor(r.mode)} {r.mode} • {r.durationMin} min • {r.cost===0?'Free':`₹${r.cost}`} • {r.co2Kg.toFixed(1)} kg CO₂</Text>
                    <View style={styles.barTrack}><View style={[styles.barFill,{ width: `${Math.min(100, (r.co2Kg / Math.max(0.001, Math.max(...results.map(x=>x.co2Kg)))))*100}%`, backgroundColor: '#34d399' }]} /></View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {routeCoords.length > 0 && originCoords && destCoords && (
        <View style={styles.mapCard}>
          <MapView
            style={{ height: 240 }}
            initialRegion={{
              latitude: originCoords.latitude,
              longitude: originCoords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={originCoords} />
            <Marker coordinate={destCoords} />
            <Polyline coordinates={routeCoords} strokeColor="#2563eb" strokeWidth={4} />
          </MapView>
        </View>
      )}

      {recent.length > 0 && (
        <>
          <Text style={styles.section}>Recent Trips</Text>
          <View style={styles.card}>
            {recent.map((t, i) => (
              <View key={i} style={styles.rowBetween}>
                <Text style={styles.muted}>{t.from} → {t.to} ({t.mode})</Text>
                <Text style={styles.muted}>{t.durationMin}m • {t.co2Kg.toFixed(1)}kg</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  label: { fontSize: 14, color: '#374151', marginBottom: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: '#f9fafb' },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { color: '#111827', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  modeCard: { flexBasis: '48%', borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 20, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center' },
  modeCardActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeCardText: { color: '#111827', fontWeight: '800' },
  modeCardTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  secondaryBtnText: { color: '#111827', fontWeight: '700' },
  outlineBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db' },
  outlineBtnText: { color: '#111827', fontWeight: '700' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#f3f4f6' },
  smallBtnText: { fontSize: 16 },
  itemTitle: { fontSize: 16, color: '#111827' },
  muted: { color: '#6b7280' },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  resultTitle: { fontSize: 18, fontWeight: '800' },
  resultLine: { color: '#111827' },
  badge: { backgroundColor: '#f3f4f6', color: '#111827', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9999, overflow: 'hidden' },
  mapCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  barTrack: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipText: { color: '#111827', fontWeight: '700' },
});
