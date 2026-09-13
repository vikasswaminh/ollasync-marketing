import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum([
      'Self-Hosted',
      'Self-hosting',
      'Cryptography',
      'Comparisons',
      'Compliance',
      'Guides',
      'Security',
      'Infrastructure & Performance',
      'Enterprise Use Cases',
      'Product',
      'Teaching',
      'Translation',
    ]),
    cover: z.string().optional(),
    author: z.string().default('The Ollasync team'),
    authorRole: z.string().default('Security & product'),
    readTime: z.number().default(6),
    /** true = pillar page (comprehensive hub); clusters link up to a pillar slug */
    pillar: z.boolean().default(false),
    pillarSlug: z.string().optional(),
    takeaways: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    /** research sources cited by the article (content engine): rendered as a "Sources" list under the body */
    sources: z
      .array(z.object({ url: z.string().url(), publisher: z.string(), accessDate: z.string(), claim: z.string() }))
      .default([]),
    /** explicit related-post slugs (shown first in "Related reading"; older posts gain one when a new post links them) */
    related: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
