import { getCollection, type CollectionEntry } from 'astro:content';

export const BLOG_PAGE_SIZE = 18;
export type BlogEntry = CollectionEntry<'blog'>;

export async function getBlogPosts(): Promise<BlogEntry[]> {
  return (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.slug.localeCompare(b.slug));
}

export function getBlogPage(posts: BlogEntry[], page: number) {
  const totalPages = Math.ceil(posts.length / BLOG_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) throw new RangeError(`Invalid blog page ${page}`);
  return { posts: posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE), totalPages };
}

export const blogPageUrl = (page: number) => page === 1 ? '/blog/' : `/blog/page/${page}/`;
