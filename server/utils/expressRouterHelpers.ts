import path from 'path'
import { Router, Request, Response } from 'express'
import { parseMarkdownFile } from './markdownParser'

/** Base directory for Markdown files, alongside pages and partials */
const VIEWS_DIR = path.join(__dirname, '../views/markdown')

/**
 * @fileoverview Enhances an Express Router with helper methods for common route patterns.
 * @module expressRouterHelpers
 *
 * @param router - The Express Router instance to enhance
 * @returns The same router instance with extension methods attached
 *
 * @example
 *   const router = Router()
 *   expressRouterHelpers(router)
 *   router.redirect('/old-path', '/new-path', 301)
 *   router.render('/about', 'pages/about')
 *   router.markdown('/changelog', 'content/changelog.md')
 */
export default function expressRouterHelpers(router: Router): Router {
  const extendedRouter = router as Router

  /**
   * Registers a GET route that redirects from one path to another.
   * @param from - Source path to redirect from
   * @param destination - Target path to redirect to
   * @param statusCode - HTTP status code for the redirect (default: 301)
   * @returns The router instance for chaining
   */
  extendedRouter.redirect = function redirectRoute(
    from: string,
    destination: string,
    statusCode: number = 301,
  ): Router {
    this.get(from, (req: Request, res: Response) => {
      res.redirect(statusCode, destination)
    })
    return this
  }

  /**
   * Registers a GET route that renders a view template for a given path.
   * @param routePath - The route path
   * @param view - The view template to render
   * @param options - Optional data to pass to the view
   * @returns The router instance for chaining
   */
  extendedRouter.render = function renderRoute(routePath: string, view: string, options?: object): Router {
    this.get(routePath, (req: Request, res: Response) => {
      res.render(view, options)
    })
    return this
  }

  /**
   * Registers a GET route that reads a Markdown file, parses it into sanitised HTML,
   * and renders it within the GOV.UK Nunjucks layout.
   * @param routePath - The route path to serve the rendered Markdown on
   * @param markdownFile - Path to the Markdown file (relative to project root)
   * @returns The router instance for chaining
   * @example
   *   router.markdown('/changelog', 'content/changelog.md')
   */
  extendedRouter.markdown = function markdownRoute(routePath: string, markdownFile: string): Router {
    const file = markdownFile.endsWith('.md') ? markdownFile : `${markdownFile}.md`
    this.get(routePath, (req: Request, res: Response) => {
      const markdownContent = parseMarkdownFile(path.join(VIEWS_DIR, file))
      res.render('pages/markdown', { markdownContent })
    })
    return this
  }

  return extendedRouter
}
