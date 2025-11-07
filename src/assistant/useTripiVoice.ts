import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { askGemini } from './geminiClient';
import { router } from 'expo-router';

export type TripiState = {
  isActive: boolean;
  statusText: string;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
}

function fuzzyHasWake(text: string) {
  const t = normalize(text);
  if (t.includes('tripi') || t.includes('tripy') || t.includes('trippy')) return true;
  const greetings = ['hello', 'hey', 'hi', 'hallo', 'yo'];
  return greetings.some(g => t.includes(`${g} tripi`));
}

export function useTripiVoice(enabled = true, continuous = true) {
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState('Listening…');
  const voiceRef = useRef<any>(null);
  const mockInterval = useRef<any>(null);

  const activate = useCallback(async () => {
    setIsActive(true);
    setStatusText('Listening…');
    try { const Haptics = await import('expo-haptics'); await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleCommand = useCallback(async (textRaw: string) => {
    const text = normalize(textRaw);
    if (text.includes('close')) { deactivate(); return; }
    if (text.includes('launch') || text.includes('home')) { router.push('/(tabs)/home'); return; }
    if (text.includes('plan')) { router.push('/(tabs)/planner'); return; }
    if (text.includes('profile')) { router.push('/(tabs)/profile'); return; }
    if (text.includes('map')) { router.push('/(tabs)/map'); return; }
    const reply = await askGemini(textRaw);
    setStatusText(`Tripi: ${reply}`);
  }, [deactivate]);

  const onSpeechResults = useCallback(async (text: string) => {
    if (!isActive) {
      if (fuzzyHasWake(text)) {
        await activate();
      }
      return;
    }
    await handleCommand(text);
  }, [isActive, activate, handleCommand]);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;
    const attachVoice = async () => {
      try {
        const Voice = (await import('react-native-voice')).default;
        voiceRef.current = Voice;
        Voice.onSpeechResults = (e: any) => {
          const value = e?.value?.[0];
          if (value) onSpeechResults(value);
        };
        await Voice.start(Platform.OS === 'ios' ? 'en-US' : 'en-US');
      } catch {
        if (!mockInterval.current && isMounted) {
          mockInterval.current = setInterval(() => {}, 2000);
        }
      }
    };
    attachVoice();
    return () => {
      isMounted = false;
      if (voiceRef.current?.destroy) voiceRef.current.destroy().catch(() => {});
      if (mockInterval.current) { clearInterval(mockInterval.current); mockInterval.current = null; }
    };
  }, [enabled, onSpeechResults]);

  return {
    isActive,
    statusText,
    activate,
    deactivate,
    onSpeechResults,
  } as TripiState & {
    activate: () => Promise<void>;
    deactivate: () => void;
    onSpeechResults: (text: string) => Promise<void>;
  };
}
