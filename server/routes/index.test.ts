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
  const products: ProductInfo = info
  const servicePatterns: ServicePatternInfo = info
  const standards: StandardInfo = info
  const styleGuides: StyleGuideInfo = info

  beforeEach(() => {
    infoService.getDesignSystems.mockResolvedValue([designSystems])
    infoService.getManuals.mockResolvedValue([manuals])
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
        expect(res.text).toContain('Home Office shares how it’s supporting the GOV Reuse Library')
        expect(res.text).toContain('https://hodigital.blog.gov.uk/2026/07/20/design-once-reuse-everywhere/')
      })
  })
})

describe('GET /news/:slug', () => {
  it('should return 404 for unknown post slugs', () => {
    return request(app).get('/news/does-not-exist').expect(404)
  })
})
