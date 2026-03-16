import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { ContentFilter } from '../@types/filters'
import { SearchResponse } from '../@types/search'
import config from '../config'
import logger from '../../logger'

export default class searchApiClient extends RestClient {
  constructor() {
    super('search-api', config.apis.searchApi, logger)
  }

  async search(query: string): Promise<SearchResponse> {
    return this.post({
      path: '/search',
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json"
      },
      data: { message: query },
    })
  }
}
