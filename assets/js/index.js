import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import CookieConsent from './cookieConsent'

govukFrontend.initAll()
mojFrontend.initAll()

document.addEventListener('DOMContentLoaded', function initialiseCookieConsent() {
  window.cookieConsent = new CookieConsent()
})
