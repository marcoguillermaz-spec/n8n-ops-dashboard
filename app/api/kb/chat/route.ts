import { NextResponse } from 'next/server';
import type { ChatMessage, ChatResponse } from '@/lib/kb-types';

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_KB_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'N8N_KB_WEBHOOK_URL non configurato' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const message = (body.message ?? '').trim();
    if (!message) {
      return NextResponse.json(
        { error: 'Il messaggio non può essere vuoto' },
        { status: 400 },
      );
    }

    const history: ChatMessage[] = (body.history ?? []).slice(-20);

    // Build contextual text from history
    let fullText = message;
    if (history.length > 0) {
      const contextLines = history.map((m) =>
        m.role === 'user' ? `Utente: ${m.content}` : `Assistente: ${m.content}`,
      );
      fullText =
        `[Contesto conversazione precedente]\n${contextLines.join('\n')}\n[Fine contesto]\n\nDomanda attuale: ${message}`;
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: '/ask_willy',
        text: fullText,
        user_name: 'dashboard-user',
        response_url: '',
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `Webhook error (${res.status}): ${errText || 'Nessun dettaglio'}` },
        { status: 502 },
      );
    }

    const reply = await res.text();
    return NextResponse.json({ reply } satisfies ChatResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore interno' },
      { status: 500 },
    );
  }
}
