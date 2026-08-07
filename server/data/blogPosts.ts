export type BlogPost = {
  slug: string
  title: string
  summary: string
  quotes?: string[]
  linkText?: string
  linkUrl?: string
  fileName?: string
  publishedDate: string
  publishedDateDisplay: string
}

const blogPosts: BlogPost[] = [
  {
    slug: 'home-office-supporting-gov-reuse-library',
    title: 'Home Office shares how it’s supporting the GOV Reuse Library',
    summary:
      'Home Office Digital has published a blog about our cross-government work to make reusable design resources easier to find. It covers contributions to the GOV Reuse Library, ongoing user research and what we learned from testing AI-powered search across government design systems.',
    linkText: 'Read the Home Office Digital blog about the GOV Reuse Library',
    linkUrl: 'https://hodigital.blog.gov.uk/2026/07/20/design-once-reuse-everywhere/',
    publishedDate: '2026-07-20',
    publishedDateDisplay: '20 July 2026',
  },
  {
    slug: 'research-participants-needed',
    title: 'Research participants needed for the GOV Reuse Library',
    summary:
      'You can take part in research to help inform and improve the GOV Reuse Library. We have a cross-government team of user researchers carrying out regular research to ensure the GOV Reuse Library meets the needs of digital teams across the public sector.',
    linkText: 'Sign up to take part in GOV Reuse Library research',
    linkUrl: 'https://passport-office-surveys.homeoffice.gov.uk/s/govreuse/',
    publishedDate: '2026-07-20',
    publishedDateDisplay: '20 July 2026',
  },
  {
    slug: 'keyword-search-now-live',
    title: 'Keyword search now live on the GOV Reuse Library',
    summary:
      'You can now search the GOV Reuse Library’s digital assets much faster using our new search box. While work on our AI-powered search prototype continues, this new feature reduces browsing time. Simply enter a keyword, like ‘autocomplete’, ‘dropdown’ or ‘table’, and select from a list of results that take you straight to the relevant resource. The search feature means you no longer need to scroll down the GOV Reuse Library homepage to search individual government design websites. “This is the first version of our search and we aim to bring further improvements in the coming months to make it more intelligent and useful,” says developer Sandhya Buddharaju. Use the Contribute page to share your feedback, including suggestions for improvements.',
    linkText: 'Try keyword search on the GOV Reuse Library',
    linkUrl: '/',
    publishedDate: '2026-06-29',
    publishedDateDisplay: '29 June 2026',
  },
  {
    slug: 'services-week-2026',
    title: 'GOV Reuse Library showcased during Services Week 2026',
    summary:
      'Watch the GOV Reuse Library team’s workshop on the library and the new AI search prototype. This interactive session begins with an introduction to the GOV Reuse Library, followed by an exploration of user needs.',
    linkText: 'Watch the GOV Reuse Library Services Week 2026 session',
    linkUrl: 'https://www.youtube.com/watch?v=_ak8fYMVhEw',
    publishedDate: '2026-06-29',
    publishedDateDisplay: '29 June 2026',
  },
  {
    slug: 'ai-search-lower-public-sector-costs',
    title: 'AI-powered search could ‘lower costs across the public sector’',
    summary:
      'The GOV Reuse Library’s AI-powered search prototype “aims to address a common public sector challenge where government teams repeatedly build design components, service patterns and guidance from scratch because they cannot locate existing work developed by other departments”, according to UKAuthority, a specialist public sector IT news provider.',
    linkText: 'Read the UKAuthority article about the GOV Reuse Library AI search prototype',
    linkUrl: 'https://www.ukauthority.com/articles/gov-reuse-library-develops-ai-powered-design-search-tool',
    publishedDate: '2026-06-18',
    publishedDateDisplay: '18 June 2026',
  },
  {
    slug: 'ai-search-ux-scotland',
    title: 'AI search prototype takes centre stage at UX Scotland',
    summary:
      'The GOV Reuse Library team, working with the Ministry of Justice and Red Hat, showcased a new AI-powered prototype at this year’s UX Scotland conference. The proof of concept enables users to search across government design systems using natural language and was made available for three days, allowing attendees to test the tool and share their feedback.',
    linkText: 'View the GOV Reuse Library talk on the UX Scotland programme',
    linkUrl:
      'https://uxscotland.net/programme/could-you-find-it-if-it-already-existed-using-ai-search-make-reuse-easier-across',
    publishedDate: '2026-06-11',
    publishedDateDisplay: '11 June 2026',
  },
  {
    slug: 'ai-search-prototype-feedback',
    title: 'What people are saying about the GOV Reuse Library AI search prototype',
    summary:
      'The GOV Reuse Library’s new AI search prototype is creating quite a buzz. The feature was made available temporarily in June for the UX Scotland conference. In just three days, it recorded 621 searches. The prototype is still a work in progress, but comments left in our feedback survey have been encouraging:',
    quotes: [
      '“Please keep going with this, it’s really useful”',
      '“Keep up the great work!”',
      '“Really great start!”',
      '“Overall this is a great concept and would be very useable for our designers. Great work.”',
      '“I love the idea of this but it will rely on the underlying data being organised in a way that will produce meaningful and full results.”',
    ],
    publishedDate: '2026-06-10',
    publishedDateDisplay: '10 June 2026',
  },
  {
    slug: 'finding-components-without-knowing-their-names',
    title: 'Finding reusable components without knowing their names',
    summary:
      'During a four-week exploration with Red Hat, the GOV Reuse Library team tested how people could find components and patterns across government design systems without needing to know what they were called. The proof of concept allowed people to describe the problem they were trying to solve in their own words and returned potentially relevant reusable resources.',
    linkText: 'Read about our exploration of problem-based search',
    linkUrl:
      'https://mojdigital.blog.gov.uk/2026/06/04/could-you-find-it-if-it-already-existed-making-reuse-easier-across-government-using-ai-search/',
    publishedDate: '2026-06-04',
    publishedDateDisplay: '4 June 2026',
  },
  {
    slug: 'contribute-page-launched',
    title: 'New GOV Reuse Library Contribute page launched',
    summary:
      'Spotted a broken link? Seen out-of-date content? Want to suggest a new resource? You can help keep the GOV Reuse Library useful and up to date by suggesting new resources or updates to existing listings using our new Contribute page.',
    linkText: 'Go to the GOV Reuse Library Contribute page',
    linkUrl: '/contribute',
    publishedDate: '2026-06-04',
    publishedDateDisplay: '4 June 2026',
  },
  {
    slug: 'gov-reuse-library-goes-live',
    title: 'GOV Reuse Library goes live!',
    summary:
      'The GOV Reuse Library is a cross-government initiative that helps teams find and reuse existing design systems, service patterns, tools, guidance and other digital assets. Created by the Ministry of Justice with partners across government, it aims to reduce duplication, improve collaboration, speed up delivery and support more consistent services.',
    linkText: 'Read the GOV Reuse Library launch blog',
    linkUrl: 'https://mojdigital.blog.gov.uk/2025/10/02/introducing-the-gov-reuse-library/',
    publishedDate: '2025-10-02',
    publishedDateDisplay: '2 October 2025',
  },
  {
    slug: 'reuse-by-design-sdingov-2025',
    title: 'Making the case for “reuse by design” at SDinGov 2025',
    summary:
      'Watch Ministry of Justice experts explain how government can reduce duplication by adopting a “reuse by design” culture at Service Design in Government 2025. Discover the Ministry of Justice’s share and reuse strategy, covering reusable infrastructure, service patterns, design systems, common components and cross-government collaboration to unlock savings and improve public services.',
    linkText: 'Watch the “reuse by design” talk from SDinGov 2025',
    linkUrl: 'https://vimeo.com/showcase/12030663?video=1133197526',
    publishedDate: '2025-09-18',
    publishedDateDisplay: '18 September 2025',
  },
]

export const getBlogPosts = (): BlogPost[] =>
  [...blogPosts].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => blogPosts.find(post => post.slug === slug)
