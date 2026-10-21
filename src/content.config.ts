import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const trips = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/trips' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      code: z.string().length(3),
      year: z.number().int(),
      order: z.number().int(),
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      caption: z.string(),
      cover: image().optional(),
      photos: z.array(image()).default([]),
    }),
});

export const collections = { trips };
