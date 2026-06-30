/**
 * @fileoverview HeaderSearchAutocomplete - Client-side search autocomplete
 * @module HeaderSearchAutocomplete
 * Manages the header search input with real-time autocomplete suggestions.
 * Handles user input, keyboard navigation, and result rendering.
 */

// Define window.gtag to prevent TypeScript warning.
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, string | number | boolean>) => void
  }
}

type SearchResult = {
  title: string
  url: string
  parent: string
  description?: string
}

/**
 * Header search autocomplete component.
 * Provides real-time suggestions as user types, with keyboard navigation support.
 * Features: debounced fetch, arrow key navigation, Enter to select, Escape to close.
 */
export default class HeaderSearchAutocomplete {
  private readonly form: HTMLFormElement | null

  private readonly input: HTMLInputElement | null

  private readonly resultsContainer: HTMLElement | null

  private readonly statusText: HTMLElement | null

  private activeIndex = -1

  private currentResults: SearchResult[] = []

  private debounceTimer: NodeJS.Timeout | null = null

  private activeController: AbortController | null = null

  private readonly DEBOUNCE_MS = 180

  private readonly MIN_QUERY_LENGTH = 2

  private readonly RESULTS_LIMIT = 15

  /**
   * Initialise the autocomplete component.
   * @param container - The form container with search input
   */
  constructor(container: HTMLElement) {
    this.form = container.querySelector('.hero__search form')
    this.input = container.querySelector('#header-search-query') as HTMLInputElement
    this.resultsContainer = container.querySelector('#header-search-suggestions')
    this.statusText = container.querySelector('#header-search-status')

    if (!this.form || !this.input || !this.resultsContainer || !this.statusText) {
      // eslint-disable-next-line no-console
      console.warn('HeaderSearchAutocomplete: Missing required DOM elements')
      return
    }

    this.attachEventListeners()
    this.attachDelegatedClickTracking()
  }

  /**
   * Attach all event listeners to the search input.
   * @private
   */
  private attachEventListeners(): void {
    this.form?.addEventListener('submit', e => this.handleFormSubmit(e))
    this.input?.addEventListener('input', e => this.handleInput(e as InputEvent))
    this.input?.addEventListener('keydown', e => this.handleKeyDown(e as KeyboardEvent))
    document.addEventListener('click', e => this.handleDocumentClick(e as MouseEvent))
  }

  /**
   * Prevent direct form submission; users should choose a suggestion link.
   * @private
   */
  private handleFormSubmit(event: Event): void {
    event.preventDefault()
    this.statusText!.textContent = 'Select a suggested result to continue.'
  }

