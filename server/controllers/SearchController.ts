/**
 * @fileoverview SearchController - HTTP request handler for search operations
 * @module SearchController
 * Handles incoming search HTTP requests and delegates to service layer for business logic.
 * Thin controller focused on request/response handling; logic delegated to services.
 * @example
 * // Inject services in routes
 * const controller = new SearchController(infoService, auditService, searchScoringService, queryExpansionService, searchIndexRepository)
 * router.get('/search-suggest', asyncHandler(controller.suggest))
 */

import { Request, Response } from 'express'
import BaseController from './BaseController'
import InfoService from '../services/infoService'
import AuditService from '../services/auditService'
import SearchScoringService from '../services/searchScoringService'
import QueryExpansionService from '../services/queryExpansionService'
import SearchIndexRepository from '../data/searchIndexRepository'
import { ContentFilter } from '../@types/filters'
import logger from '../../logger'
import { Component } from '../@types/search'

type CatalogueRecord = {
  title: string
  description: string
  url: string
  department: string
  contentType: string
  profession: string
  tags?: string[]
}

type ScoredRecord = {
  item: CatalogueRecord
  score: number
}

type DesignSystemComponentMatch = {
  componentName: string
  componentUrl: string
  sourceTitle: string
  sourceUrl: string
  department: string
}

type AggregatedComponentMatch = {
  componentName: string
  componentUrl: string
  sources: Array<{
    sourceTitle: string
    sourceUrl: string
    department: string
    componentUrl: string
  }>
}

/**
 * Search controller for handling HTTP search requests.
 * Coordinates between HTTP layer, services, and data access.
 * @extends BaseController
 */
export default class SearchController extends BaseController {
  private infoService: InfoService

  private auditService?: AuditService

  private scoringService: SearchScoringService

  private queryExpansionService: QueryExpansionService

  private searchIndexRepository: SearchIndexRepository

  /**
   * Initialise controller with required services.
   * @param infoService - Service for accessing catalogue data
   * @param auditService - Optional service for logging audit events
   * @param scoringService - Service for scoring search results
   * @param queryExpansionService - Service for query expansion and stemming
   * @param searchIndexRepository - Repository for accessing external indices
   */
  constructor(
    infoService: InfoService,
    auditService: AuditService | undefined,
    scoringService: SearchScoringService,
    queryExpansionService: QueryExpansionService,
    searchIndexRepository: SearchIndexRepository,
  ) {
    super()
    this.infoService = infoService
    this.auditService = auditService
    this.scoringService = scoringService
    this.queryExpansionService = queryExpansionService
    this.searchIndexRepository = searchIndexRepository
  }

  private getAllFilters = (): ContentFilter => ({
    department: 'All departments',
    contentType: 'All types',
    profession: 'All professions',
  })

  /**
   * Map catalogue record to component response format.
   * @param record - Catalogue record to map
   * @returns Component response object
   * @private
   */
  private mapRecordToComponent(record: CatalogueRecord): Component {
    const signals = this.extractRecordSignals(record)
    const { levelLabel } = signals
    const snippet = `${levelLabel} - ${record.description}`

    return {
      title: record.title,
      url: record.url,
      description: snippet,
      parent: record.department,
      accessibility: '',
      created_at: '',
      updated_at: '',
      has_research: false,
      favourites: 0,
    }
  }

  /**
   * Extract signals from catalogue record (level, concepts from URL/title).
   * @param record - Catalogue record
   * @returns Record signals object
   * @private
   */
  private extractRecordSignals(record: CatalogueRecord): { levelLabel: string; concepts: string[] } {
    const concepts = new Set<string>()
    let levelLabel = record.contentType

    try {
      const url = new URL(record.url)
      const segments = url.pathname
        .split('/')
        .map(seg => seg.toLowerCase().replace(/[-_]/g, ' ').trim())
        .filter(Boolean)

      const componentIndex = segments.indexOf('components')
      if (componentIndex >= 0) {
        levelLabel = 'Components'
        if (segments[componentIndex + 1]) {
          concepts.add(segments[componentIndex + 1])
        }
      }

      const patternIndex = segments.findIndex(seg => seg === 'patterns' || seg === 'service patterns')
      if (patternIndex >= 0) {
        levelLabel = 'Patterns'
        if (segments[patternIndex + 1]) {
          concepts.add(segments[patternIndex + 1])
        }
      }
    } catch {
      // Invalid URL, skip signal extraction
    }

    return {
      levelLabel,
      concepts: Array.from(concepts),
    }
  }

