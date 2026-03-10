import nock from 'nock'
import ExampleApiClient from './exampleApiClient'

describe('ExampleApiClient', () => {
  let exampleApiClient: ExampleApiClient

  beforeEach(() => {
    exampleApiClient = new ExampleApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  // TODO: add real test cases.
  it('should initialise ExampleApiClient instance correctly', () => {
    expect(exampleApiClient).toBeDefined()
    expect(exampleApiClient).toBeInstanceOf(ExampleApiClient)
  })
})
