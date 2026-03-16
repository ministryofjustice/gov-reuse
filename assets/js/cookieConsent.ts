const CookieConsent = function() {
  const cookieName = 'cookie_consent'
  const cookieMaxAgeDays = 365

  this.acceptCookies = function() {
    this.setCookie(cookieName, 'accepted', cookieMaxAgeDays)
    this.hideCookieBanners()
  }
  this.rejectCookies = function() {
    this.setCookie(cookieName, 'rejected', cookieMaxAgeDays)
    this.hideCookieBanners()
  }
  this.start = function() {
    const banner = document.querySelector(".govuk-cookie-banner")
    if (banner) {
      const acceptButton = banner.querySelector('button[value="yes"]')
      const rejectButton = banner.querySelector('button[value="no"]')
      if (acceptButton) {
        acceptButton.addEventListener('click', this.acceptCookies)
      }
      if (rejectButton) {
        rejectButton.addEventListener('click', this.rejectCookies)
      }
      this.hideCookieBanners()
    }
  }
  this.setCookie = function (name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }
  this.getCookie = function (name: string) {
    const prefix = `${name}=`
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const match = cookies.find(cookie => cookie.startsWith(prefix))
    return match ? decodeURIComponent(match.substring(prefix.length)) : null
  }
  this.hideCookieBanners = function() {
    const consent = this.getCookie(cookieName)
    if (consent === 'accepted' || consent === 'rejected') {
      const banner = document.querySelector(".govuk-cookie-banner")
      if (banner) {
        banner.setAttribute('hidden', 'hidden')
      }
    }
  }
  this.start()
  return this
}

export default CookieConsent
