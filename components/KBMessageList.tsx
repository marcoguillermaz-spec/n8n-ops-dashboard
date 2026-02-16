'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/kb-types';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function KBMessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <span className="text-5xl block mb-4">&#x1f9e0;</span>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Fai una domanda alla Knowledge Base
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Interroga la knowledge base aziendale. Le risposte vengono generate
            tramite RAG (OpenAI + Pinecone).
          </p>
          <p className="text-xs text-gray-600 italic">
            Esempio: &quot;Quali sono le policy di reso?&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            <p
              className={`text-[10px] mt-1 ${
                msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}
            >
              {formatTime(msg.timestamp)}
            </p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
