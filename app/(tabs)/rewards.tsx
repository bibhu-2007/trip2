import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type Badge = { name: string; desc: string; icon: string; target: number; progress: number; unlocked: boolean };
type StoreItem = { name: string; cost: number; icon: string };
type RewardLog = { text: string; date: string };
type RewardsData = { ecoPoints: number; totalCO2Saved: number; badges: Badge[]; redeemed: string[]; logs: RewardLog[] };

export default function RewardsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [data, setData] = useState<RewardsData>({ ecoPoints: 860, totalCO2Saved: 12.4, badges: [], redeemed: [], logs: [] });
  const [showRecentPeek, setShowRecentPeek] = useState(false);
  const lastOffsetY = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('rewardsData');
        if (raw) setData(JSON.parse(raw)); else setData((d) => ({ ...d, badges: defaultBadges }));
      } catch { setData((d) => ({ ...d, badges: defaultBadges })); }
    })();
  }, []);

  const level = useMemo(() => (data.ecoPoints >= 2000 ? 'Planet Guardian 🌎' : data.ecoPoints >= 1000 ? 'Green Traveller 🌍' : 'Eco Starter 🌱'), [data.ecoPoints]);
  const nextCap = useMemo(() => (data.ecoPoints >= 2000 ? 3000 : data.ecoPoints >= 1000 ? 2000 : 1000), [data.ecoPoints]);
  const progressPct = Math.min(100, Math.round((data.ecoPoints % nextCap) / nextCap * 100));

  const store: StoreItem[] = useMemo(() => ([
    { name: '🌿 "Green Hero" badge', cost: 200, icon: '🌿' },
    { name: '🎟️ Café Coupon', cost: 500, icon: '🎟️' },
    { name: '🌍 Tree Planting (virtual)', cost: 1000, icon: '🌍' },
  ]), []);

  const defaultBadges: Badge[] = [
    { name: 'Walk Hero', desc: '5 walking trips', icon: '👣', target: 5, progress: 3, unlocked: false },
    { name: 'Bike Saver', desc: '10 bike trips', icon: '🚲', target: 10, progress: 8, unlocked: false },
    { name: 'Transit Star', desc: '20 transit trips', icon: '🚌', target: 20, progress: 12, unlocked: false },
    { name: 'Eco Warrior', desc: '1000 kg CO₂ saved', icon: '🌍', target: 1000, progress: 12.4, unlocked: false },
    { name: 'Explorer', desc: '10 new destinations', icon: '🗺️', target: 10, progress: 4, unlocked: false },
  ];

  const save = async (next: RewardsData) => {
    setData(next);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('rewardsData', JSON.stringify(next));
    } catch {}
  };

  const redeem = async (item: StoreItem) => {
    if (data.ecoPoints < item.cost) {
      Alert.alert('Not enough points', 'Earn more EcoPoints to redeem this.');
      return;
    }
    const next: RewardsData = {
      ...data,
      ecoPoints: data.ecoPoints - item.cost,
      redeemed: [...data.redeemed, item.name],
      logs: [{ text: `Redeemed: ${item.name} (-${item.cost} pts)`, date: new Date().toISOString() }, ...data.logs].slice(0, 10),
    };
    await save(next);
    Alert.alert('Redeemed', `${item.name} redeemed.`);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastOffsetY.current;
    if (dy < -10) setShowRecentPeek(true);
    if (dy > 10) setShowRecentPeek(false);
    lastOffsetY.current = y;
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 16 }]} onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Rewards</Text>

      {showRecentPeek && data.logs.length > 0 && (
        <View style={styles.recentPeek}>
          <Text style={styles.recentPeekTitle}>Recent Rewards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {data.logs.slice(0, 5).map((l, i) => (
              <View key={i} style={styles.peekChip}><Text style={styles.peekChipText}>✅ {l.text}</Text></View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.headerCard}>
        <Text style={styles.headerLine}>Your EcoScore: <Text style={styles.bold}>{data.ecoPoints}</Text> 🌱</Text>
        <Text style={styles.headerLine}>Level: {level}</Text>
        <Text style={styles.headerLine}>Total CO₂ Saved: {data.totalCO2Saved.toFixed(1)} kg</Text>
        <View style={styles.progressWrap}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.muted}>{data.ecoPoints} / {nextCap} pts</Text>
      </View>

      <Text style={styles.section}>Badges & Achievements</Text>
      <View style={styles.grid}>
        {data.badges.map((b, i) => {
          const pct = Math.min(100, Math.round((b.progress / b.target) * 100));
          const unlocked = b.unlocked || pct >= 100;
          return (
            <View key={i} style={styles.badgeCard}>
              <Text style={styles.badgeTitle}>{b.icon} {b.name}</Text>
              <Text style={styles.muted}>{b.desc}</Text>
              <View style={styles.progressWrapSmall}><View style={[styles.progressFillSmall, { width: `${Math.min(100, pct)}%` }]} /></View>
              <Text style={styles.badgeStatus}>{unlocked ? 'Unlocked ✅' : `Progress: ${Math.min(b.progress, b.target)} / ${b.target}`}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.section}>Redeem Points</Text>
      <View style={styles.card}>
        {store.map((it) => (
          <View key={it.name} style={styles.rowBetween}>
            <Text style={styles.item}>{it.icon} {it.name}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => redeem(it)}>
              <Text style={styles.primaryBtnText}>Redeem ({it.cost})</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Impact Summary</Text>
      <View style={styles.card}>
        <Text style={styles.item}>🌱 CO₂ Saved (This Month): 8.6 kg</Text>
        <Text style={styles.item}>🚲 Bike: 6 trips • 🚌 Bus: 4 • 🚶 Walk: 3</Text>
        <Text style={styles.item}>Most used mode: Cycle</Text>
      </View>

      <Text style={styles.section}>Leaderboard</Text>
      <View style={styles.card}>
        <Text style={styles.item}>#1 Riya – 1500 pts</Text>
        <Text style={styles.item}>#2 Arjun – 1270 pts</Text>
        <Text style={styles.item}>#3 You – {data.ecoPoints} pts 🌱</Text>
      </View>

      <Text style={styles.section}>Recent Rewards</Text>
      <View style={styles.card}>
        {data.logs.length === 0 ? (
          <Text style={styles.muted}>No rewards yet. Earn points by using eco-friendly modes.</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {data.logs.map((l, i) => (
              <Text key={i} style={styles.item}>✅ {l.text}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  headerCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: '#a7f3d0' },
  headerLine: { fontSize: 16, color: '#065f46' },
  bold: { fontWeight: '800' },
  progressWrap: { height: 10, backgroundColor: '#d1fae5', borderRadius: 9999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  badgeTitle: { fontSize: 16, fontWeight: '800' },
  badgeStatus: { color: '#111827' },
  progressWrapSmall: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 9999, overflow: 'hidden' },
  progressFillSmall: { height: '100%', backgroundColor: '#2563eb' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { fontSize: 16, color: '#111827' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  muted: { color: '#6b7280' },
  recentPeek: { position: 'absolute', top: 8, left: 16, right: 16, zIndex: 50, backgroundColor: '#111827', padding: 10, borderRadius: 12, opacity: 0.95 },
  recentPeekTitle: { color: '#f9fafb', fontWeight: '800', marginBottom: 6 },
  peekChip: { backgroundColor: '#374151', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999 },
  peekChipText: { color: '#f9fafb' },
});
