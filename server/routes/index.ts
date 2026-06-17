import { Router } from 'express'

import type { Services } from '../services'
import expressRouterHelpers from '../utils/expressRouterHelpers'
import HomeController from '../controllers/HomeController'
import SearchController from '../controllers/SearchController'
import { asyncHandler } from '../utils/utils'

export default function routes({ infoService, auditService }: Services): Router {
  const router = Router()
  expressRouterHelpers(router)

  const homeController = new HomeController(infoService)
  const searchController = new SearchController(infoService, auditService)

  router.get('/', asyncHandler(homeController.index))
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
