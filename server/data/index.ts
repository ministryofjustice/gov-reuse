/* eslint-disable import/first */
/*
 * Do AppInsights first as it does some magic instrumentation work, i.e. it affects other dependencies.
 * In particular, applicationInsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'
import config from '../config'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import InfoApiClient from './infoApiClient'
import SearchApiClient from './searchApiClient'
import HmppsAuditClient from './hmppsAuditClient'

export const dataAccess = () => {
  return {
    applicationInfo,
    dataApiClient: new InfoApiClient(),
    searchApiClient: new SearchApiClient(),
    hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export { InfoApiClient, SearchApiClient, HmppsAuditClient }
