import CookieConsent from './cookieConsent'

type CookieRecord = Record<string, string>

describe('CookieConsent legacy cookie compatibility', () => {
  let cookies: CookieRecord
  let gtag: jest.Mock
  let banner: { querySelector: jest.Mock; setAttribute: jest.Mock }

  beforeEach(() => {
    cookies = {}
    gtag = jest.fn()
    banner = {
      querySelector: jest.fn().mockReturnValue(null),
      setAttribute: jest.fn(),
    }

    Object.defineProperty(global, 'window', {
      value: { gtag },
      configurable: true,
      writable: true,
    })

    Object.defineProperty(global, 'document', {
      value: {
        get cookie() {
          return Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ')
        },
        set cookie(cookieValue: string) {
          const [nameValue] = cookieValue.split(';')
          const [name, value] = nameValue.split('=')
          cookies[name] = value
        },
        querySelector: jest.fn((selector: string) => {
          if (selector === '.govuk-cookie-banner') return banner
          return null
        }),
      },
      configurable: true,
      writable: true,
    })
  })

  // To pass lint check need a helper to instance CookieConsent because it uses an old style constructor pattern
  const createCookieConsent = (): unknown => new (CookieConsent as unknown as new () => unknown)()

  it('maps legacy accepted cookie string to granted analytics consent', () => {
    cookies.cookie_consent = encodeURIComponent('accepted')
    const cookieConsent = createCookieConsent()
    expect(cookieConsent).toBeDefined()
    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
    })
    expect(banner.setAttribute).toHaveBeenCalledWith('hidden', 'hidden')
  })

  it('maps legacy rejected cookie string to denied analytics consent', () => {
    cookies.cookie_consent = encodeURIComponent('rejected')
    const cookieConsent = createCookieConsent()
    expect(cookieConsent).toBeDefined()
    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'denied',
    })
    expect(banner.setAttribute).toHaveBeenCalledWith('hidden', 'hidden')
  })
})
