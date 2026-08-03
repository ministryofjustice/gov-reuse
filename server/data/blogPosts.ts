export type BlogPost = {
  slug: string
  title: string
  summary: string
  fileName?: string
  externalUrl?: string
  publishedDate: string
  publishedDateDisplay: string
}

const blogPosts: BlogPost[] = [
  {
    slug: 'home-office-supporting-gov-reuse-library',
    title: 'Home Office shares how it’s supporting the GOV Reuse Library',
    summary:
      'Home Office Digital has published a blog about our cross-government work to make reusable design resources easier to find. It covers contributions to the library, ongoing user research and what we learned from testing AI-powered search across government design systems.',
    externalUrl: 'https://hodigital.blog.gov.uk/2026/07/20/design-once-reuse-everywhere/',
    publishedDate: '2026-07-20',
    publishedDateDisplay: '20 July 2026',
  },
]

export const getBlogPosts = (): BlogPost[] =>
  [...blogPosts].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => blogPosts.find(post => post.slug === slug)