  /**
   * Handle input event - fetch suggestions with debounce.
   * @private
   */
  private handleInput(event: InputEvent): void {
    const query = (event.target as HTMLInputElement).value

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(query)
    }, this.DEBOUNCE_MS)
  }

  /**
   * Fetch suggestions from the API.
   * @private
   */
  private async fetchSuggestions(rawQuery: string): Promise<void> {
    const query = rawQuery.trim()

    if (query.length < this.MIN_QUERY_LENGTH) {
      this.hideResults()
      this.statusText!.textContent = 'Start typing to search reuse library.'
      return
    }

    if (this.activeController) {
      this.activeController.abort()
    }

    this.activeController = new AbortController()

    try {
      const response = await fetch(`/search-suggest?searchQuery=${encodeURIComponent(query)}`, {
        signal: this.activeController.signal,
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Suggestion request failed')
      }

      const data = await response.json()
      this.currentResults = Array.isArray(data.results) ? data.results : []
      this.activeIndex = -1
      this.renderResults(this.currentResults)
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      this.hideResults()
      this.statusText!.textContent = 'Search suggestions are temporarily unavailable.'
    }
  }

  /**
   * Render search results in the dropdown.
   * @private
   */
  private renderResults(results: SearchResult[]): void {
    if (!results.length) {
      this.resultsContainer!.innerHTML = '<p class="hero__search-empty">No matching results found.</p>'
      this.resultsContainer!.hidden = false
      this.statusText!.textContent = 'No matching results found.'
      this.setExpanded(true)
      return
    }

    const limitedResults = results.slice(0, this.RESULTS_LIMIT)

    const listMarkup = limitedResults
      .map((result, index) => {
        const itemId = `header-search-option-${index}`
        return `
          <a
            id="${itemId}"
            class="hero__search-result"
            role="option"
            aria-selected="false"
            data-index="${index}"
            href="${this.escapeHtml(this.encodeURI(result.url))}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="hero__search-result-title">${this.escapeHtml(result.title)}</span>
            ${result.description ? `<span class="hero__search-result-description">${this.escapeHtml(result.description)}</span>` : ''}
            <span class="hero__search-result-meta">${this.escapeHtml(result.parent)}</span>
          </a>
        `
      })
      .join('')

    this.resultsContainer!.innerHTML = `<div class="hero__search-result-list">${listMarkup}</div>`
    this.resultsContainer!.hidden = false
    this.statusText!.textContent = `${limitedResults.length} result${limitedResults.length === 1 ? '' : 's'} available.`
    this.setExpanded(true)
  }

  /**
   * Delegated click tracking so we capture the user's query when they select a link.
   *
   * Uses event delegation so we don't create/destroy listeners on each render cycle.
   * The listener persists for the lifetime of the component; child elements can
   * be freely replaced via innerHTML without any listener clean-up.
   * @private
   */
  private attachDelegatedClickTracking(): void {
    this.resultsContainer.addEventListener('click', (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const target = event.target.closest('.hero__search-result') as HTMLElement | null
      if (!target) return

      const index = parseInt(target.dataset.index || '', 10)
      if (Number.isNaN(index)) return

      const selected = this.currentResults[index]
      if (!selected || typeof window.gtag !== 'function') return

      const queryAtClick = this.input?.value?.trim() || ''
      // The event properties like `selected_title` are manually defined in GA4 as custom dimensions,
      // but `search_term` is already defined as built-in.
      window.gtag('event', 'select_search_suggestion', {
        search_term: queryAtClick,
        selected_title: selected.title,
        selected_url: selected.url,
        selected_source: selected.parent,
        suggestion_position: index + 1,
      })
    })
  }

  /**
   * Handle keyboard navigation.
   * @private
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault()

      if (this.activeIndex >= 0) {
        this.clickActiveResult()
      } else {
        this.statusText!.textContent = 'Select a suggested result to continue.'
      }

      return
    }

    if (this.resultsContainer?.hidden || !this.currentResults.length) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.updateActiveResult(this.activeIndex + 1 >= this.currentResults.length ? 0 : this.activeIndex + 1)
        break

      case 'ArrowUp':
        event.preventDefault()
        this.updateActiveResult(this.activeIndex - 1 < 0 ? this.currentResults.length - 1 : this.activeIndex - 1)
        break

      case 'Escape':
        event.preventDefault()
        this.hideResults()
        break

      default:
        break
    }
  }

  /**
   * Handle document click - close results if clicked outside.
   * @private
   */
  private handleDocumentClick(event: MouseEvent): void {
    if (!this.form?.contains(event.target as Node)) {
      this.hideResults()
    }
  }

  /**
   * Update which result is highlighted.
   * @private
   */
  private updateActiveResult(nextIndex: number): void {
    const items = Array.from(this.resultsContainer!.querySelectorAll('.hero__search-result'))
    if (!items.length) {
      return
    }

    this.activeIndex = nextIndex
    items.forEach(item => {
      item.classList.remove('hero__search-result--active')
      item.setAttribute('aria-selected', 'false')
    })

    const activeItem = items[this.activeIndex]
    if (!activeItem) {
      this.input?.removeAttribute('aria-activedescendant')
      return
    }

    activeItem.classList.add('hero__search-result--active')
    activeItem.setAttribute('aria-selected', 'true')
    this.input?.setAttribute('aria-activedescendant', activeItem.id)
  }

  /**
   * Click the active result link.
   * Triggers the link's click handler, which includes GA tracking.
   * @private
   */
  private clickActiveResult(): void {
    const activeItem = this.resultsContainer?.querySelector(
      `#header-search-option-${this.activeIndex}`,
    ) as HTMLAnchorElement | null
    if (activeItem instanceof HTMLAnchorElement) {
      activeItem.click()
    }
  }

  /**
   * Hide results dropdown.
   * @private
   */
  private hideResults(): void {
    this.resultsContainer!.hidden = true
    this.resultsContainer!.innerHTML = ''
    this.activeIndex = -1
    this.currentResults = []
    this.input?.removeAttribute('aria-activedescendant')
    this.setExpanded(false)
  }

  /**
   * Update aria-expanded attribute.
   * @private
   */
  private setExpanded(isExpanded: boolean): void {
    this.input?.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
  }

  /**
   * Escape HTML special characters to prevent XSS.
   * @private
   */
  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  /**
   * Encode URI safely.
   * @private
   */
  private encodeURI(uri: string): string {
    return encodeURI(uri)
  }
}
