import BaseController from './BaseController'
import { Request, Response } from 'express'

export default class CookiePreferencesController extends BaseController {
  index = async (req: Request, res: Response) => {
    return res.render('pages/cookies')
  }
}
