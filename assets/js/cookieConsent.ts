const CookieConsent = function __CookieConsent() {
  const cookieName = 'cookie_consent'
  const cookieMaxAgeDays = 365

  this.acceptCookies = function __acceptCookies() {
    this.setCookie(cookieName, 'accepted', cookieMaxAgeDays)
    this.hideCookieBanners()
  }
  this.rejectCookies = function __rejectCookies() {
    this.setCookie(cookieName, 'rejected', cookieMaxAgeDays)
    this.hideCookieBanners()
  }
  this.start = function __start() {
    const banner = document.querySelector('.govuk-cookie-banner')
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
  this.setCookie = function __setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }
  this.getCookie = function __getCookie(name: string) {
    const prefix = `${name}=`
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const match = cookies.find(cookie => cookie.startsWith(prefix))
    return match ? decodeURIComponent(match.substring(prefix.length)) : null
  }
  this.hideCookieBanners = function __hideCookieBanners() {
    const consent = this.getCookie(cookieName)
    if (consent === 'accepted' || consent === 'rejected') {
      const banner = document.querySelector('.govuk-cookie-banner')
      if (banner) {
        banner.setAttribute('hidden', 'hidden')
      }
    }
  }
  this.start()
  return this
}

export default CookieConsent
