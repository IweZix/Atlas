import { NextResponse } from 'next/server';
import { z } from 'zod';
import { preferencesUpdateSchema } from '@/lib/preferences';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, errors: { _form: ['unauthorized'] } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = preferencesUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      {
        ok: false,
        errors: {
          ...fieldErrors,
          ...(formErrors.length ? { _form: formErrors } : {}),
        },
      },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ userId: user.id, ...parsed.data }, { onConflict: 'userId' })
      .select('locale, theme')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, preferences: data });
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: ['unexpected_error'] } },
      { status: 500 },
    );
  }
}
