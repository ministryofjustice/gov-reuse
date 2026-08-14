import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import CookieConsent from './cookieConsent'
import HeaderSearchAutocomplete from './headerSearchAutocomplete'

govukFrontend.initAll()
mojFrontend.initAll()

document.addEventListener('DOMContentLoaded', function initialiseCookieConsent() {
  window.cookieConsent = new CookieConsent()
})

document.addEventListener('DOMContentLoaded', function initialiseHeaderSearchAutocomplete() {
  const searchContainer = document.querySelector('.hero__search')
  if (searchContainer) {
    window.headerSearch = new HeaderSearchAutocomplete(searchContainer)
  }
})

function initialiseStepByStep() {
  const stepNav = document.querySelector('[data-module="app-step-nav"]')
  if (!stepNav) {
    return
  }

  const allSteps = stepNav.querySelectorAll('.js-step')
  const allToggleButtons = stepNav.querySelectorAll('.js-step-title-button')
  const showAllButton = stepNav.querySelector('.js-step-nav-show-all')

  const togglePanel = (toggleButtonNode, stepPanelNode, expanded) => {
    const toggleButton = toggleButtonNode
    const stepPanel = stepPanelNode
    toggleButton.setAttribute('aria-expanded', String(expanded))
    toggleButton.querySelector('.app-step-nav__button-text').textContent = expanded ? 'Hide' : 'Show'
    stepPanel.hidden = !expanded
  }

  const updateAllToggleText = () => {
    if (!showAllButton) {
      return
    }

    const openCount = [...allSteps].filter(step => {
      const stepPanel = step.querySelector('.js-panel')
      return stepPanel && !stepPanel.hidden
    }).length

    showAllButton.textContent = openCount === allSteps.length ? 'Hide all steps' : 'Show all steps'
    showAllButton.setAttribute('aria-expanded', String(openCount === allSteps.length))
  }

  allToggleButtons.forEach(button => {
    const buttonElement = button
    const stepPanel = stepNav.querySelector(`#${buttonElement.getAttribute('aria-controls')}`)
    if (stepPanel) {
      stepPanel.hidden = buttonElement.getAttribute('aria-expanded') !== 'true'
      buttonElement.querySelector('.app-step-nav__button-text').textContent = stepPanel.hidden ? 'Show' : 'Hide'
    }

    buttonElement.addEventListener('click', () => {
      const panelId = button.getAttribute('aria-controls')
      const targetPanel = panelId ? stepNav.querySelector(`#${panelId}`) : null
      if (!targetPanel) {
        return
      }

      const isExpanded = button.getAttribute('aria-expanded') === 'true'
      togglePanel(button, targetPanel, !isExpanded)
      updateAllToggleText()
    })
  })

  if (showAllButton) {
    showAllButton.addEventListener('click', () => {
      const shouldExpand = showAllButton.textContent === 'Show all steps'

      allToggleButtons.forEach(button => {
        const panelId = button.getAttribute('aria-controls')
        const targetPanel = panelId ? stepNav.querySelector(`#${panelId}`) : null
        if (targetPanel) {
          togglePanel(button, targetPanel, shouldExpand)
        }
      })

      updateAllToggleText()
    })
  }

  updateAllToggleText()
}

document.addEventListener('DOMContentLoaded', initialiseStepByStep)
