import nock from 'nock'
import InfoApiClient from './infoApiClient'
import { ContentFilter } from '../@types/filters'

describe('DataApiClient', () => {
  let infoApiClient: InfoApiClient

  beforeEach(() => {
    infoApiClient = new InfoApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should initialise DataApiClient instance correctly', () => {
    expect(infoApiClient).toBeDefined()
    expect(infoApiClient).toBeInstanceOf(InfoApiClient)
  })

  it('should return an array of designSystemsInfo when calling getDesignSystems', () => {
    const filter: ContentFilter = { department: '', contentType: '', profession: '' }
    const designSystemsInfo = infoApiClient.getDesignSystems(filter)

    expect(designSystemsInfo).toBeDefined()
    expect(Array.isArray(designSystemsInfo)).toBe(true)
    expect(designSystemsInfo.length).toBeGreaterThan(1)
    expect(designSystemsInfo[0]).toHaveProperty('title')
    expect(designSystemsInfo[0]).toHaveProperty('url')
    expect(designSystemsInfo[0]).toHaveProperty('description')
    expect(designSystemsInfo[0]).toHaveProperty('department')
    expect(designSystemsInfo[0]).toHaveProperty('contentType')
    expect(designSystemsInfo[0]).toHaveProperty('profession')
  })

  it('should filter designSystemsInfo based on department filter', () => {
    const filter: ContentFilter = { department: 'Ministry of Justice', contentType: '', profession: '' }
    const designSystemsInfo = infoApiClient.getDesignSystems(filter)

    expect(Array.isArray(designSystemsInfo)).toBe(true)
    expect(designSystemsInfo.length).toBe(1)
    expect(designSystemsInfo[0].department).toBe('Ministry of Justice')
  })

  it('should combine filters', () => {
    // department=Ministry+of+Justice&contentType=Design+systems&profession=All+professions
    const filter: ContentFilter = {
      department: 'Ministry of Justice',
      contentType: 'Products',
      profession: 'Developer',
    }
    const designSystemsInfo = infoApiClient.getProducts(filter)

    expect(designSystemsInfo[0].department).toBe('Ministry of Justice')
    expect(designSystemsInfo[0].contentType).toBe('Products')
    expect(designSystemsInfo[0].profession).toContain('Developer')
  })
})
