import { dataAccess } from '../data'
import SearchService from './searchService'
import InfoService from './infoService'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, dataApiClient, searchApiClient, hmppsAuditClient } = dataAccess()

  return {
    applicationInfo,
    searchService: new SearchService(searchApiClient),
    infoService: new InfoService(dataApiClient),
    auditService: new AuditService(hmppsAuditClient),
  }
}

export type Services = ReturnType<typeof services>
