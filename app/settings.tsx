import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useAppTheme } from '@/context/ThemeContext';

type Mode = 'Car' | 'Bike' | 'Walk' | 'Transit' | 'Carpool';
type DistanceUnit = 'km' | 'miles';
type CarbonUnit = 'kg' | 'g';
type Provider = 'Google Maps' | 'Mapbox' | 'OpenRouteService';

export default function SettingsScreen() {
  const { theme, setTheme } = useAppTheme();
  const [preferredTravelMode, setPreferredTravelMode] = useState<Mode>('Car');
  const [unitsDistance, setUnitsDistance] = useState<DistanceUnit>('km');
  const [unitsCarbon, setUnitsCarbon] = useState<CarbonUnit>('kg');
  const [language, setLanguage] = useState<string>('English');
  const themeDark = theme === 'dark';

  const [ecoScoreNotifications, setEcoScoreNotifications] = useState(true);
  const [monthlySummaryEmail, setMonthlySummaryEmail] = useState(false);
  const [rewardsNotifications, setRewardsNotifications] = useState(true);

  const [mapProvider, setMapProvider] = useState<Provider>('Google Maps');
  const [offlineMode, setOfflineMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);

  const [pushNotifications, setPushNotifications] = useState(false);
  const [transitDelayAlerts, setTransitDelayAlerts] = useState(false);
  const [carpoolUpdates, setCarpoolUpdates] = useState(false);

  const [dataSharingConsent, setDataSharingConsent] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.expoConfig?.runtimeVersion ?? '';

  const toggleLocationAccess = async (next: boolean) => {
    if (next) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed for trip planning.');
        setLocationAccess(false);
        return;
      }
    }
    setLocationAccess(next);
  };

  const resetDemoData = () => {
    setPreferredTravelMode('Car');
    setUnitsDistance('km');
    setUnitsCarbon('kg');
    setLanguage('English');
    setTheme('light');
    setEcoScoreNotifications(true);
    setMonthlySummaryEmail(false);
    setRewardsNotifications(true);
    setMapProvider('Google Maps');
    setOfflineMode(false);
    setLocationAccess(false);
    setPushNotifications(false);
    setTransitDelayAlerts(false);
    setCarpoolUpdates(false);
    setDataSharingConsent(false);
    setDebugMode(false);
    Alert.alert('Reset complete', 'Demo data and preferences have been reset.');
  };

  const OptionRow = ({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <View style={styles.rowGroup}>
      <Text style={styles.itemTitle}>{title}</Text>
      <View style={styles.optionsWrap}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[styles.pill, value === opt && styles.pillActive]} onPress={() => onChange(opt)}>
            <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ToggleRow = ({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  const LinkRow = ({ title, url }: { title: string; url: string }) => (
    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(url)}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.linkText}>Open</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>App Preferences</Text>
      <View style={styles.card}>
        <OptionRow title="Preferred Travel Mode" options={["Car", "Bike", "Walk", "Transit", "Carpool"]} value={preferredTravelMode} onChange={(v) => setPreferredTravelMode(v as Mode)} />
        <OptionRow title="Distance" options={["km", "miles"]} value={unitsDistance} onChange={(v) => setUnitsDistance(v as DistanceUnit)} />
        <OptionRow title="Carbon" options={["kg", "g"]} value={unitsCarbon} onChange={(v) => setUnitsCarbon(v as CarbonUnit)} />
        <OptionRow title="Language" options={["English", "Hindi"]} value={language} onChange={(v) => setLanguage(v)} />
        <ToggleRow title="Theme Mode: Dark" value={themeDark} onValueChange={async (val) => {
          setTheme(val ? 'dark' : 'light');
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.setItem('appTheme', val ? 'dark' : 'light');
          } catch {}
        }} />
      </View>

      <Text style={styles.section}>Sustainability & Rewards</Text>
      <View style={styles.card}>
        <ToggleRow title="EcoScore Notifications" value={ecoScoreNotifications} onValueChange={setEcoScoreNotifications} />
        <ToggleRow title="Monthly Summary Email" value={monthlySummaryEmail} onValueChange={setMonthlySummaryEmail} />
        <ToggleRow title="Rewards Notifications" value={rewardsNotifications} onValueChange={setRewardsNotifications} />
      </View>

      <Text style={styles.section}>Map & Trip Settings</Text>
      <View style={styles.card}>
        <OptionRow title="Map Provider" options={["Google Maps", "Mapbox", "OpenRouteService"]} value={mapProvider} onChange={(v) => setMapProvider(v as Provider)} />
        <ToggleRow title="Offline Mode (Mock Data)" value={offlineMode} onValueChange={setOfflineMode} />
        <ToggleRow title="Location Access" value={locationAccess} onValueChange={toggleLocationAccess} />
      </View>

      <Text style={styles.section}>Notifications</Text>
      <View style={styles.card}>
        <ToggleRow title="Push Notifications" value={pushNotifications} onValueChange={setPushNotifications} />
        <ToggleRow title="Transit Delay Alerts" value={transitDelayAlerts} onValueChange={setTransitDelayAlerts} />
        <ToggleRow title="Carpool Updates" value={carpoolUpdates} onValueChange={setCarpoolUpdates} />
      </View>

      <Text style={styles.section}>Privacy & Security</Text>
      <View style={styles.card}>
        <ToggleRow title="Allow anonymous data sharing" value={dataSharingConsent} onValueChange={setDataSharingConsent} />
        <LinkRow title="View Privacy Policy" url="https://example.com/privacy" />
        <LinkRow title="View Terms of Service" url="https://example.com/terms" />
      </View>

      <Text style={styles.section}>Developer / Advanced</Text>
      <View style={styles.card}>
        <ToggleRow title="Enable Debug Mode" value={debugMode} onValueChange={setDebugMode} />
        <TouchableOpacity style={styles.actionBtn} onPress={resetDemoData}>
          <Text style={styles.actionBtnText}>Reset Demo Data</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.itemTitle}>App Version</Text>
          <Text style={styles.muted}>{`v${version}${build ? ` (${build})` : ''}`}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  section: { marginTop: 16, marginBottom: 8, fontSize: 14, color: '#374151', fontWeight: '700', textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowGroup: { paddingVertical: 6 },
  itemTitle: { fontSize: 16, color: '#111827' },
  muted: { fontSize: 14, color: '#6b7280' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: '#f9fafb' },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pillText: { color: '#111827', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  linkText: { color: '#2563eb', fontWeight: '600' },
  actionBtn: { marginTop: 6, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
