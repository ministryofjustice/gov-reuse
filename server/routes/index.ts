import { Router } from 'express'

import type { Services } from '../services'

export default function routes({ exampleService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    const currentTime = await exampleService.getCurrentTime()
    return res.render('pages/index', { currentTime })
  })

  return router
}
