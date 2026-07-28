export type BlogPost = {
  slug: string
  title: string
  summary: string
  fileName: string
  publishedDate: string
  publishedDateDisplay: string
}

const blogPosts: BlogPost[] = [
  {
    slug: 'updated-accessibility-statement',
    title: 'Updated accessibility statement',
    summary:
      'We have reviewed and refreshed our accessibility statement to reflect current standards, testing approach and known limitations across the platform.',
    fileName: 'updated-accessibility-statement.md',
    publishedDate: '2026-07-22',
    publishedDateDisplay: '22 July 2026',
  },
  {
    slug: 'reusable-forms-patterns-expanded',
    title: 'Reusable forms patterns expanded',
    summary:
      'New form-related examples have been added to help teams apply consistent input, validation and error messaging patterns across services.',
    fileName: 'reusable-forms-patterns-expanded.md',
    publishedDate: '2026-07-18',
    publishedDateDisplay: '18 July 2026',
  },
  {
    slug: 'reuse-library-new-domain-name',
    title: 'Reuse Library gets new domain name',
    summary:
      'The service has moved to a clearer public domain to improve discoverability, bookmarking and cross-team sharing of reusable guidance.',
    fileName: 'reuse-library-new-domain-name.md',
    publishedDate: '2026-07-12',
    publishedDateDisplay: '12 July 2026',
  },
  {
    slug: 'launching-gov-reuse-library',
    title: 'Reuse Library vision published',
    summary:
      'The GOV Reuse Library brings reusable components, patterns and content guidance together so teams can reduce duplication and deliver more consistently across departments.',
    fileName: 'launching-gov-reuse-library.md',
    publishedDate: '2026-06-12',
    publishedDateDisplay: '12 June 2026',
  },
  {
    slug: 'improving-search-with-feedback',
    title: 'AI search takes centre stage at UX Scotland',
    summary:
      'Recent work on query expansion and scoring has improved result relevance, helping users discover trusted reusable assets faster and with less manual filtering.',
    fileName: 'improving-search-with-feedback.md',
    publishedDate: '2026-07-05',
    publishedDateDisplay: '5 July 2026',
  },
  {
    slug: 'contributor-guidance-refreshed',
    title: 'Contributor guidance refreshed',
    summary:
      'Contribution steps have been simplified with clearer examples so departments can add and maintain reusable entries with less overhead.',
    fileName: 'contributor-guidance-refreshed.md',
    publishedDate: '2026-06-28',
    publishedDateDisplay: '28 June 2026',
  },
]

export const getBlogPosts = (): BlogPost[] =>
  [...blogPosts].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find(post => post.slug === slug)
