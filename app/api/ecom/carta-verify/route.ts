import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkVoucher } from '@/lib/sogei-client';

const bodySchema = z.object({
  codiceVoucher: z
    .string()
    .length(8, 'Il codice buono deve essere di 8 caratteri')
    .regex(/^[A-Za-z0-9]+$/, 'Il codice deve contenere solo caratteri alfanumerici'),
  tipo: z.enum(['cultura', 'docente']),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    const { codiceVoucher, tipo } = parsed.data;
    const data = await checkVoucher(codiceVoucher, tipo);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? 'Errore verifica buono' },
      { status: 500 },
    );
  }
}
