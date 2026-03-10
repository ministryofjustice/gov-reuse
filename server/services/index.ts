import { dataAccess } from '../data'
import ExampleService from './exampleService'

export const services = () => {
  const { applicationInfo, exampleApiClient } = dataAccess()

  return {
    applicationInfo,
    exampleService: new ExampleService(exampleApiClient),
  }
}

export type Services = ReturnType<typeof services>
