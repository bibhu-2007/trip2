import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { askGemini, Attachment } from '@/src/assistant/geminiClient';
import * as FileSystem from 'expo-file-system';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

export default function AssistantScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const listRef = useRef<FlatList<Msg>>(null);
  const contentHeight = useRef(0);
  const [files, setFiles] = useState<Array<{ id: string; name: string; uri: string; mimeType: string; base64: string }>>([]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const userMsg: Msg = { id: String(Date.now()), role: 'user', text: q };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);
    const attachments: Attachment[] = files.map(f => ({ mimeType: f.mimeType, dataBase64: f.base64 }));
    const res = await askGemini(q, attachments);
    const botMsg: Msg = { id: String(Date.now() + 1), role: 'assistant', text: res };
    setMsgs(prev => [...prev, botMsg]);
    setLoading(false);
    setFiles([]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [input, loading]);

  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [msgs.length]);

  const attach = useCallback(async () => {
    try {
      // Try Document Picker first for any file type
      let picked: { uri: string; name?: string; mimeType?: string } | null = null;
      try {
        const DocPicker: any = await import('expo-document-picker');
        const res: any = await DocPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const a = res.assets[0];
          picked = { uri: a.uri, name: a.name, mimeType: a.mimeType };
        }
      } catch {}

      // Fallback to Image Picker if Document Picker unavailable or canceled
      if (!picked) {
        try {
          const ImagePicker: any = await import('expo-image-picker');
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (perm.granted) {
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              const a = res.assets[0];
              picked = { uri: a.uri, name: (a as any).fileName, mimeType: a.mimeType };
            }
          }
        } catch {}
      }

      if (!picked) return;
      const uri = picked.uri;
      const name = picked.name || uri.split('/').pop() || 'file';
      const mimeType = picked.mimeType || 'application/octet-stream';
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      setFiles(prev => [...prev, { id: String(Date.now()), name, uri, mimeType, base64 }]);
    } catch {}
  }, []);

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Assistant</Text>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.assistant]}>
              <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>{item.text}</Text>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.list}
        />
        {files.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachRow}>
            {files.map(f => (
              <View key={f.id} style={styles.attachChip}>
                <Text style={styles.attachChipText} numberOfLines={1}>{f.name}</Text>
                <TouchableOpacity onPress={() => removeFile(f.id)} style={styles.attachRemove}>
                  <Text style={styles.attachRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={attach} disabled={loading} style={[styles.attachBtn, loading && { opacity: 0.6 }]}>
            <FontAwesome name="paperclip" size={18} color="#111827" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#9ca3af"
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={send}
            multiline
            numberOfLines={1}
            maxLength={4000}
          />
          <TouchableOpacity onPress={send} disabled={loading || !input.trim()} style={[styles.send, (loading || !input.trim()) && { opacity: 0.6 }]}> 
            {loading ? <ActivityIndicator color="#111827" /> : <FontAwesome name="send" size={18} color="#111827" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', paddingVertical: 8 },
  list: { paddingVertical: 8 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 10, marginVertical: 6 },
  user: { alignSelf: 'flex-end', backgroundColor: '#111827' },
  assistant: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6' },
  userText: { color: '#ffffff' },
  assistantText: { color: '#111827' },
  attachRow: { paddingVertical: 6, gap: 8 },
  attachChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  attachChipText: { color: '#111827', maxWidth: 200 },
  attachRemove: { marginLeft: 2 },
  attachRemoveText: { color: '#6b7280' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  attachBtn: { height: 44, width: 44, borderRadius: 10, backgroundColor: 'rgba(17,24,39,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827', backgroundColor: '#ffffff', maxHeight: 120 },
  send: { marginLeft: 8, height: 44, width: 44, borderRadius: 10, backgroundColor: 'rgba(17,24,39,0.08)', alignItems: 'center', justifyContent: 'center' },
});
