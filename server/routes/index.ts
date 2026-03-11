import { Router } from 'express'

import type { Services } from '../services'
import expressRouterHelpers from '../utils/expressRouterHelpers'

export default function routes({ exampleService }: Services): Router {
  const router = Router()
  expressRouterHelpers(router)

  router.get('/', async (req, res, next) => {
    const currentTime = await exampleService.getCurrentTime()
    return res.render('pages/index', { currentTime })
  })

  router.markdown('/about', 'about')
  router.markdown('/accessibility-statement', 'accessibility-statement')
  router.markdown('/cookies', 'cookies')
  router.markdown('/privacy', 'privacy')
  router.markdown('/sitemap', 'sitemap')

  // Redirect old URLs to new ones
  router.redirect('/about.html', '/about', 301)

  return router
}
