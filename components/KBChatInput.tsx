'use client';

import { useRef, useCallback } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function KBChatInput({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = textareaRef.current?.value.trim();
      if (text && !disabled) {
        onSend(text);
        if (textareaRef.current) {
          textareaRef.current.value = '';
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleClick = () => {
    const text = textareaRef.current?.value.trim();
    if (text && !disabled) {
      onSend(text);
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Scrivi una domanda..."
          disabled={disabled}
          onInput={resize}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                     text-sm text-gray-100 placeholder-gray-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
        />
        <button
          onClick={handleClick}
          disabled={disabled}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                     text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center gap-2 shrink-0"
        >
          {disabled ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Invia'
          )}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-600">
        Premi Invio per inviare, Shift+Invio per andare a capo
      </p>
    </div>
  );
}
