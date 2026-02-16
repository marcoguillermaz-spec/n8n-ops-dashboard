'use client';

import { useState } from 'react';
import type { ChatMessage } from '@/lib/kb-types';
import KBMessageList from './KBMessageList';
import KBChatInput from './KBChatInput';

export default function KBSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (text: string) => {
    setError('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const res = await fetch('/api/kb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Errore ${res.status}`);
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages([...updated, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di rete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            &#x1f9e0; AI Knowledge Base
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Interroga la knowledge base aziendale tramite RAG
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400
                       transition hover:bg-gray-800 hover:text-white"
          >
            Nuova conversazione
          </button>
        )}
      </div>

      {/* Chat card */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <KBMessageList messages={messages} isLoading={isLoading} />

        {error && (
          <div className="mx-4 mb-2 rounded-xl border border-red-800 bg-red-950/50 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <KBChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
