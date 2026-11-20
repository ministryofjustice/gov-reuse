import { Request, Response } from 'express'
import BaseController from './BaseController'

export default class CookiePreferencesController extends BaseController {
  index = async (req: Request, res: Response) => {
    return res.render('pages/cookies')
  }
}
