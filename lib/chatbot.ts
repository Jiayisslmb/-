// AI Chatbot SSE 客户端

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function sendMessage(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  conversationId?: number,
  mode?: 'auto' | 'fast' | 'deep',
): Promise<string> {
  const response = await fetch(`${API_BASE}/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({ messages, conversationId, mode }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chatbot API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') return fullContent;

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) {
          fullContent += parsed.content;
          onChunk(parsed.content);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return fullContent;
}
