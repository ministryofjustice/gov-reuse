/**
 * @fileoverview QueryExpansionService - Text analysis and query expansion
 * @module QueryExpansionService
 * Handles stemming, tokenisation, stop word removal, and synonym expansion.
 * Makes search queries more flexible by understanding natural language variations.
 */

/**
 * Service for expanding and normalising search queries.
 * Supports stemming, synonyms, and stop word handling for flexible search.
 */
export default class QueryExpansionService {
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

  /**
   * Normalise a term by converting to lowercase and trimming whitespace.
   * @param term - The term to normalise
   * @returns Normalised term
   */
  normaliseTerm(term: string): string {
    return term.toLowerCase().trim()
  }

  /**
   * Apply simple stemming to reduce word to base form.
   * Removes common suffixes (ing, ed, s, tion, etc).
   * @param term - The term to stem
   * @returns Stemmed term or empty string if invalid
   */
  stemTerm(term: string): string {
    if (!term || term.length < 3) {
      return ''
    }

    let stemmed = term
    const suffixes = ['tion', 'ing', 'ness', 'ed', 'es', 's']

    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
        stemmed = stemmed.slice(0, -suffix.length)
        break
      }
    }

    return stemmed
  }

  /**
   * Check if a term is a stop word (common word to ignore).
   * @param term - The term to check
   * @returns True if term is a stop word
   */
  isStopWord(term: string): boolean {
    return this.stopWords.has(this.normaliseTerm(term))
  }

  /**
   * Tokenise text into individual words.
   * @param text - The text to tokenise
   * @returns Set of unique tokens
   */
  getTokenSet(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .split(/\W+/)
        .filter(token => token.length > 0 && !this.isStopWord(token)),
    )
  }

  /**
   * Expand query terms with synonyms and stems.
   * Returns all variations that should match the original term.
   * @param terms - Array of query terms
   * @returns Expanded array with synonyms and stems
   */
  expandQueryTerms(terms: string[]): string[] {
    const expanded: string[] = []

    for (const term of terms) {
      const normalised = this.normaliseTerm(term)

      // Add original
      if (!this.isStopWord(normalised)) {
        expanded.push(normalised)
      }

      // Add stem
      const stem = this.stemTerm(normalised)
      if (stem && stem !== normalised) {
        expanded.push(stem)
      }

      // Add synonyms
      const synonyms = this.synonymMap[normalised] || []
      expanded.push(...synonyms.filter(syn => !this.isStopWord(syn)))
    }

    return [...new Set(expanded)] // Remove duplicates
  }
}
