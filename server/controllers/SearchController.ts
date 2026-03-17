import { Request, Response } from 'express'
import BaseController from './BaseController'
import SearchService from '../services/searchService'
import InfoService from '../services/infoService'
import { ContentFilter } from '../@types/filters'

export default class SearchController extends BaseController {
  private searchService: SearchService

  private infoService: InfoService

  constructor(searchService: SearchService, infoService: InfoService) {
    super()
    this.searchService = searchService
    this.infoService = infoService
  }

  index = async (req: Request, res: Response) => {
    const filters: ContentFilter = {
      department: 'All departments',
      contentType: 'All types',
      profession: 'All professions',
    }
    const servicePatterns = await this.infoService.getServicePatterns(filters)
    const styleGuides = await this.infoService.getStyleGuides(filters)
    const props = {
      servicePatterns: servicePatterns.slice(0, 3),
      styleGuides: styleGuides.slice(0, 3),
      // filters
      departmentFilters: await this.infoService.getDepartmentFilters(),
      contentTypeFilters: await this.infoService.getContentTypesFilters(),
      professionFilters: await this.infoService.getProfessionsFilters(),
    }
    return res.render('pages/search/index', { props })
  }

  search = async (req: Request, res: Response) => {
    let formError = ''
    // ensure search query is a string before validating length, to avoid type confusion.
    if (typeof req.query.searchQuery !== 'string') {
      formError = 'Invalid data type for search query'
      return res.status(422).render('pages/search/index', { props: { formError, searchQuery: '' } })
    }
    const query = req.query.searchQuery
    if (query.length < 10) {
      formError = 'Input must be at least 10 characters long'
    }
    if (query.length === 0) {
      formError = 'Please enter a description'
    }
    if (formError.length > 0) {
      return res.status(422).render('pages/search/index', { props: { formError, searchQuery: query } })
    }

    const filters: ContentFilter = {
      department: (req.query.department as string) || '',
      contentType: (req.query.contentType as string) || '',
      profession: (req.query.profession as string) || '',
    }
    const searchResults = await this.searchService.search(query)
    const servicePatterns = await this.infoService.getServicePatterns(filters)
    const styleGuides = await this.infoService.getStyleGuides(filters)
    const props = {
      formError,
      searchQuery: query,
      // Search results
      components: searchResults.components,
      message: searchResults.message,
      // Data to be replaced with search results from the search service
      servicePatterns: servicePatterns.slice(0, 3),
      styleGuides: styleGuides.slice(0, 3),
      // filters
      departmentFilters: await this.infoService.getDepartmentFilters(),
      contentTypeFilters: await this.infoService.getContentTypesFilters(),
      professionFilters: await this.infoService.getProfessionsFilters(),
      // active filters
      filters,
      // reset filter links
      removeFilters: `/search-results/?${new URLSearchParams({ searchQuery: query }).toString()}`,
      removeContentTypeLink: `/search-results/?${new URLSearchParams({ ...filters, searchQuery: query, contentType: '' }).toString()}`,
      removeDepartmentLink: `/search-results/?${new URLSearchParams({ ...filters, searchQuery: query, department: '' }).toString()}`,
      removeProfessionLink: `/search-results/?${new URLSearchParams({ ...filters, searchQuery: query, profession: '' }).toString()}`,
    }

    return res.status(200).render('pages/search/index', { props })
  }
}
