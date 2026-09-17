import { Router } from 'express'

import type { Services } from '../services'

import expressRouterHelpers from '../utils/expressRouterHelpers'

import HomeController from '../controllers/HomeController'

import NewsController from '../controllers/NewsController'

import SearchController from '../controllers/SearchController'

import SearchScoringService from '../services/searchScoringService'

import QueryExpansionService from '../services/queryExpansionService'

import SearchIndexRepository from '../data/searchIndexRepository'

import { getBlogPosts } from '../data/blogPosts'

import { asyncHandler } from '../utils/utils'

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, character => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }

    return entities[character]
  })

export default function routes({ infoService, auditService }: Services): Router {
  const router = Router()

  expressRouterHelpers(router)

  const homeController = new HomeController(infoService)

  const newsController = new NewsController()

  // Instantiate new services for search

  const queryExpansionService = new QueryExpansionService()

  const searchScoringService = new SearchScoringService(queryExpansionService)

  const searchIndexRepository = new SearchIndexRepository()

  const searchController = new SearchController(
    infoService,
    auditService,
    searchScoringService,
    queryExpansionService,
    searchIndexRepository,
  )

  router.get('/', asyncHandler(homeController.index))

  router.get('/new-starter-guide', (_req, res) => {
    res.render('pages/new-starter-guide')
  })

  router.get('/news', asyncHandler(newsController.index))

  router.get('/news/rss.xml', (_req, res) => {
    const baseUrl = 'https://reuselibrary.service.justice.gov.uk'
    const posts = getBlogPosts()

    const items = posts
      .map(post => {
        const postUrl = `${baseUrl}/news/${post.slug}`
        const publishedDate = new Date(`${post.publishedDate}T00:00:00Z`).toUTCString()

        return `
          <item>
            <title>${escapeXml(post.title)}</title>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <description>${escapeXml(post.summary)}</description>
            <pubDate>${publishedDate}</pubDate>
          </item>
        `
      })
      .join('')

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>GOV Reuse Library - What's new</title>
          <link>${baseUrl}/news</link>
          <description>Updates from the GOV Reuse Library.</description>
          ${items}
        </channel>
      </rss>`

    res.type('application/rss+xml').send(rss)
  })

  router.get('/news/:slug', asyncHandler(newsController.post))

  router.get('/search', asyncHandler(searchController.index))

  router.get('/search-suggest', asyncHandler(searchController.suggest))

  router.get('/search-results', asyncHandler(searchController.search))

  router.get('/design-system-components', asyncHandler(searchController.designSystemComponents))

  router.get('/design-system-component-search', asyncHandler(searchController.designSystemComponentSearch))

  router.markdown('/about', 'about')

  router.markdown('/contribute', 'contribute')

  router.markdown('/accessibility-statement', 'accessibility-statement')

  router.markdown('/cookies', 'cookies')

  router.markdown('/privacy', 'privacy')

  router.markdown('/sitemap', 'sitemap')

  // Redirect old URLs to new ones

  router.redirect('/about.html', '/about', 301)

  return router
}
