// app/api/flush-daily-state/route.js
// Recibe datos de sendBeacon (text/plain) y los persiste en Supabase
import { NextResponse } from 'next/server';

const SB_URL = 'https://khinwyoejhoqqunfyjft.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM';
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

export async function POST(req) {
  try {
    const body = await req.text();
    const { email, campos } = JSON.parse(body);
    if (!email || !campos) return NextResponse.json({ ok: false }, { status: 400 });

    const hoy = new Date().toISOString().split('T')[0];
    const check = await fetch(
      `${SB_URL}/rest/v1/daily_state?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy}`,
      { headers: sbH }
    );
    const rows = await check.json();

    if (rows?.length > 0) {
      await fetch(
        `${SB_URL}/rest/v1/daily_state?email=eq.${encodeURIComponent(email)}&fecha=eq.${hoy}`,
        { method: 'PATCH', headers: sbH, body: JSON.stringify({ ...campos, updated_at: new Date().toISOString() }) }
      );
    } else {
      await fetch(`${SB_URL}/rest/v1/daily_state`, {
        method: 'POST',
        headers: { ...sbH, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ email, fecha: hoy, ...campos, updated_at: new Date().toISOString() }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}