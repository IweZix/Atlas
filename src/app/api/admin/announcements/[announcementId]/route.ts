import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteAnnouncement as deleteAnnouncementRow,
  getAnnouncementById,
  updateAnnouncement as updateAnnouncementRow,
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const { announcementId } = await params;

  try {
    await assertCurrentUserIsAdmin();

    if (!(await isEnabled('banner'))) {
      return NextResponse.json({ error: 'feature_disabled' }, { status: 403 });
    }

    const announcement = await getAnnouncementById(announcementId);

    if (!announcement) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'announcement_unavailable' },
      { status: 503 },
    );
  }
}

export async function PATCH(
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
    const announcement = await updateAnnouncementRow(
      announcementId,
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

export async function DELETE(
  _request: Request,
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

  try {
    await deleteAnnouncementRow(announcementId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: ['unexpected_error'] } },
      { status: 500 },
    );
  }
}
