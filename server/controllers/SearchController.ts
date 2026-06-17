import { Request, Response } from 'express'
import BaseController from './BaseController'
import InfoService from '../services/infoService'
import AuditService from '../services/auditService'
import { ContentFilter } from '../@types/filters'
import logger from '../../logger'
import { Component } from '../@types/search'
import externalSearchIndexJson from '../data/generated/externalSearchIndex.json'

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

type RecordSignals = {
  levelLabel: string
  concepts: string[]
}

type ExternalSearchIndexEntry = {
  url: string
  externalTitle?: string
  externalDescription?: string
  externalHeadings?: string[]
  externalComponents?: string[]
  externalComponentEntries?: Array<{ name: string; url: string }>
  externalText?: string
  crawledAt?: string
  crawlStatus?: string
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

export default class SearchController extends BaseController {
  private infoService: InfoService

  private auditService?: AuditService

  private readonly externalIndexByUrl: Map<string, ExternalSearchIndexEntry>

  private readonly stopWords = new Set([
    'a',
    'an',
    'and',
    'for',
    'from',
    'guide',
    'guidance',
    'how',
    'in',
    'of',
    'on',
    'service',
    'services',
    'system',
    'the',
    'to',
    'uk',
  ])

  private readonly synonymMap: Record<string, string[]> = {
    ai: ['artificial', 'intelligence', 'machine', 'learning', 'data', 'science'],
    artificial: ['ai'],
    component: ['components'],
    components: ['component'],
    form: ['forms'],
    forms: ['form'],
    pattern: ['patterns'],
    patterns: ['pattern'],
    date: ['datepicker', 'calendar'],
    picker: ['datepicker', 'calendar'],
    datepicker: ['date', 'picker', 'calendar'],
  }

  constructor(infoService: InfoService, auditService?: AuditService) {
    super()
    this.infoService = infoService
    this.auditService = auditService
    const safeExternalEntries = Array.isArray(externalSearchIndexJson)
      ? (externalSearchIndexJson as ExternalSearchIndexEntry[])
      : []
    this.externalIndexByUrl = new Map(
      safeExternalEntries
        .filter(entry => typeof entry.url === 'string' && entry.url.length > 0)
        .map(entry => [this.getUrlKey(entry.url), entry]),
    )
  }

  private getAllFilters = (): ContentFilter => ({
    department: 'All departments',
    contentType: 'All types',
    profession: 'All professions',
  })

  private mapRecordToComponent = (record: CatalogueRecord): Component => ({
    title: record.title,
    url: record.url,
    description: this.buildSnippet(record),
    parent: record.department,
    accessibility: '',
    created_at: '',
    updated_at: '',
    has_research: false,
    favourites: 0,
  })

  private normaliseTerm = (term: string): string => {
    return term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }

  private stemTerm = (term: string): string => {
    if (term.length <= 3) {
      return term
    }
    return term.replace(/(ing|ed|es|s)$/i, '')
  }

  private getUrlKeywords = (url: string): string[] => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.pathname
        .split('/')
        .map(pathPart => this.normaliseTerm(pathPart.replace(/[-_]+/g, ' ')))
        .filter(Boolean)
    } catch {
      return []
    }
  }

  private getPathSegments = (url: string): string[] => {
    try {
      return new URL(url).pathname
        .split('/')
        .map(segment => this.normaliseTerm(segment.replace(/[-_]+/g, ' ')))
        .filter(Boolean)
    } catch {
      return []
    }
  }

  private getRecordSignals = (record: CatalogueRecord): RecordSignals => {
    const segments = this.getPathSegments(record.url)
    const concepts = new Set<string>()
    let levelLabel = record.contentType

    const addToken = (value: string) => {
      const token = this.normaliseTerm(value)
      if (token.length > 2 && !this.stopWords.has(token)) {
        concepts.add(token)
      }
    }

    segments.forEach(addToken)

    const componentIndex = segments.indexOf('components')
    if (componentIndex >= 0) {
      levelLabel = 'Components'
      if (segments[componentIndex + 1]) {
        addToken(segments[componentIndex + 1])
      }
    }

    const patternIndex = segments.findIndex(segment => segment === 'patterns' || segment === 'service patterns')
    if (patternIndex >= 0) {
      levelLabel = 'Patterns'
      if (segments[patternIndex + 1]) {
        addToken(segments[patternIndex + 1])
      }
    }

    const titleTokens = this.normaliseTerm(record.title).split(/\s+/).filter(Boolean)
    titleTokens.forEach(addToken)

    return {
      levelLabel,
      concepts: Array.from(concepts),
    }
  }

  private expandQueryTerms = (terms: string[]): string[] => {
    const expanded = new Set<string>()
    terms.forEach(term => {
      const token = this.normaliseTerm(term)
      if (!token) {
        return
      }
      expanded.add(token)
      const stem = this.stemTerm(token)
      if (stem) {
        expanded.add(stem)
      }
      const mappedTerms = this.synonymMap[token] || []
      mappedTerms.forEach(mapped => expanded.add(mapped))
    })
    return Array.from(expanded)
  }

  private getSearchableParts = (record: CatalogueRecord): string[] => {
    const signals = this.getRecordSignals(record)
    const externalEntry = this.externalIndexByUrl.get(this.getUrlKey(record.url))
    const externalHeadings = externalEntry?.externalHeadings || []
    const externalComponents = externalEntry?.externalComponents || []
    const externalText = (externalEntry?.externalText || '').slice(0, 5000)
    return [
      record.title,
      record.description,
      record.department,
      record.contentType,
      signals.levelLabel,
      record.profession,
      ...(record.tags || []),
      ...signals.concepts,
      ...this.getUrlKeywords(record.url),
      externalEntry?.externalTitle || '',
      externalEntry?.externalDescription || '',
      ...externalHeadings,
      ...externalComponents,
      externalText,
    ]
  }

  private getTokenSet = (value: string): Set<string> => {
    const words = this.normaliseTerm(value).split(/\s+/).filter(Boolean)
    const stems = words.map(word => this.stemTerm(word))
    return new Set([...words, ...stems].filter(Boolean))
  }

  private buildSnippet = (record: CatalogueRecord): string => {
    const signals = this.getRecordSignals(record)
    return `${signals.levelLabel} - ${record.description}`
  }

  private getTitleKey = (title: string): string => {
    return this.normaliseTerm(title)
  }

  private getUrlKey = (url: string): string => {
    try {
      const parsedUrl = new URL(url)
      const path = parsedUrl.pathname.replace(/\/+$/, '').toLowerCase()
      return `${parsedUrl.hostname.toLowerCase()}${path}`
    } catch {
      return url.toLowerCase()
    }
  }

  private getDomain = (url: string): string => {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return 'unknown-domain'
    }
  }

  private applyDiversity = (
    scored: ScoredRecord[],
    options: { maxPerDomain: number; maxPerDepartment: number; maxPerTitle: number },
  ): CatalogueRecord[] => {
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

  private scoreRecord = (record: CatalogueRecord, terms: string[], phrase: string): number => {
    const title = record.title.toLowerCase()
    const description = record.description.toLowerCase()
    const allText = this.getSearchableParts(record).join(' ').toLowerCase()
    const titleTokenSet = this.getTokenSet(title)
    const descriptionTokenSet = this.getTokenSet(description)
    const tokenSet = this.getTokenSet(allText)
    const signals = this.getRecordSignals(record)
    const conceptSet = new Set(signals.concepts.map(concept => this.normaliseTerm(concept)))
    const externalEntry = this.externalIndexByUrl.get(this.getUrlKey(record.url))
    const externalText = [
      externalEntry?.externalTitle || '',
      externalEntry?.externalDescription || '',
      ...(externalEntry?.externalHeadings || []),
      ...(externalEntry?.externalComponents || []),
      externalEntry?.externalText || '',
    ]
      .join(' ')
      .toLowerCase()
    const phraseStem = this.stemTerm(phrase)
    const phraseIsShort = phrase.length <= 4
    const phraseInTitle = phraseIsShort
      ? titleTokenSet.has(phrase) || (phraseStem ? titleTokenSet.has(phraseStem) : false)
      : title.includes(phrase)
    const phraseInDescription = phraseIsShort
      ? descriptionTokenSet.has(phrase) || (phraseStem ? descriptionTokenSet.has(phraseStem) : false)
      : description.includes(phrase)
    const phraseInAllText = phraseIsShort
      ? tokenSet.has(phrase) || (phraseStem ? tokenSet.has(phraseStem) : false)
      : allText.includes(phrase)

    let score = 0
    if (phrase.length >= 3) {
      if (phraseInTitle) {
        score += 25
      }
      if (phraseInDescription) {
        score += 12
      }
      if (phraseInAllText) {
        score += 6
      }
    }

    for (const term of terms) {
      const termStem = this.stemTerm(term)
      const isShortTerm = term.length <= 4
      const titleHasToken = titleTokenSet.has(term) || (termStem ? titleTokenSet.has(termStem) : false)
      const descriptionHasToken =
        descriptionTokenSet.has(term) || (termStem ? descriptionTokenSet.has(termStem) : false)
      const textHasToken = tokenSet.has(term) || (termStem ? tokenSet.has(termStem) : false)
      const titleHasMatch = isShortTerm ? titleHasToken : title.includes(term) || titleHasToken
      const descriptionHasMatch = isShortTerm ? descriptionHasToken : description.includes(term) || descriptionHasToken
      const textHasMatch = isShortTerm ? textHasToken : allText.includes(term) || textHasToken

      if (titleHasMatch) {
        score += 14
      }
      if (descriptionHasMatch) {
        score += 8
      }
      if (textHasMatch) {
        score += 4
      }
      if (termStem && tokenSet.has(termStem)) {
        score += 3
      }
      if (conceptSet.has(term) || (termStem && conceptSet.has(termStem))) {
        score += 10
      }
      if (externalText.includes(term)) {
        score += 5
      }
    }
    return score
  }

  private matchDesignSystemComponents = async (query: string): Promise<DesignSystemComponentMatch[]> => {
    const filters = this.getAllFilters()
    const designSystems = await this.infoService.getDesignSystems(filters)
    const normalisedPhrase = this.normaliseTerm(query)
    const expandedTerms = this.expandQueryTerms(
      normalisedPhrase
        .split(/\s+/)
        .map(term => this.normaliseTerm(term))
        .filter(Boolean),
    )

    const matches: Array<DesignSystemComponentMatch & { score: number }> = []
    designSystems.forEach(system => {
      const entry = this.externalIndexByUrl.get(this.getUrlKey(system.url))
      const componentEntries = entry?.externalComponentEntries || []
      componentEntries.forEach(component => {
        const name = this.normaliseTerm(component.name)
        if (!name) {
          return
        }

        let score = 0
        if (normalisedPhrase.length >= 3 && name.includes(normalisedPhrase)) {
          score += 20
        }

        expandedTerms.forEach(term => {
          const stem = this.stemTerm(term)
          if (name.includes(term)) {
            score += 8
          }
          if (stem && name.includes(stem)) {
            score += 4
          }
        })

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
      })
    })

    const seen = new Set<string>()
    const deduped = matches
      .sort((a, b) => b.score - a.score || a.sourceTitle.localeCompare(b.sourceTitle))
      .filter(match => {
        const key = `${this.normaliseTerm(match.componentName)}|${this.normaliseTerm(match.sourceTitle)}`
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })

    return deduped.map(({ score, ...rest }) => rest)
  }

  private aggregateComponentMatches = (matches: DesignSystemComponentMatch[]): AggregatedComponentMatch[] => {
    const grouped = new Map<string, AggregatedComponentMatch>()

    matches.forEach(match => {
      const key = this.normaliseTerm(match.componentName)
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
        return
      }

      const sourceKey = `${this.normaliseTerm(match.sourceTitle)}|${this.getUrlKey(match.componentUrl)}`
      const hasSource = existing.sources.some(
        source => `${this.normaliseTerm(source.sourceTitle)}|${this.getUrlKey(source.componentUrl)}` === sourceKey,
      )
      if (!hasSource) {
        existing.sources.push({
          sourceTitle: match.sourceTitle,
          sourceUrl: match.sourceUrl,
          department: match.department,
          componentUrl: match.componentUrl,
        })
      }
    })

    return Array.from(grouped.values()).sort(
      (a, b) => b.sources.length - a.sources.length || a.componentName.localeCompare(b.componentName),
    )
  }

  private searchLocalCatalogue = async (
    query: string,
    options = { maxPerDomain: 4, maxPerDepartment: 4, maxPerTitle: 1 },
  ): Promise<Component[]> => {
    const allFilters = this.getAllFilters()
    const catalogue = [
      ...(await this.infoService.getDesignSystems(allFilters)),
      ...(await this.infoService.getManuals(allFilters)),
      ...(await this.infoService.getProducts(allFilters)),
      ...(await this.infoService.getServicePatterns(allFilters)),
      ...(await this.infoService.getStandards(allFilters)),
      ...(await this.infoService.getStyleGuides(allFilters)),
    ] as CatalogueRecord[]

    const phrase = this.normaliseTerm(query)
    const rawTerms = phrase
      .split(/\s+/)
      .map(term => this.normaliseTerm(term))
      .filter(term => term.length > 0)
    const terms = this.expandQueryTerms(rawTerms)

    const scored: ScoredRecord[] = catalogue
      .map(item => ({ item, score: this.scoreRecord(item, terms, phrase) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))

    const diversified = this.applyDiversity(scored, options)
    return diversified.map(item => this.mapRecordToComponent(item))
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

    if (query.length < 2) {
      formError = 'Input must be at least 2 characters long'
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
    const searchResults = {
      message: 'Showing catalogue matches from GOV Reuse Library content',
      components: await this.searchLocalCatalogue(query),
    }
    const servicePatterns = await this.infoService.getServicePatterns(filters)
    const styleGuides = await this.infoService.getStyleGuides(filters)
    const props = {
      formError,
      searchQuery: query,
      // Search results
      components: searchResults.components,
      message: searchResults.message,
      // Catalogue recommendations
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

  suggest = async (req: Request, res: Response) => {
    if (typeof req.query.searchQuery !== 'string') {
      return res.status(400).json({ results: [] })
    }

    const query = req.query.searchQuery.trim()
    if (query.length < 2) {
      return res.status(200).json({ results: [] })
    }

    const componentMatches = await this.matchDesignSystemComponents(query)
    const aggregatedMatches = this.aggregateComponentMatches(componentMatches)
    const componentResults = aggregatedMatches.slice(0, 8).map(match => ({
      title: match.componentName,
      url: match.componentUrl,
      parent: match.sources[0]?.department || '',
      description:
        match.sources.length > 1
          ? `Component available in ${match.sources.length} design systems`
          : `Component from ${match.sources[0]?.sourceTitle || 'design system'}`,
    }))

    const suggestionOptions = { maxPerDomain: 2, maxPerDepartment: 2, maxPerTitle: 1 }
    const catalogueResults = (await this.searchLocalCatalogue(query, suggestionOptions)).map(component => ({
      title: component.title,
      url: component.url,
      parent: component.parent,
      description: component.description,
    }))

    const seenSuggestionUrls = new Set<string>()
    const mergedResults = [...componentResults, ...catalogueResults].filter(result => {
      const key = this.getUrlKey(result.url)
      if (seenSuggestionUrls.has(key)) {
        return false
      }
      seenSuggestionUrls.add(key)
      return true
    })

    return res.status(200).json({ results: mergedResults.slice(0, 8) })
  }

  designSystemComponents = async (req: Request, res: Response) => {
    const filters = this.getAllFilters()
    const designSystems = await this.infoService.getDesignSystems(filters)
    const sourceFilter = typeof req.query.source === 'string' ? this.normaliseTerm(req.query.source) : ''

    const list = designSystems
      .map(item => {
        const entry = this.externalIndexByUrl.get(this.getUrlKey(item.url))
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
        const haystack = this.normaliseTerm(`${item.title} ${item.url}`)
        return haystack.includes(sourceFilter)
      })

    return res.status(200).json({ results: list })
  }

  designSystemComponentSearch = async (req: Request, res: Response) => {
    if (typeof req.query.component !== 'string' || req.query.component.trim().length < 2) {
      return res.status(400).json({ results: [] })
    }

    const matches = await this.matchDesignSystemComponents(req.query.component)
    const deduped = this.aggregateComponentMatches(matches)
    return res.status(200).json({ results: deduped })
  }
}
