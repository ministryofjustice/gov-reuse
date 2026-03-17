import SearchApiClient from '../data/searchApiClient'
import { SearchResponse } from '../@types/search'

export default class SearchService {
  private readonly searchApiClient: SearchApiClient

  constructor(searchApiClient: SearchApiClient) {
    this.searchApiClient = searchApiClient
  }

  async search(query: string): Promise<SearchResponse> {
    return this.searchApiClient.search(query)
  }
}
