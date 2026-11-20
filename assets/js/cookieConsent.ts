interface CookieOptions {
  analytics: boolean
  settings: boolean
}

const defaultOptions: CookieOptions = {
  analytics: false,
  settings: false,
}

const CookieConsent = function __CookieConsent() {
  const cookieName = 'cookie_consent'
  const cookieMaxAgeDays = 365

  function getCookie(name: string): string | null {
    const prefix = `${name}=`
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const match = cookies.find(cookie => cookie.startsWith(prefix))
    return match ? decodeURIComponent(match.substring(prefix.length)) : null
  }

  function setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }

  function getOptions(): CookieOptions {
    const raw = getCookie(cookieName)
    if (!raw) return { ...defaultOptions }
    try {
      const parsed = JSON.parse(raw) as Partial<CookieOptions>
      return { ...defaultOptions, ...parsed }
    } catch {
      return { ...defaultOptions }
    }
  }

  function saveOptions(options: CookieOptions): void {
    setCookie(cookieName, JSON.stringify(options), cookieMaxAgeDays)
  }

  /** Update Google Analytics consent mode to reflect current preferences */
  function updateGtagConsent(options: CookieOptions): void {
    if (typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', {
      analytics_storage: options.analytics ? 'granted' : 'denied',
    })
  }

  function hideCookieBanner(): void {
    const raw = getCookie(cookieName)
    if (!raw) return
    const banner = document.querySelector('.govuk-cookie-banner')
    if (banner) {
      banner.setAttribute('hidden', 'hidden')
    }
  }

  /** Apply GA consent mode based on saved cookie on page load */
  this.initialiseConsent = function __initialiseConsent(): void {
    const options = getOptions()
    const raw = getCookie(cookieName)
    if (raw) {
      updateGtagConsent(options)
    }
  }

  this.acceptCookies = function __acceptCookies(): void {
    const options: CookieOptions = { analytics: true, settings: true }
    saveOptions(options)
    updateGtagConsent(options)
    hideCookieBanner()
  }

  this.rejectCookies = function __rejectCookies(): void {
    const options: CookieOptions = { analytics: false, settings: false }
    saveOptions(options)
    updateGtagConsent(options)
    hideCookieBanner()
  }

  /** Bind radio buttons and save button on the cookie settings page */
  this.initSettingsPage = function __initSettingsPage(): void {
    const form = document.querySelector<HTMLFormElement>('form')
    if (!form) return

    // Pre-select radios to reflect current saved preferences
    const options = getOptions()
    const analyticsRadio = form.querySelector<HTMLInputElement>(
      `input[name="measureWebsiteUse"][value="${options.analytics ? 'yes' : 'no'}"]`,
    )
    const settingsRadio = form.querySelector<HTMLInputElement>(
      `input[name="rememberSettings"][value="${options.settings ? 'yes' : 'no'}"]`,
    )
    if (analyticsRadio) analyticsRadio.checked = true
    if (settingsRadio) settingsRadio.checked = true

    form.addEventListener('submit', (e: Event) => {
      e.preventDefault()

      const analyticsChoice = form.querySelector<HTMLInputElement>('input[name="measureWebsiteUse"]:checked')
      const settingsChoice = form.querySelector<HTMLInputElement>('input[name="rememberSettings"]:checked')

      const updated: CookieOptions = {
        analytics: analyticsChoice?.value === 'yes',
        settings: settingsChoice?.value === 'yes',
      }

      saveOptions(updated)
      updateGtagConsent(updated)
      hideCookieBanner()
    })
  }

  this.start = function __start(): void {
    this.initialiseConsent()

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
      hideCookieBanner()
    }

    this.initSettingsPage()
  }

  this.start()
  return this
}

export default CookieConsent
