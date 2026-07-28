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
        expect(res.text).toContain('Updated accessibility statement')
        expect(res.text).toContain('href="/news?page=2"')
      })
  })

  it('should render page 2 of the news list', () => {
    return request(app)
      .get('/news?page=2')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Reuse Library vision published')
        expect(res.text).toContain('Contributor guidance refreshed')
        expect(res.text).not.toContain('Updated accessibility statement')
      })
  })
})

describe('GET /news/:slug', () => {
  it('should render a markdown-backed blog post', () => {
    return request(app)
      .get('/news/launching-gov-reuse-library')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Launching the GOV Reuse Library')
      })
  })

  it('should return 404 for unknown post slugs', () => {
    return request(app).get('/news/does-not-exist').expect(404)
  })
})
