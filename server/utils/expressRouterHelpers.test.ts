import { Router } from 'express'
import expressRouterHelpers from './expressRouterHelpers'
import { parseMarkdownFile } from './markdownParser'

jest.mock('./markdownParser', () => ({
  parseMarkdownFile: jest.fn().mockReturnValue('<h1>Mocked</h1>'),
}))

const mockedParseMarkdownFile = parseMarkdownFile as jest.Mock

/**
 * Internal Express router layer structure.
 * These properties exist at runtime but are not part of the public Express 5 types.
 */
interface RouteLayer {
  route?: {
    path: string
    methods: Record<string, boolean>
    stack: Array<{ handle: (req: unknown, res: unknown, next: unknown) => void }>
  }
}

/** Helper to retrieve the registered route layer for a given path from the router stack. */
function findLayer(router: Router, routePath: string): RouteLayer {
  const layer = (router as unknown as { stack: RouteLayer[] }).stack.find(l => l.route?.path === routePath)
  if (!layer?.route) {
    throw new Error(`No route found for path: ${routePath}`)
  }
  return layer
}

describe('expressRouterHelpers', () => {
  let router: Router

  beforeEach(() => {
    router = Router()
    expressRouterHelpers(router)
  })

  describe('redirect', () => {
    it('should register a GET route that sends a redirect response', () => {
      const mockRes = { redirect: jest.fn() }
      router.redirect('/old', '/new', 301)

      const layer = findLayer(router, '/old')
      expect(layer.route.methods.get).toBe(true)

      layer.route.stack[0].handle({}, mockRes, jest.fn())
      expect(mockRes.redirect).toHaveBeenCalledWith(301, '/new')
    })

    it('should support custom status codes', () => {
      const mockRes = { redirect: jest.fn() }
      router.redirect('/temp', '/dest', 302)

      const layer = findLayer(router, '/temp')
      layer.route.stack[0].handle({}, mockRes, jest.fn())
      expect(mockRes.redirect).toHaveBeenCalledWith(302, '/dest')
    })
  })

  describe('render', () => {
    it('should register a GET route that renders a view', () => {
      const mockRes = { render: jest.fn() }
      router.render('/about', 'pages/about')

      const layer = findLayer(router, '/about')
      expect(layer.route.methods.get).toBe(true)

      layer.route.stack[0].handle({}, mockRes, jest.fn())
      expect(mockRes.render).toHaveBeenCalledWith('pages/about', undefined)
    })

    it('should pass options to the view', () => {
      const mockRes = { render: jest.fn() }
      const options = { title: 'About' }
      router.render('/about', 'pages/about', options)

      const layer = findLayer(router, '/about')
      layer.route.stack[0].handle({}, mockRes, jest.fn())
      expect(mockRes.render).toHaveBeenCalledWith('pages/about', options)
    })
  })

  describe('markdown', () => {
    it('should register a GET route that renders parsed Markdown', () => {
      const mockRes = { render: jest.fn() }
      router.markdown('/docs', 'docs')

      const layer = findLayer(router, '/docs')
      expect(layer.route.methods.get).toBe(true)

      layer.route.stack[0].handle({}, mockRes, jest.fn())
      expect(mockRes.render).toHaveBeenCalledWith('pages/markdown', { markdownContent: '<h1>Mocked</h1>' })
    })

    it('should append .md extension when omitted', () => {
      router.markdown('/changelog', 'changelog')

      const layer = findLayer(router, '/changelog')
      layer.route.stack[0].handle({}, { render: jest.fn() }, jest.fn())
      expect(mockedParseMarkdownFile).toHaveBeenCalledWith(expect.stringMatching(/changelog\.md$/))
    })

    it('should not double-append .md extension when already present', () => {
      router.markdown('/readme', 'readme.md')

      const layer = findLayer(router, '/readme')
      layer.route.stack[0].handle({}, { render: jest.fn() }, jest.fn())
      expect(mockedParseMarkdownFile).toHaveBeenCalledWith(expect.stringMatching(/readme\.md$/))
      expect(mockedParseMarkdownFile).not.toHaveBeenCalledWith(expect.stringMatching(/\.md\.md$/))
    })
  })
})
