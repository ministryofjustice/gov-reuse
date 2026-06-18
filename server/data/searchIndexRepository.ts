/**
 * @fileoverview SearchIndexRepository - Data access layer for search indices
 * @module SearchIndexRepository
 * Manages loading and accessing pre-built search indices from JSON files.
 * Provides a clean interface for retrieving catalogue records and external component data.
 */

import externalSearchIndexJson from './generated/externalSearchIndex.json'

export type ExternalSearchIndexEntry = {
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

/**
 * Repository for accessing search indices and external data enrichment.
 * Centralizes data loading and provides typed access to search indices.
 */
export default class SearchIndexRepository {
  private readonly externalIndexByUrl: Map<string, ExternalSearchIndexEntry>

  /**
   * Initialise the repository by loading external search indices from JSON.
   */
  constructor() {
    this.externalIndexByUrl = this.loadExternalIndex()
  }

  /**
   * Load and validate external search index from JSON file.
   * @returns Map keyed by normalised URL for fast lookup
   */
  private loadExternalIndex(): Map<string, ExternalSearchIndexEntry> {
    const safeExternalEntries = Array.isArray(externalSearchIndexJson)
      ? (externalSearchIndexJson as ExternalSearchIndexEntry[])
      : []

    return new Map(
      safeExternalEntries
        .filter(entry => typeof entry.url === 'string' && entry.url.length > 0)
        .map(entry => [this.getUrlKey(entry.url), entry]),
    )
  }

  /**
   * Get external index entry by URL.
   * @param url - The URL to look up
   * @returns External index entry or undefined if not found
   */
  getEntryByUrl(url: string): ExternalSearchIndexEntry | undefined {
    return this.externalIndexByUrl.get(this.getUrlKey(url))
  }

  /**
   * Get all external index entries.
   * @returns Array of all external index entries
   */
  getAllEntries(): ExternalSearchIndexEntry[] {
    return Array.from(this.externalIndexByUrl.values())
  }

  /**
   * Check if URL has external enrichment data.
   * @param url - The URL to check
   * @returns True if URL has external data
   */
  hasEntry(url: string): boolean {
    return this.externalIndexByUrl.has(this.getUrlKey(url))
  }

  /**
   * Normalise URL to canonical form for consistent lookups.
   * Removes hash, query params, trailing slashes.
   * @param url - The URL to normalise
   * @returns Canonical URL key
   */
  private getUrlKey(url: string): string {
    try {
      const parsed = new URL(url)
      parsed.hash = ''
      parsed.search = ''
      return parsed.toString()
    } catch {
      return url
    }
  }
}
