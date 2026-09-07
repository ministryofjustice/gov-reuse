import * as govukFrontend from 'govuk-frontend'

import * as mojFrontend from '@ministryofjustice/frontend'

import '@govuk-prototype-kit/step-by-step/javascripts/step-by-step-polyfills'

import '@govuk-prototype-kit/step-by-step/javascripts/step-by-step-navigation'

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

document.addEventListener('DOMContentLoaded', function initialiseStepByStep() {
  const stepNavElement = document.querySelector('#step-by-step-navigation')

  if (stepNavElement) {
    const stepNav = new window.GOVUK.Modules.AppStepNav(stepNavElement)

    stepNav.init()
  }
})

document.addEventListener('DOMContentLoaded', function initialiseNewsShareLinks() {
  const shareButtons = document.querySelectorAll('.js-copy-news-link')

  shareButtons.forEach(button => {
    const buttonElement = button

    buttonElement.addEventListener('click', async () => {
      const slug = buttonElement.dataset.newsSlug
      const shareUrl = `${window.location.origin}/news#${slug}`

      await navigator.clipboard.writeText(shareUrl)

      buttonElement.textContent = 'Link copied'

      const confirmation = buttonElement.parentElement.querySelector('.js-copy-news-confirmation')

      if (confirmation) {
        confirmation.textContent = 'Link copied to clipboard'
      }

      setTimeout(() => {
        buttonElement.textContent = 'Copy link to this update'

        if (confirmation) {
          confirmation.textContent = ''
        }
      }, 3000)
    })
  })
})
