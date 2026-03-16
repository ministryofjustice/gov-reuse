import { Request, Response } from 'express'
import BaseController from './BaseController'
import InfoService from '../services/infoService'
import {ContentFilter} from '../@types/filters'

export default class HomeController extends BaseController {
  private infoService: InfoService

  constructor(infoService: InfoService) {
    super()
    this.infoService = infoService
  }

  index = async (req: Request, res: Response) => {
    const filters: ContentFilter = {
      department: req.query.department as string || '',
      contentType: req.query.contentType as string || '',
      profession: req.query.profession as string || '',
    }
    const props = {
      // content
      designSystems: await this.infoService.getDesignSystems(filters),
      manuals: await this.infoService.getManuals(filters),
      products: await this.infoService.getProducts(filters),
      servicePatterns: await this.infoService.getServicePatterns(filters),
      standards: await this.infoService.getStandards(filters),
      styleGuides: await this.infoService.getStyleGuides(filters),
      // filters
      departmentFilters: await this.infoService.getDepartmentFilters(),
      contentTypeFilters: await this.infoService.getContentTypesFilters(),
      professionFilters: await this.infoService.getProfessionsFilters(),
      // active filters
      filters,
      // reset filter links
      removeContentTypeLink: '/?' + new URLSearchParams({ ...filters, contentType: '' }).toString(),
      removeDepartmentLink: '/?' + new URLSearchParams({...filters, department: '' }).toString(),
      removeProfessionLink: '/?' + new URLSearchParams({...filters, profession: '' }).toString(),
    }

    return res.render('pages/index', {props})
  }
}
