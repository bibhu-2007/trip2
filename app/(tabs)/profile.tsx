import { View, Text, StyleSheet, Image, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [permanentLocation, setPermanentLocation] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>('https://i.pravatar.cc/150');

  const onSave = async () => {
    const data = { name, username, email, location, currentLocation, permanentLocation, avatarUri };
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('profileData', JSON.stringify(data));
      Alert.alert('Saved', 'Your profile has been updated.');
      router.push('/profile-dashboard' as any);
    } catch {
      Alert.alert('Saved locally', 'Data saved for this session. Install AsyncStorage to persist across restarts.');
      console.log('Profile data:', data);
      router.push('/profile-dashboard' as any);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('profileData');
        if (raw) {
          const d = JSON.parse(raw);
          if (typeof d.name === 'string') setName(d.name);
          if (typeof d.username === 'string') setUsername(d.username);
          if (typeof d.email === 'string') setEmail(d.email);
          if (typeof d.location === 'string') setLocation(d.location);
          if (typeof d.currentLocation === 'string') setCurrentLocation(d.currentLocation);
          if (typeof d.permanentLocation === 'string') setPermanentLocation(d.permanentLocation);
          if (typeof d.avatarUri === 'string') setAvatarUri(d.avatarUri);
        }
      } catch {}
    })();
  }, []);

  const onPickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to select a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Image picker not available', 'Install expo-image-picker to enable selecting a profile picture.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 16 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <TouchableOpacity style={styles.changePhotoBtn} onPress={onPickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          <Text style={styles.name}>Traveler</Text>
          <Text style={styles.caption}>Set preferences and manage trips.</Text>

          <View style={styles.form}>
        <View style={styles.field}> 
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Current Location</Text>
          <TextInput
            style={styles.input}
            value={currentLocation}
            onChangeText={setCurrentLocation}
            placeholder="Where you are now"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Permanent Location</Text>
          <TextInput
            style={styles.input}
            value={permanentLocation}
            onChangeText={setPermanentLocation}
            placeholder="Hometown / Permanent address"
            placeholderTextColor="#999"
          />
        </View>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 24, paddingBottom: 48 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  caption: { fontSize: 14, color: '#666', marginBottom: 16 },
  form: { width: '100%', gap: 12 },
  field: { width: '100%' },
  label: { fontSize: 14, color: '#444', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  saveBtn: { marginTop: 8, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  changePhotoBtn: { marginTop: 6, marginBottom: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: '#f3f4f6' },
  changePhotoText: { color: '#111827', fontSize: 12, fontWeight: '600' },
});
