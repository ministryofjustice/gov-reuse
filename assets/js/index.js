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
<<<<<<< Updated upstream
=======

document.addEventListener('DOMContentLoaded', function initialiseStepByStep() {
  const stepNavElement = document.querySelector('#step-by-step-navigation')

  if (stepNavElement) {
    const stepNav = new window.GOVUK.Modules.AppStepNav(stepNavElement)
    stepNav.init()
  }
})
>>>>>>> Stashed changes
