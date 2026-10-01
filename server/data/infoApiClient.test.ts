import nock from 'nock'
import InfoApiClient from './infoApiClient'
import { ContentFilter } from '../@types/filters'

describe('InfoApiClient', () => {
  let infoApiClient: InfoApiClient

  beforeEach(() => {
    infoApiClient = new InfoApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should initialise InfoApiClient instance correctly', () => {
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

  it('should return AI resources and filter them by content type', () => {
    const filter: ContentFilter = { department: '', contentType: 'AI', profession: '' }
    const aiResources = infoApiClient.getAiResources(filter)

    expect(aiResources.map(resource => resource.title)).toEqual([
      'AI Knowledge Hub',
      'Artificial intelligence resources for the public sector',
      'AI Playbook for the UK Government',
      'AI context for the GOV.UK Prototype Kit',
      'MOJ AI and Data Science Ethics Framework',
    ])
    expect(aiResources.every(resource => resource.contentType === 'AI')).toBe(true)
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
