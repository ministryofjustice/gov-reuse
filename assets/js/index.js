import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import CookieConsent from './cookieConsent'

govukFrontend.initAll()
mojFrontend.initAll()

document.addEventListener('DOMContentLoaded', function initialiseCookieConsent() {
  window.cookieConsent = new CookieConsent()
})

document.addEventListener('DOMContentLoaded', function initialiseHeaderSearchAutocomplete() {
  const form = document.querySelector('.hero__search form')
  const input = document.getElementById('header-search-query')
  const resultsContainer = document.getElementById('header-search-suggestions')
  const statusText = document.getElementById('header-search-status')

  if (!form || !input || !resultsContainer || !statusText) {
    return
  }

  let activeIndex = -1
  let currentResults = []
  let debounceTimer
  let activeController

  const escapeHtml = value =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const setExpanded = isExpanded => {
    input.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
  }

  const hideResults = () => {
    resultsContainer.hidden = true
    resultsContainer.innerHTML = ''
    activeIndex = -1
    currentResults = []
    input.removeAttribute('aria-activedescendant')
    setExpanded(false)
  }

  const renderResults = results => {
    if (!results.length) {
      resultsContainer.innerHTML = '<p class="hero__search-empty">No matching results found.</p>'
      resultsContainer.hidden = false
      statusText.textContent = 'No matching results found.'
      setExpanded(true)
      return
    }

    const listMarkup = results
      .map((result, index) => {
        const itemId = `header-search-option-${index}`
        return `
          <a
            id="${itemId}"
            class="hero__search-result"
            role="option"
            aria-selected="false"
            href="${encodeURI(result.url)}"
          >
            <span class="hero__search-result-title">${escapeHtml(result.title)}</span>
            <span class="hero__search-result-meta">${escapeHtml(result.parent)}</span>
          </a>
        `
      })
      .join('')

    resultsContainer.innerHTML = `<div class="hero__search-result-list">${listMarkup}</div>`
    resultsContainer.hidden = false
    statusText.textContent = `${results.length} result${results.length === 1 ? '' : 's'} available.`
    setExpanded(true)
  }

  const updateActiveResult = nextIndex => {
    const items = Array.from(resultsContainer.querySelectorAll('.hero__search-result'))
    if (!items.length) {
      return
    }

    activeIndex = nextIndex
    items.forEach(item => {
      item.classList.remove('hero__search-result--active')
      item.setAttribute('aria-selected', 'false')
    })

    const activeItem = items[activeIndex]
    if (!activeItem) {
      input.removeAttribute('aria-activedescendant')
      return
    }

    activeItem.classList.add('hero__search-result--active')
    activeItem.setAttribute('aria-selected', 'true')
    input.setAttribute('aria-activedescendant', activeItem.id)
  }

  const fetchSuggestions = async rawQuery => {
    const query = rawQuery.trim()
    if (query.length < 2) {
      hideResults()
      statusText.textContent = 'Start typing to see matching results.'
      return
    }

    if (activeController) {
      activeController.abort()
    }

    activeController = new AbortController()

    try {
      const response = await fetch(`/search-suggest?searchQuery=${encodeURIComponent(query)}`, {
        signal: activeController.signal,
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Suggestion request failed')
      }

      const data = await response.json()
      currentResults = Array.isArray(data.results) ? data.results : []
      activeIndex = -1
      renderResults(currentResults)
    } catch (error) {
      if (error.name === 'AbortError') {
        return
      }
      hideResults()
      statusText.textContent = 'Search suggestions are temporarily unavailable.'
    }
  }

  input.addEventListener('input', event => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      fetchSuggestions(event.target.value)
    }, 180)
  })

  input.addEventListener('keydown', event => {
    if (resultsContainer.hidden || !currentResults.length) {
      if (event.key === 'Enter' && input.value.trim().length > 0) {
        event.preventDefault()
        window.location.assign(`/search-results/?searchQuery=${encodeURIComponent(input.value.trim())}`)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = activeIndex + 1 >= currentResults.length ? 0 : activeIndex + 1
      updateActiveResult(nextIndex)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const previousIndex = activeIndex - 1 < 0 ? currentResults.length - 1 : activeIndex - 1
      updateActiveResult(previousIndex)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      hideResults()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= 0 && currentResults[activeIndex] && currentResults[activeIndex].url) {
        window.location.assign(currentResults[activeIndex].url)
        return
      }
      if (input.value.trim().length > 0) {
        window.location.assign(`/search-results/?searchQuery=${encodeURIComponent(input.value.trim())}`)
      }
    }
  })

  document.addEventListener('click', event => {
    if (!form.contains(event.target)) {
      hideResults()
    }
  })
})
