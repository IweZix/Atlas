import { NextResponse } from 'next/server';
import { toggleAnnouncement as toggleAnnouncementRow } from '@/lib/announcements/repository';
import { isEnabled } from '@/lib/features';
import {
  assertCurrentUserIsAdmin,
  ForbiddenError,
} from '@/lib/supabase/list-users';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const { announcementId } = await params;

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
  const isActive = body?.isActive;

  if (typeof isActive !== 'boolean') {
    return NextResponse.json(
      { ok: false, errors: { _form: ['invalid_input'] } },
      { status: 400 },
    );
  }

  try {
    const announcement = await toggleAnnouncementRow(announcementId, isActive);
    return NextResponse.json({ ok: true, announcement });
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: ['unexpected_error'] } },
      { status: 500 },
    );
  }
}
