import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'

jest.mock('../services/exampleService')

// const exampleService = new ExampleService(null) as jest.Mocked<ExampleService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('This site is under construction...')
      })
  })
})
