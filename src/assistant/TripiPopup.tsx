import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { askGemini } from './geminiClient';

type Props = {
  visible: boolean;
  statusText: string;
  onClose: () => void;
};

export default function TripiPopup({ visible, statusText, onClose }: Props) {
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
  }, [visible]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [260, 0] });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]}> 
      <View style={styles.sheet}>
        <Animated.View style={[styles.pulse, { transform: [{ scale: pulse }] }]}> 
          <View style={styles.iconCircle}>
            <FontAwesome name="microphone" size={22} color="#111827" />
          </View>
        </Animated.View>
        <Text style={styles.text} numberOfLines={4}>{statusText || 'Listening…'}</Text>
        {reply ? (
          <Text style={styles.reply} numberOfLines={6}>{reply}</Text>
        ) : null}
        <View style={styles.row}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your question…"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={async () => {
              if (!input.trim() || loading) return;
              setLoading(true);
              const res = await askGemini(input.trim());
              setReply(res);
              setLoading(false);
            }}
          />
          <TouchableOpacity
            disabled={loading || !input.trim()}
            onPress={async () => {
              if (!input.trim() || loading) return;
              setLoading(true);
              const res = await askGemini(input.trim());
              setReply(res);
              setLoading(false);
            }}
            style={[styles.sendBtn, (loading || !input.trim()) && { opacity: 0.6 }]}
          >
            {loading ? <ActivityIndicator color="#111827" /> : <FontAwesome name="send" size={18} color="#111827" />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  sheet: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },
  pulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.08)'
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(17,24,39,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  reply: {
    marginTop: 10,
    color: '#111827',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'stretch'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'stretch'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: '#ffffff'
  },
  sendBtn: {
    marginLeft: 8,
    height: 44,
    width: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  closeText: {
    color: 'white',
    fontWeight: '700'
  }
});
