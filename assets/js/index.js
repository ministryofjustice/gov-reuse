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
