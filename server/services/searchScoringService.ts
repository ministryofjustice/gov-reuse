/**
 * @fileoverview SearchScoringService - Search result ranking and scoring
 * @module SearchScoringService
 * Implements the scoring algorithm for ranking catalogue records.
 * Combines multiple signals (title match, description, external data, etc) into a single score.
 */

import QueryExpansionService from './queryExpansionService'

export type CatalogueRecord = {
  title: string
  description: string
  url: string
  department: string
  contentType: string
  profession: string
  tags?: string[]
}

/**
 * Service for scoring and ranking search results.
 * Uses a multi-factor scoring algorithm combining title, description, and external data.
 */
export default class SearchScoringService {
  private queryExpansionService: QueryExpansionService

  constructor(queryExpansionService: QueryExpansionService) {
    this.queryExpansionService = queryExpansionService
  }

  /**
   * Score a catalogue record against search query.
   * Combines multiple signals: phrase matching, term matching, concept extraction.
   * @param record - The catalogue record to score
   * @param terms - Expanded query terms (including synonyms)
   * @param phrase - Original search phrase
   * @param externalText - Optional enriched text from external sources
   * @returns Score (higher = more relevant)
   */
  scoreRecord(record: CatalogueRecord, terms: string[], phrase: string, externalText?: string): number {
    const title = record.title.toLowerCase()
    const description = record.description.toLowerCase()
    const allText = this.getSearchableParts(record).join(' ').toLowerCase()
    const titleTokenSet = this.queryExpansionService.getTokenSet(title)
    const descriptionTokenSet = this.queryExpansionService.getTokenSet(description)
    const tokenSet = this.queryExpansionService.getTokenSet(allText)
    const phraseStem = this.queryExpansionService.stemTerm(phrase)
    const phraseIsShort = phrase.length <= 4

    // Check if phrase appears in different parts
    const phraseInTitle = phraseIsShort
      ? titleTokenSet.has(phrase) || (phraseStem ? titleTokenSet.has(phraseStem) : false)
      : title.includes(phrase)
    const phraseInDescription = phraseIsShort
      ? descriptionTokenSet.has(phrase) || (phraseStem ? descriptionTokenSet.has(phraseStem) : false)
      : description.includes(phrase)
    const phraseInAllText = phraseIsShort
      ? tokenSet.has(phrase) || (phraseStem ? tokenSet.has(phraseStem) : false)
      : allText.includes(phrase)

    // Phrase matching scores (highest priority)
    let score = 0
    if (phrase.length >= 3) {
      if (phraseInTitle) {
        score += 50
      }
      if (phraseInDescription) {
        score += 12
      }
      if (phraseInAllText) {
        score += 6
      }
    }

    // Individual term matching
    for (const term of terms) {
      const stem = this.queryExpansionService.stemTerm(term)

      // Check each part
      if (titleTokenSet.has(term)) {
        score += 8
      }
      if (stem && titleTokenSet.has(stem)) {
        score += 4
      }
      if (descriptionTokenSet.has(term)) {
        score += 4
      }
      if (tokenSet.has(term)) {
        score += 2
      }
    }

    // External enrichment boost
    if (externalText) {
      const externalTokenSet = this.queryExpansionService.getTokenSet(externalText)
      for (const term of terms) {
        if (externalTokenSet.has(term)) {
          score += 1
        }
      }
    }

    return score
  }

  /**
   * Get all searchable text parts from a record.
   * Combines multiple fields for comprehensive search coverage.
   * @param record - The catalogue record
   * @returns Array of searchable text parts
   */
  private getSearchableParts(record: CatalogueRecord): string[] {
    return [
      record.title,
      record.description,
      record.department,
      record.contentType,
      record.profession,
      ...(record.tags || []),
    ].filter(Boolean)
  }
}
