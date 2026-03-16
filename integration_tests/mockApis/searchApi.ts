import type { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/health',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 'success',
          results: {
            knowledge_base_status: true,
            embedding_api_status: true,
          },
        },
      },
    }),

  stubSearch: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/search',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          message: 'Search results returned successfully',
          components: [
            {
              title: 'GOV.UK Button',
              url: 'https://design-system.service.gov.uk/components/button/',
              description: 'Use the button component to help users carry out an action.',
              parent: 'GOV.UK Design System',
              accessability: 'WCAG 2.1 AA',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2025-06-20T14:30:00Z',
              has_research: true,
              favourites: 42,
            },
            {
              title: 'MOJ Badge',
              url: 'https://design-patterns.service.justice.gov.uk/components/badge/',
              description: 'The badge component is used to highlight small items of information.',
              parent: 'MOJ Design System',
              accessability: 'WCAG 2.1 AA',
              created_at: '2024-03-10T09:00:00Z',
              updated_at: '2025-08-12T11:15:00Z',
              has_research: false,
              favourites: 17,
            },
          ],
        },
      },
    }),

  stubSearchNoResults: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/search',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          message: 'No results found',
          components: [],
        },
      },
    }),
}
