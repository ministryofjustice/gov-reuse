import ExampleApiClient from '../data/exampleApiClient'

export default class ExampleService {
  constructor(private readonly exampleApiClient: ExampleApiClient) {}

  getCurrentTime() {
    // TODO: remove this stub when we come to implement our service for AI search. Leaving as an example for now.
    // return this.exampleApiClient.getCurrentTime()
    return Promise.resolve(new Date().toISOString())
  }
}
