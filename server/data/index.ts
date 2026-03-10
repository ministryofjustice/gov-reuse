/* eslint-disable import/first */
/*
 * Do AppInsights first as it does some magic instrumentation work, i.e. it affects other dependencies.
 * In particular, applicationInsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import ExampleApiClient from './exampleApiClient'

export const dataAccess = () => {
  return {
    applicationInfo,
    exampleApiClient: new ExampleApiClient(),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export { ExampleApiClient }
