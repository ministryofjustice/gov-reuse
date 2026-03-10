import ExampleApiClient from '../data/exampleApiClient'
import ExampleService from './exampleService'

jest.mock('../data/exampleApiClient')

describe('ExampleService', () => {
  const exampleApiClient = new ExampleApiClient() as jest.Mocked<ExampleApiClient>
  let exampleService: ExampleService

  beforeEach(() => {
    exampleService = new ExampleService(exampleApiClient)
  })

  // TODO: add real test cases.
  it('should initialise ExampleService instance correctly', () => {
    expect(exampleService).toBeDefined()
    expect(exampleService).toBeInstanceOf(ExampleService)
  })
})
