import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createAnnouncement as createAnnouncementRow,
  getActiveAnnouncementRow,
  listAnnouncements,
} from '@/lib/announcements/repository';
import {
  announcementInputSchema,
  toAnnouncementWriteInput,
} from '@/lib/announcements/schema';
import { isEnabled } from '@/lib/features';
import {
  assertCurrentUserIsAdmin,
  ForbiddenError,
} from '@/lib/supabase/list-users';

export async function GET() {
  try {
    await assertCurrentUserIsAdmin();

    if (!(await isEnabled('banner'))) {
      return NextResponse.json({ error: 'feature_disabled' }, { status: 403 });
    }

    const [announcements, activeAnnouncement] = await Promise.all([
      listAnnouncements(),
      getActiveAnnouncementRow(),
    ]);

    return NextResponse.json({
      announcements,
      activeAnnouncementId: activeAnnouncement?.id ?? null,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'announcements_unavailable' },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertCurrentUserIsAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { ok: false, errors: { _form: ['forbidden'] } },
        { status: 403 },
      );
    }
    throw error;
  }

  if (!(await isEnabled('banner'))) {
    return NextResponse.json(
      { ok: false, errors: { _form: ['feature_disabled'] } },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = announcementInputSchema.safeParse(body);

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
    const announcement = await createAnnouncementRow(
      toAnnouncementWriteInput(parsed.data),
    );
    return NextResponse.json({ ok: true, announcement });
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: ['unexpected_error'] } },
      { status: 500 },
    );
  }
}
