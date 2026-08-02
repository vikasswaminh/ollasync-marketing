import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['Cryptography', 'Self-hosting', 'Compliance', 'Guides', 'Comparisons', 'Product']),
    cover: z.string().optional(),
    author: z.string().default('The Ollasync team'),
    authorRole: z.string().default('Security & product'),
    readTime: z.number().default(6),
    /** true = pillar page (comprehensive hub); clusters link up to a pillar slug */
    pillar: z.boolean().default(false),
    pillarSlug: z.string().optional(),
    takeaways: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
