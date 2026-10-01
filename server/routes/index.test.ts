import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import InfoService from '../services/infoService'
import SearchService from '../services/searchService'
import {
  DesignManualInfo,
  DesignSystemInfo,
  ProductInfo,
  ServicePatternInfo,
  StandardInfo,
  StyleGuideInfo,
} from '../@types/records'

jest.mock('../services/infoService')
jest.mock('../services/searchService')

const infoService = {
  getDesignSystems: jest.fn(),
  getManuals: jest.fn(),
  getAiResources: jest.fn(),
  getProducts: jest.fn(),
  getServicePatterns: jest.fn(),
  getStandards: jest.fn(),
  getStyleGuides: jest.fn(),
  getDepartmentFilters: jest.fn(),
  getContentTypesFilters: jest.fn(),
  getProfessionsFilters: jest.fn(),
} as unknown as jest.Mocked<InfoService>

const searchService = new SearchService(null) as jest.Mocked<SearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      infoService,
      searchService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  const info = {
    title: 'Test title',
    description: 'Test description',
    url: 'http://localhost:8080',
    department: 'Test department',
    contentType: 'Test content type',
    profession: 'Test profession',
  }

  const designSystems: DesignSystemInfo = info
  const manuals: DesignManualInfo = info
  const aiResource: DesignManualInfo = { ...info, title: 'AI Knowledge Hub', contentType: 'AI' }
  const products: ProductInfo = info
  const servicePatterns: ServicePatternInfo = info
  const standards: StandardInfo = info
  const styleGuides: StyleGuideInfo = info

  beforeEach(() => {
    infoService.getDesignSystems.mockResolvedValue([designSystems])
    infoService.getManuals.mockResolvedValue([manuals])
    infoService.getAiResources.mockResolvedValue([aiResource])
    infoService.getProducts.mockResolvedValue([products])
    infoService.getServicePatterns.mockResolvedValue([servicePatterns])
    infoService.getStandards.mockResolvedValue([standards])
    infoService.getStyleGuides.mockResolvedValue([styleGuides])
  })

  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('GOV Reuse Library')
        expect(res.text).toContain('Artificial intelligence')
        expect(res.text).toContain('AI Knowledge Hub')
      })
  })
})

describe('GET /news', () => {
  it('should render the news page', () => {
    return request(app)
      .get('/news')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('What&rsquo;s new')
        expect(res.text).toContain('GOV Reuse Library turns one at SD in Gov')
        expect(res.text).toContain('GOV.UK Design System community resources and tools added')
        expect(res.text).toContain('AI Knowledge Hub added')
        expect(res.text).toContain('Artificial intelligence resources for the public sector added')
        expect(res.text.indexOf('GOV Reuse Library turns one at SD in Gov')).toBeLessThan(
          res.text.indexOf('GOV.UK Design System community resources and tools added'),
        )
        expect(res.text).toContain('Read more')
        const firstParagraphEnd = res.text.indexOf('relevant government standards and guidance.')
        const secondParagraphStart = res.text.indexOf('This is our first guide')
        const secondParagraphTag = res.text.lastIndexOf(
          '<p class="govuk-body govuk-!-margin-top-4">',
          secondParagraphStart,
        )

        expect(firstParagraphEnd).toBeGreaterThan(-1)
        expect(secondParagraphTag).toBeGreaterThan(firstParagraphEnd)
      })
  })

  it('should show older news updates on the next page', () => {
    return request(app)
      .get('/news?page=2')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Home Office user researchers join working group')
        expect(res.text).toContain('https://hodigital.blog.gov.uk/2026/07/20/design-once-reuse-everywhere/')
      })
  })
})

describe('GET /news/:slug', () => {
  it('should return 404 for unknown post slugs', () => {
    return request(app).get('/news/does-not-exist').expect(404)
  })
})

describe('GET /news/rss.xml', () => {
  it('should include the new resource updates with working news-page links', () => {
    return request(app)
      .get('/news/rss.xml')
      .expect('Content-Type', /application\/rss\+xml/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('<title>GOV.UK Design System community resources and tools added</title>')
        expect(res.text).toContain('<title>AI Knowledge Hub added</title>')
        expect(res.text).toContain('<title>Artificial intelligence resources for the public sector added</title>')
        expect(res.text).toContain('https://reuselibrary.service.justice.gov.uk/news#govuk-design-system-community-resources-added')
        expect(res.text).toContain('https://reuselibrary.service.justice.gov.uk/news#ai-knowledge-hub-added')
        expect(res.text).toContain('https://reuselibrary.service.justice.gov.uk/news#artificial-intelligence-public-sector-resources-added')
        expect(res.text.indexOf('<title>GOV Reuse Library turns one at SD in Gov</title>')).toBeLessThan(
          res.text.indexOf('<title>GOV.UK Design System community resources and tools added</title>'),
        )
      })
  })
})
