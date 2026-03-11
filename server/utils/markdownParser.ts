import path from 'path'
import fs from 'fs'
import { marked } from 'marked'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

/**
 * @fileoverview Safe Markdown parser for rendering sanitised HTML in Express.
 * Uses `marked` for parsing and `DOMPurify` (via `jsdom`) for restrictive sanitisation.
 * Only permits a safe subset of HTML tags and attributes — no scripts, iframes, or event handlers.
 * @module markdownParser
 */

const { window } = new JSDOM('')
const purify = DOMPurify(window)

/**
 * Restrictive DOMPurify configuration — only permits safe, content-oriented HTML.
 * Disallows all attributes except href/src/alt/title, and strips dangerous tags entirely.
 */
const SANITISE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'a',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'del',
    'blockquote',
    'code',
    'pre',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'details',
    'summary',
    'div',
    'span',
    'dl',
    'dt',
    'dd',
    'sup',
    'sub',
    'abbr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
  ALLOW_DATA_ATTR: false,
}

/**
 * Parses a Markdown string into sanitised HTML.
 * @param markdown - Raw Markdown content
 * @returns Sanitised HTML string
 * @example
 *   const HTML = parseMarkdown('# Hello\nSome **bold** text')
 */
export function parseMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string
  return purify.sanitize(rawHtml, SANITISE_OPTIONS)
}

/**
 * Reads a Markdown file from disc and returns sanitised HTML.
 * @param filePath - Absolute or relative path to the Markdown file
 * @returns Sanitised HTML string
 * @throws Error if the file cannot be read
 * @example
 *   const HTML = parseMarkdownFile('/app/content/about.md')
 */
export function parseMarkdownFile(filePath: string): string {
  const resolvedPath = path.resolve(filePath)
  const markdown = fs.readFileSync(resolvedPath, 'utf-8')
  return parseMarkdown(markdown)
}
