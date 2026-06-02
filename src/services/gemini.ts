import { Language, ChatMessage } from '@/src/types';

export interface GeminiResponse {
  text: string;
  error?: string;
}

// Get backend URL - hardcoded for APK, detect for web
const getBackendUrl = (): string => {
  const RENDER_URL = 'https://sukoon-3al3.onrender.com';
  
  // Check if running in Capacitor/APK
  // In APK, window.location.origin is usually 'capacitor://localhost' or similar
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    
    // If it's localhost or capacitor, use Render
    if (origin.includes('localhost') || origin.includes('capacitor')) {
      console.log('🟢 APK/Mobile detected - using Render URL:', RENDER_URL);
      return RENDER_URL;
    }
    
    // For web production
    if (origin.includes('http')) {
      console.log('🟡 Web detected - using Render URL:', RENDER_URL);
      return RENDER_URL;
    }
  }
  
  return RENDER_URL;
};

export class GeminiService {
  private abortController: AbortController | null = null;

  private abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private getLangName(lang: Language): string {
    switch (lang) {
      case 'hi': return 'Hindi';
      case 'ur': return 'Urdu';
      default: return 'English';
    }
  }

  async getReassurance(mood: string, reflection: string, lang: Language): Promise<GeminiResponse> {
    if (!reflection.trim()) return { text: '', error: 'Reflection cannot be empty' };

    this.abort();
    this.abortController = new AbortController();

    try {
      const backendUrl = getBackendUrl();
      const reassuranceUrl = `${backendUrl}/api/reassurance`;
      console.log('📤 Calling Reassurance API at:', reassuranceUrl);
      
      const response = await fetch(reassuranceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, reflection, langName: this.getLangName(lang) }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        console.error('❌ Reassurance API returned status:', response.status);
        throw new Error('Server error');
      }

      const data = await response.json();
      if (data.error) return { text: '', error: data.error };
      return { text: data.text || '' };

    } catch (error: any) {
      if (error.name === 'AbortError') return { text: '' };
      console.error('Reassurance error:', error);
      return { text: '', error: 'I am here for you, even if the connection is slow. Take a deep breath.' };
    } finally {
      this.abortController = null;
    }
  }

  async sendMessage(
    history: ChatMessage[],
    message: string,
    onToken?: (token: string) => void
  ): Promise<GeminiResponse> {
    if (!message.trim()) return { text: '', error: 'Message cannot be empty' };

    this.abort();
    this.abortController = new AbortController();

    try {
      const backendUrl = getBackendUrl();
      const chatUrl = `${backendUrl}/api/chat`;
      console.log('📤 Calling Groq API at:', chatUrl);
      
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        console.error('❌ API returned status:', response.status);
        throw new Error('Server error');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming not supported');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || this.abortController?.signal.aborted) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const dataStr = line.replace('data:', '').trim();
            if (dataStr === '"[DONE]"') break;
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.error) return { text: fullText, error: data.error };
                const content = data.text || '';
                if (content) {
                  fullText += content;
                  onToken?.(content);
                }
              } catch {
                // ignore partial chunk parse errors
              }
            }
          }
        }
      }

      return { text: fullText };
    } catch (error: any) {
      if (error.name === 'AbortError') return { text: '', error: 'Request cancelled' };
      console.error('Chat error:', error);
      return { text: '', error: 'I lost connection for a moment. Please try sending that again.' };
    } finally {
      this.abortController = null;
    }
  }
}

export const aiService = new GeminiService();
