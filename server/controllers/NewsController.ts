import path from 'path'
import createError from 'http-errors'
import { Request, Response } from 'express'
import BaseController from './BaseController'
import { getBlogPostBySlug, getBlogPosts } from '../data/blogPosts'
import { parseMarkdownFile } from '../utils/markdownParser'

const NEWS_MARKDOWN_DIR = path.join(__dirname, '../views/markdown/news')
const POSTS_PER_PAGE = 8

const getPageHref = (page: number): string => (page <= 1 ? '/news' : `/news?page=${page}`)

export default class NewsController extends BaseController {
  index = async (req: Request, res: Response) => {
    const allPosts = getBlogPosts()
    const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE))

    const pageQueryValue = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
    const requestedPage = Number.parseInt(`${pageQueryValue ?? '1'}`, 10)

    const currentPage = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : Math.min(requestedPage, totalPages)
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

    return res.render('pages/news', {
      posts,
      pagination: {
        currentPage,
        totalPages,
        pageNumbers,
        previousPageHref: currentPage > 1 ? getPageHref(currentPage - 1) : null,
        nextPageHref: currentPage < totalPages ? getPageHref(currentPage + 1) : null,
      },
    })
  }

  post = async (req: Request, res: Response) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug
    const post = getBlogPostBySlug(slug)

    if (!post) {
      throw createError(404, 'News post not found')
    }

    const markdownContent = parseMarkdownFile(path.join(NEWS_MARKDOWN_DIR, post.fileName))

    return res.render('pages/markdown', {
      pageTitle: `${res.app.locals.applicationName} - ${post.title}`,
      markdownContent,
    })
  }
}
