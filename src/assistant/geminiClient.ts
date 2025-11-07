import axios from 'axios';
import Constants from 'expo-constants';

const fromConstants = (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || fromConstants;

export type Attachment = {
  mimeType: string;
  dataBase64: string;
};

export async function askGemini(query: string, attachments?: Attachment[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Mock: I would answer "${query}" using Gemini if an API key were set.`;
  }
  try {
    const parts: any[] = [{ text: query }];
    if (attachments && attachments.length) {
      for (const a of attachments) {
        if (!a?.dataBase64 || !a?.mimeType) continue;
        parts.push({ inline_data: { mime_type: a.mimeType, data: a.dataBase64 } });
      }
    }
    const resp = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      { contents: [{ parts }] },
      {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        timeout: 15000,
      }
    );
    const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return (text || 'No response').trim();
  } catch (e: any) {
    const code = e?.response?.status || e?.code || 'ERR';
    const msg = e?.response?.data?.error?.message || e?.message || 'Unknown error';
    return `Sorry, I could not reach Gemini right now. (${code}) ${msg}`;
  }
}
