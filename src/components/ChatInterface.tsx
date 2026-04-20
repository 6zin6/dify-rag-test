'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'こんにちは！社内情報について何でもお聞きください。',
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const query = input.trim();
    if (!query || isLoading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    // Placeholder for the streaming assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, conversationId }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(text);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice('data: '.length).trim();
            if (json === '[DONE]') continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(json) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (event.event === 'message' && typeof event.answer === 'string') {
              flushSync(() => {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: updated[updated.length - 1].content + event.answer,
                  };
                  return updated;
                });
              });
              if (typeof event.conversation_id === 'string') {
                setConversationId(event.conversation_id);
              }
            }

            if (event.event === 'message_end') {
              if (typeof event.conversation_id === 'string') {
                setConversationId(event.conversation_id);
              }
            }

            if (event.event === 'error') {
              throw new Error(typeof event.message === 'string' ? event.message : 'AI service error');
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました。もう一度お試しください。');
      // Remove the empty assistant placeholder on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-5xl mx-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}
            >
              {msg.content}
              {/* Blinking cursor while streaming */}
              {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-gray-500 align-middle animate-pulse">
                  ▊
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Error message */}
        {error && (
          <div className="mx-auto max-w-sm rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Shift+Enterで改行)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 max-h-40 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 h-[42px] px-4 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  );
}