  /**
   * Normalise URL to canonical form for lookups.
   * @param url - URL to normalise
   * @returns Canonical URL key
   * @private
   */
  private getUrlKey(url: string): string {
    try {
      const parsedUrl = new URL(url)
      const path = parsedUrl.pathname.replace(/\/+$/, '').toLowerCase()
      return `${parsedUrl.hostname.toLowerCase()}${path}`
    } catch {
      return url.toLowerCase()
    }
  }

  /**
   * Get domain from URL.
   * @param url - URL to extract domain from
   * @returns Domain name
   * @private
   */
  private getDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return 'unknown-domain'
    }
  }

  /**
   * Normalise title to comparison key.
   * @param title - Title to normalise
   * @returns Normalised key
   * @private
   */
  private getTitleKey(title: string): string {
    return title.toLowerCase().trim()
  }

  /**
   * Apply diversity constraints to scored results.
   * Limits results per domain, department, and title to improve variety.
   * @param scored - Scored records to filter
   * @param options - Diversity constraints
   * @returns Filtered records respecting constraints
   * @private
   */
  private applyDiversity(
    scored: ScoredRecord[],
    options: { maxPerDomain: number; maxPerDepartment: number; maxPerTitle: number },
  ): CatalogueRecord[] {
    const seenUrlKeys = new Set<string>()
    const domainCount: Record<string, number> = {}
    const departmentCount: Record<string, number> = {}
    const titleCount: Record<string, number> = {}
    const selected: CatalogueRecord[] = []

    for (const result of scored) {
      const urlKey = this.getUrlKey(result.item.url)
      const domain = this.getDomain(result.item.url)
      const department = result.item.department.toLowerCase()
      const titleKey = this.getTitleKey(result.item.title)

      const isUniqueUrl = !seenUrlKeys.has(urlKey)
      const withinDomainLimit = (domainCount[domain] || 0) < options.maxPerDomain
      const withinDepartmentLimit = (departmentCount[department] || 0) < options.maxPerDepartment
      const withinTitleLimit = (titleCount[titleKey] || 0) < options.maxPerTitle

      if (isUniqueUrl && withinDomainLimit && withinDepartmentLimit && withinTitleLimit) {
        seenUrlKeys.add(urlKey)
        domainCount[domain] = (domainCount[domain] || 0) + 1
        departmentCount[department] = (departmentCount[department] || 0) + 1
        titleCount[titleKey] = (titleCount[titleKey] || 0) + 1
        selected.push(result.item)
      }
    }

    return selected
  }

  /**
   * Search for matching components across design systems.
   * @param query - Search query
   * @returns Array of component matches
   * @private
   */
  private async matchDesignSystemComponents(query: string): Promise<DesignSystemComponentMatch[]> {
    const filters = this.getAllFilters()
    const designSystems = await this.infoService.getDesignSystems(filters)
    const expandedTerms = this.queryExpansionService.expandQueryTerms(query.split(/\s+/).filter(Boolean))

    const matches: Array<DesignSystemComponentMatch & { score: number }> = []

    for (const system of designSystems) {
      const entry = this.searchIndexRepository.getEntryByUrl(system.url)
      const componentEntries = entry?.externalComponentEntries || []

      for (const component of componentEntries) {
        const normalised = component.name.toLowerCase()
        let score = 0

        // Phrase match
        if (query.length >= 3 && normalised.includes(query.toLowerCase())) {
          score += 20
        }

        // Term matching
        for (const term of expandedTerms) {
          if (normalised.includes(term)) {
            score += 8
          }
        }

        if (score > 0) {
          matches.push({
            componentName: component.name,
            componentUrl: component.url || system.url,
            sourceTitle: system.title,
            sourceUrl: system.url,
            department: system.department,
            score,
          })
        }
      }
    }

    // Deduplicate by component name and source title
    const seen = new Set<string>()
    const deduped = matches
      .sort((a, b) => b.score - a.score || a.sourceTitle.localeCompare(b.sourceTitle))
      .filter(match => {
        const key = `${match.componentName.toLowerCase()}|${match.sourceTitle.toLowerCase()}`
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })

    return deduped.map(({ score, ...rest }) => rest)
  }

  /**
   * Aggregate component matches by name, grouping all sources.
   * @param matches - Component matches to aggregate
   * @returns Aggregated matches with source arrays
   * @private
   */
  private aggregateComponentMatches(matches: DesignSystemComponentMatch[]): AggregatedComponentMatch[] {
    const grouped = new Map<string, AggregatedComponentMatch>()

    for (const match of matches) {
      const key = match.componentName.toLowerCase()
      const existing = grouped.get(key)

      if (!existing) {
        grouped.set(key, {
          componentName: match.componentName,
          componentUrl: match.componentUrl,
          sources: [
            {
              sourceTitle: match.sourceTitle,
              sourceUrl: match.sourceUrl,
              department: match.department,
              componentUrl: match.componentUrl,
            },
          ],
        })
      } else {
        // Check if source already exists
        const sourceKey = `${match.sourceTitle.toLowerCase()}|${this.getUrlKey(match.componentUrl)}`
        const hasSource = existing.sources.some(
          source => `${source.sourceTitle.toLowerCase()}|${this.getUrlKey(source.componentUrl)}` === sourceKey,
        )

        if (!hasSource) {
          existing.sources.push({
            sourceTitle: match.sourceTitle,
            sourceUrl: match.sourceUrl,
            department: match.department,
            componentUrl: match.componentUrl,
          })
        }
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.sources.length - a.sources.length || a.componentName.localeCompare(b.componentName),
    )
  }

  /**
   * Search the local catalogue with the provided query.
   * @param query - Search query
   * @param options - Diversity options
   * @returns Array of matching catalogue components
   * @private
   */
  private async searchLocalCatalogue(
    query: string,
    options = { maxPerDomain: 4, maxPerDepartment: 4, maxPerTitle: 1 },
  ): Promise<Component[]> {
    const allFilters = this.getAllFilters()
    const catalogue = [
      ...(await this.infoService.getDesignSystems(allFilters)),
      ...(await this.infoService.getManuals(allFilters)),
      ...(await this.infoService.getProducts(allFilters)),
      ...(await this.infoService.getServicePatterns(allFilters)),
      ...(await this.infoService.getStandards(allFilters)),
      ...(await this.infoService.getStyleGuides(allFilters)),
    ] as CatalogueRecord[]

    const phrase = query.toLowerCase().trim()
    const rawTerms = phrase.split(/\s+/).filter(term => term.length > 0)
    const terms = this.queryExpansionService.expandQueryTerms(rawTerms)

    // Score each record
    const scored: ScoredRecord[] = catalogue
      .map(item => {
        const externalEntry = this.searchIndexRepository.getEntryByUrl(item.url)
        const externalText = externalEntry?.externalText?.slice(0, 5000)
        const score = this.scoringService.scoreRecord(item, terms, phrase, externalText)
        return { item, score }
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))

    // Apply diversity constraints
    const diversified = this.applyDiversity(scored, options)
    return diversified.map(item => this.mapRecordToComponent(item))
  }

  /**
   * GET / - Display search landing page.
   * @param req - Express request object
   * @param res - Express response object
   * @returns Renders search index page with recommendations
   */
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
      departmentFilters: await this.infoService.getDepartmentFilters(),
      contentTypeFilters: await this.infoService.getContentTypesFilters(),
      professionFilters: await this.infoService.getProfessionsFilters(),
    }
    return res.render('pages/search/index', { props })
  }

  /**
   * GET /search-results - Full page search with filters and results.
   * @param req - Express request with searchQuery parameter
   * @param res - Express response object
   * @returns Renders search results page or validation errors
   */
  search = async (req: Request, res: Response) => {
    let formError = ''

    if (typeof req.query.searchQuery !== 'string') {
      formError = 'Invalid data type for search query'
      return res.status(422).render('pages/search/index', { props: { formError, searchQuery: '' } })
    }

    const query = req.query.searchQuery

    // Log and audit search query
    if (query.length > 0) {
      logger.info(
        {
          eventType: 'SEARCH_QUERY_SUBMITTED',
          searchQuery: query,
          searchQueryLength: query.length,
        },
        'Search phrase submitted',
      )

      if (this.auditService) {
        try {
          await this.auditService.logAuditEvent({
            what: 'SEARCH_QUERY_SUBMITTED',
            who: req.user?.username || 'anonymous',
            subjectType: 'SEARCH',
            correlationId: req.id,
            details: {
              searchQuery: query,
              searchQueryLength: query.length,
            },
          })
        } catch (error) {
          logger.warn({ error, eventType: 'SEARCH_QUERY_AUDIT_FAILED' }, 'Search query audit event failed')
        }
      }
    }

    // Validate query length
    if (query.length === 0) {
      formError = 'Please enter a description'
    } else if (query.length < 2) {
      formError = 'Input must be at least 2 characters long'
    }

    if (formError.length > 0) {
      return res.status(422).render('pages/search/index', { props: { formError, searchQuery: query } })
    }

    // Execute search
    const filters: ContentFilter = {
      department: (req.query.department as string) || '',
      contentType: (req.query.contentType as string) || '',
      profession: (req.query.profession as string) || '',
    }

    const searchResults = {
      message: 'Showing catalogue matches from GOV Reuse Library content',
      components: await this.searchLocalCatalogue(query),
    }

    const servicePatterns = await this.infoService.getServicePatterns(filters)
    const styleGuides = await this.infoService.getStyleGuides(filters)

    const props = {
      formError,
      searchQuery: query,
      components: searchResults.components,
      message: searchResults.message,
      servicePatterns: servicePatterns.slice(0, 3),
      styleGuides: styleGuides.slice(0, 3),
      departmentFilters: await this.infoService.getDepartmentFilters(),
      contentTypeFilters: await this.infoService.getContentTypesFilters(),
      professionFilters: await this.infoService.getProfessionsFilters(),
      filters,
      removeFilters: `/search-results/?${new URLSearchParams({ searchQuery: query }).toString()}`,
      removeContentTypeLink: `/search-results/?${new URLSearchParams({
        ...filters,
        searchQuery: query,
        contentType: '',
      }).toString()}`,
      removeDepartmentLink: `/search-results/?${new URLSearchParams({
        ...filters,
        searchQuery: query,
        department: '',
      }).toString()}`,
      removeProfessionLink: `/search-results/?${new URLSearchParams({
        ...filters,
        searchQuery: query,
        profession: '',
      }).toString()}`,
    }

    return res.status(200).render('pages/search/index', { props })
  }

  /**
   * GET /search-suggest - Autocomplete suggestions for search input.
   * Returns merged component and catalogue matches.
   * @param req - Express request with searchQuery parameter
   * @param res - Express response object (JSON)
   * @returns JSON with results array
   */
  suggest = async (req: Request, res: Response) => {
    if (typeof req.query.searchQuery !== 'string') {
      return res.status(400).json({ results: [] })
    }

    const query = req.query.searchQuery.trim()
    if (query.length < 2) {
      return res.status(200).json({ results: [] })
    }

    // Get component matches from design systems
    const componentMatches = await this.matchDesignSystemComponents(query)
    const aggregatedMatches = this.aggregateComponentMatches(componentMatches)

    const componentResults = aggregatedMatches
      .flatMap(match =>
        match.sources.map(source => ({
          title: match.componentName,
          url: source.componentUrl,
          parent: source.sourceTitle,
          description: `${match.componentName} from ${source.sourceTitle}`,
        })),
      )
      .slice(0, 12)

    // Get catalogue matches
    const suggestionOptions = { maxPerDomain: 2, maxPerDepartment: 2, maxPerTitle: 1 }
    const catalogueResults = (await this.searchLocalCatalogue(query, suggestionOptions)).map(component => ({
      title: component.title,
      url: component.url,
      parent: component.parent,
      description: component.description,
    }))

    // Merge and deduplicate by URL
    const seenSuggestionUrls = new Set<string>()
    const mergedResults = [...componentResults, ...catalogueResults].filter(result => {
      const key = this.getUrlKey(result.url)
      if (seenSuggestionUrls.has(key)) {
        return false
      }
      seenSuggestionUrls.add(key)
      return true
    })

    return res.status(200).json({ results: mergedResults.slice(0, 15) })
  }

  /**
   * GET /design-system-components - List all design systems with their components.
   * @param req - Express request with optional source filter
   * @param res - Express response object (JSON)
   * @returns JSON with design systems and component listings
   */
  designSystemComponents = async (req: Request, res: Response) => {
    const filters = this.getAllFilters()
    const designSystems = await this.infoService.getDesignSystems(filters)
    const sourceFilter = typeof req.query.source === 'string' ? req.query.source.toLowerCase().trim() : ''

    const list = designSystems
      .map(item => {
        const entry = this.searchIndexRepository.getEntryByUrl(item.url)
        const components = (entry?.externalComponentEntries || []).map(component => ({
          name: component.name,
          url: component.url,
        }))
        return {
          title: item.title,
          url: item.url,
          department: item.department,
          components,
          componentCount: components.length,
          crawledAt: entry?.crawledAt || '',
          crawlStatus: entry?.crawlStatus || 'not-indexed',
        }
      })
      .filter(item => {
        if (!sourceFilter) {
          return true
        }
        const haystack = `${item.title} ${item.url}`.toLowerCase()
        return haystack.includes(sourceFilter)
      })

    return res.status(200).json({ results: list })
  }

  /**
   * GET /design-system-component-search - Search for a component across all design systems.
   * @param req - Express request with component query parameter
   * @param res - Express response object (JSON)
   * @returns JSON with aggregated component matches (deduplicated by name)
   */
  designSystemComponentSearch = async (req: Request, res: Response) => {
    if (typeof req.query.component !== 'string' || req.query.component.trim().length < 2) {
      return res.status(400).json({ results: [] })
    }

    const matches = await this.matchDesignSystemComponents(req.query.component)
    const deduped = this.aggregateComponentMatches(matches)
    return res.status(200).json({ results: deduped })
  }
}
