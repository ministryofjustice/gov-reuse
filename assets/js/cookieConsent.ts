const CookieConsent = function __CookieConsent() {
  const cookieName = 'cookie_consent'
  const cookieMaxAgeDays = 365

  function getCookie(name: string) {
    const prefix = `${name}=`
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const match = cookies.find(cookie => cookie.startsWith(prefix))
    return match ? decodeURIComponent(match.substring(prefix.length)) : null
  }

 function hideCookieBanners() {
    const consent = getCookie(cookieName)
    if (consent === 'accepted' || consent === 'rejected') {
      const banner = document.querySelector('.govuk-cookie-banner')
      if (banner) {
        banner.setAttribute('hidden', 'hidden')
      }
    }
  }
  function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }

  this.acceptCookies = function __acceptCookies() {
    setCookie(cookieName, 'accepted', cookieMaxAgeDays)
    hideCookieBanners()
  }
  this.rejectCookies = function __rejectCookies() {
    setCookie(cookieName, 'rejected', cookieMaxAgeDays)
    hideCookieBanners()
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
      hideCookieBanners()
    }
  }
  this.start()
  return this
}

export default CookieConsent
