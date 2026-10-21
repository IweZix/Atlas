import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase unreachable: nothing more we can do server-side, the client
    // still drops its local state and redirects away.
  }

  return NextResponse.json({ success: true });
}
