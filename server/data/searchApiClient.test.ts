import nock from 'nock'
import SearchApiClient from './searchApiClient'

describe('SearchApiClient', () => {
  let searchApiClient: SearchApiClient

  beforeEach(() => {
    searchApiClient = new SearchApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should initialise SearchApiClient instance correctly', () => {
    expect(searchApiClient).toBeDefined()
    expect(searchApiClient).toBeInstanceOf(SearchApiClient)
  })
})
