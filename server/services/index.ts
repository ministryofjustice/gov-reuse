import { dataAccess } from '../data'
import SearchService from './searchService'
import InfoService from './infoService'

export const services = () => {
  const { applicationInfo, dataApiClient, searchApiClient } = dataAccess()

  return {
    applicationInfo,
    searchService: new SearchService(searchApiClient),
    infoService: new InfoService(dataApiClient),
  }
}

export type Services = ReturnType<typeof services>
