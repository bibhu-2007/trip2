import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTripi } from './TripiProvider';

export default function FloatingTripiButton({ style }: { style?: ViewStyle }) {
  const { show } = useTripi();
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={show} style={[styles.fab, style]}> 
      <FontAwesome name="microphone" size={22} color="#111827" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  }
});
