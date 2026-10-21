import { z } from 'zod';
import {
  endDateInputToUtc,
  startDateInputToUtc,
} from '@/lib/announcements/dates';
import type { AnnouncementWriteInput } from '@/lib/announcements/repository';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .transform((v) => v ?? null);

function isSafeLinkUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  return value.startsWith('https://');
}

export const announcementInputSchema = z
  .object({
    message: z
      .string()
      .transform((v) => v.replace(/\r\n|\r|\n/g, ' ').trim())
      .pipe(z.string().min(1).max(160)),
    linkUrl: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((v) => v || null),
    linkLabel: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((v) => v || null),
    variant: z.enum(['info', 'promo', 'alerte']),
    startsAt: dateOnlySchema,
    endsAt: dateOnlySchema,
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.linkUrl && !isSafeLinkUrl(data.linkUrl)) {
      ctx.addIssue({
        code: 'custom',
        path: ['linkUrl'],
        message: 'link_url_invalid',
      });
    }

    if ((data.linkUrl === null) !== (data.linkLabel === null)) {
      ctx.addIssue({
        code: 'custom',
        path: data.linkUrl ? ['linkLabel'] : ['linkUrl'],
        message: 'link_pair_required',
      });
    }

    if (
      data.linkLabel &&
      (data.linkLabel.length < 1 || data.linkLabel.length > 40)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['linkLabel'],
        message: 'link_label_length',
      });
    }

    // Both are "YYYY-MM-DD" strings — plain comparison is correct because
    // the format is fixed-width and zero-padded, so lexicographic order
    // matches chronological order.
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'end_before_start',
      });
    }
  });

export type AnnouncementFormValues = z.input<typeof announcementInputSchema>;
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export function toAnnouncementWriteInput(
  data: AnnouncementInput,
): AnnouncementWriteInput {
  return {
    message: data.message,
    linkUrl: data.linkUrl,
    linkLabel: data.linkLabel,
    variant: data.variant,
    startsAt: data.startsAt
      ? startDateInputToUtc(data.startsAt).toISOString()
      : null,
    endsAt: data.endsAt ? endDateInputToUtc(data.endsAt).toISOString() : null,
    isActive: data.isActive,
  };
}
