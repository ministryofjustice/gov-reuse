/* eslint-disable no-console */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { JSDOM } = require('jsdom')

const contentDataPath = path.resolve(__dirname, '../server/data/contentData.ts')
const outputPath = path.resolve(__dirname, '../server/data/generated/externalSearchIndex.json')

const MAX_URLS = Number(process.env.SEARCH_INDEX_MAX_URLS || 40)
const MAX_PAGES_PER_SOURCE = Number(process.env.SEARCH_INDEX_MAX_PAGES_PER_SOURCE || 10)
const MAX_CRAWL_DEPTH = Number(process.env.SEARCH_INDEX_MAX_DEPTH || 1)
const REQUEST_TIMEOUT_MS = Number(process.env.SEARCH_INDEX_TIMEOUT_MS || 8000)

const readContentData = () => fs.readFileSync(contentDataPath, 'utf8')

const parseCatalogueItems = function parseCatalogueItems(source) {
  const itemRegex = new RegExp(
    [
      "\\{[\\s\\S]*?title:\\s*'([^']*)'",
      "[\\s\\S]*?description:\\s*'([\\s\\S]*?)'",
      "[\\s\\S]*?url:\\s*'([^']*)'",
      "[\\s\\S]*?department:\\s*'([^']*)'",
      "[\\s\\S]*?contentType:\\s*'([^']*)'",
      "[\\s\\S]*?profession:\\s*'([^']*)'",
      '[\\s\\S]*?\\}',
    ].join(''),
    'g',
  )
  const items = []
  let match = itemRegex.exec(source)
  while (match) {
    items.push({
      title: match[1].trim(),
      description: match[2].replace(/\s+/g, ' ').trim(),
      url: match[3].trim(),
      department: match[4].trim(),
      contentType: match[5].trim(),
      profession: match[6].trim(),
    })
    match = itemRegex.exec(source)
  }
  return items
}

const shouldCrawlUrl = rawUrl => {
  try {
    const parsed = new URL(rawUrl)
    return ['https:', 'http:'].includes(parsed.protocol)
  } catch (error) {
    if (error) {
      return false
    }
    return false
  }
}

const stripText = value => value.replace(/\s+/g, ' ').trim()

const toCanonicalUrl = rawUrl => {
  try {
    const parsed = new URL(rawUrl)
    parsed.hash = ''
    parsed.search = ''
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/'
    return parsed.toString()
  } catch (error) {
    if (error) {
      return rawUrl
    }
    return rawUrl
  }
}

const toTitleCase = value =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')

const extractComponentCandidates = (document, baseUrl) => {
  const links = Array.from(document.querySelectorAll('a[href]'))
  const componentMap = new Map()

  links.forEach(link => {
    const href = link.getAttribute('href')
    if (!href) {
      return
    }

    let parsed
    try {
      parsed = new URL(href, baseUrl)
    } catch (error) {
      if (error) {
        return
      }
      return
    }

    const pathSegments = parsed.pathname
      .split('/')
      .map(segment => segment.trim().toLowerCase())
      .filter(Boolean)

    const componentSegmentIndex = pathSegments.findIndex(segment => segment === 'components' || segment === 'component')
    if (componentSegmentIndex < 0) {
      return
    }

    const slug = pathSegments[componentSegmentIndex + 1]
    if (!slug || ['examples', 'example', 'all'].includes(slug)) {
      return
    }

    const slugName = toTitleCase(slug.replace(/[-_]+/g, ' '))
    const linkText = stripText(link.textContent || '')
    const candidate = linkText.length >= 2 && linkText.length <= 80 ? linkText : slugName
    if (candidate.length >= 2 && candidate.length <= 80) {
      const key = `${candidate.toLowerCase()}|${parsed.toString()}`
      componentMap.set(key, {
        name: candidate,
        url: parsed.toString(),
      })
    }
  })

  return Array.from(componentMap.values()).slice(0, 120)
}

const extractInternalLinks = (document, baseUrl) => {
  let base
  try {
    base = new URL(baseUrl)
  } catch (error) {
    if (error) {
      return []
    }
    return []
  }

  const links = Array.from(document.querySelectorAll('a[href]'))
  const deduped = new Set()

  links.forEach(link => {
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }

    let parsed
    try {
      parsed = new URL(href, base.toString())
    } catch (error) {
      if (error) {
        return
      }
      return
    }

    if (parsed.hostname !== base.hostname) {
      return
    }

    const canonical = toCanonicalUrl(parsed.toString())
    deduped.add(canonical)
  })

  return Array.from(deduped)
}

const toHash = value => crypto.createHash('sha256').update(value).digest('hex')

const fetchWithTimeout = async url => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'gov-reuse-search-indexer/1.0',
      },
      redirect: 'follow',
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const html = await response.text()
    return { html, finalUrl: response.url || url }
  } finally {
    clearTimeout(timeoutId)
  }
}

const extractContent = (html, url) => {
  const dom = new JSDOM(html, { url })
  const { document } = dom.window

  const titleNode = document.querySelector('title')
  const metaDescriptionNode = document.querySelector('meta[name="description"]')
  const title = stripText((titleNode && titleNode.textContent) || '')
  const description = stripText((metaDescriptionNode && metaDescriptionNode.getAttribute('content')) || '')

  const headingNodes = Array.from(document.querySelectorAll('h1, h2, h3'))
  const headings = headingNodes
    .map(node => stripText(node.textContent || ''))
    .filter(Boolean)
    .slice(0, 12)

  const components = extractComponentCandidates(document, url)
  const internalLinks = extractInternalLinks(document, url)

  const contentRoot = document.querySelector('main') || document.body
  if (!contentRoot) {
    return { title, description, headings, components, internalLinks, text: '' }
  }

  const removeSelectors = [
    'script',
    'style',
    'noscript',
    'header',
    'footer',
    'nav',
    '.cookie-banner',
    '.govuk-cookie-banner',
    '.moj-cookie-banner',
  ]

  removeSelectors.forEach(selector => {
    contentRoot.querySelectorAll(selector).forEach(node => node.remove())
  })

  const text = stripText(contentRoot.textContent || '').slice(0, 15000)
  return { title, description, headings, components, internalLinks, text }
}

const uniqueBy = (items, keyFn) => {
  const seen = new Set()
  return items.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const crawlSourceWithDepth = async item => {
  const visited = new Set()
  const visitLimit = Math.max(1, MAX_PAGES_PER_SOURCE)

  const crawlLevel = async (urls, depth) => {
    const limitedUrls = urls.filter(Boolean).slice(0, Math.max(0, visitLimit - visited.size))
    limitedUrls.forEach(url => visited.add(toCanonicalUrl(url)))

    if (!limitedUrls.length) {
      return []
    }

    const pageResults = await Promise.all(
      limitedUrls.map(async url => {
        try {
          const { html, finalUrl } = await fetchWithTimeout(url)
          const extracted = extractContent(html, finalUrl)
          return {
            url: toCanonicalUrl(finalUrl),
            extracted,
            ok: true,
          }
        } catch (error) {
          return {
            url: toCanonicalUrl(url),
            extracted: null,
            ok: false,
            error: error && error.message ? error.message : 'unknown-error',
          }
        }
      }),
    )

    if (depth <= 0 || visited.size >= visitLimit) {
      return pageResults
    }

    const nextUrls = pageResults
      .filter(result => result.ok && result.extracted)
      .flatMap(result => result.extracted.internalLinks || [])
      .map(url => toCanonicalUrl(url))
      .filter(url => !visited.has(url))

    const prioritised = uniqueBy(nextUrls, url => url)
      .sort((a, b) => {
        const aPriority = a.includes('/components/') || a.includes('/patterns/') ? 0 : 1
        const bPriority = b.includes('/components/') || b.includes('/patterns/') ? 0 : 1
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        return a.localeCompare(b)
      })
      .slice(0, Math.max(0, visitLimit - visited.size))

    const descendants = await crawlLevel(prioritised, depth - 1)
    return [...pageResults, ...descendants]
  }

  return crawlLevel([item.url], Math.max(0, MAX_CRAWL_DEPTH))
}

const crawlItem = async item => {
  try {
    const crawledPages = await crawlSourceWithDepth(item)
    const successfulPages = crawledPages.filter(page => page.ok && page.extracted)

    if (!successfulPages.length) {
      throw new Error('no-pages-crawled')
    }

    const firstPage = successfulPages[0]
    const allHeadings = uniqueBy(
      successfulPages.flatMap(page => page.extracted.headings || []).filter(Boolean),
      heading => heading.toLowerCase(),
    ).slice(0, 80)
    const allComponents = uniqueBy(
      successfulPages.flatMap(page => page.extracted.components || []).filter(component => component && component.name),
      component => `${component.name.toLowerCase()}|${toCanonicalUrl(component.url || '')}`,
    ).slice(0, 250)
    const combinedText = stripText(successfulPages.map(page => page.extracted.text || '').join(' ')).slice(0, 30000)
    const fingerprint = toHash(
      `${firstPage.extracted.title}|${firstPage.extracted.description}|${allHeadings.join('|')}|${combinedText.slice(0, 4000)}`,
    )
    const crawlStatus = successfulPages.length === crawledPages.length ? 'ok' : 'ok:partial'

    return {
      ...item,
      url: firstPage.url,
      externalTitle: firstPage.extracted.title,
      externalDescription: firstPage.extracted.description,
      externalHeadings: allHeadings,
      externalComponents: allComponents.map(component => component.name),
      externalComponentEntries: allComponents,
      externalText: combinedText,
      contentFingerprint: fingerprint,
      crawledAt: new Date().toISOString(),
      crawlStatus,
      pagesCrawled: successfulPages.length,
    }
  } catch (error) {
    return {
      ...item,
      externalTitle: '',
      externalDescription: '',
      externalHeadings: [],
      externalComponents: [],
      externalComponentEntries: [],
      externalText: '',
      contentFingerprint: '',
      crawledAt: new Date().toISOString(),
      crawlStatus: `error:${error.message}`,
      pagesCrawled: 0,
    }
  }
}

const dedupeResults = results => {
  const seenUrl = new Set()
  const seenFingerprint = new Set()
  const filtered = []

  for (const result of results) {
    const urlKey = result.url.toLowerCase().replace(/\/+$/, '')
    const fingerprint = result.contentFingerprint
    const alreadySeenUrl = seenUrl.has(urlKey)
    const alreadySeenFingerprint = Boolean(fingerprint) && seenFingerprint.has(fingerprint)

    if (!alreadySeenUrl && !alreadySeenFingerprint) {
      seenUrl.add(urlKey)
      if (fingerprint) {
        seenFingerprint.add(fingerprint)
      }
      filtered.push(result)
    }
  }

  return filtered
}

const main = async () => {
  const source = readContentData()
  const catalogueItems = parseCatalogueItems(source)

  const crawlCandidates = catalogueItems.filter(item => shouldCrawlUrl(item.url)).slice(0, MAX_URLS)

  console.log(`[search-index] Crawling ${crawlCandidates.length} URLs (limit ${MAX_URLS})...`)

  const crawled = await Promise.all(crawlCandidates.map(crawlItem))
  const deduped = dedupeResults(crawled)

  const serialisable = deduped.map(entry => ({
    title: entry.title,
    description: entry.description,
    url: entry.url,
    department: entry.department,
    contentType: entry.contentType,
    profession: entry.profession,
    externalTitle: entry.externalTitle,
    externalDescription: entry.externalDescription,
    externalHeadings: entry.externalHeadings,
    externalComponents: entry.externalComponents,
    externalComponentEntries: entry.externalComponentEntries,
    externalText: entry.externalText,
    pagesCrawled: entry.pagesCrawled,
    crawledAt: entry.crawledAt,
    crawlStatus: entry.crawlStatus,
  }))

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(serialisable, null, 2)}\n`, 'utf8')

  const successCount = serialisable.filter(item => item.crawlStatus === 'ok').length
  const failedCount = serialisable.length - successCount

  console.log(`[search-index] Wrote ${serialisable.length} entries to ${outputPath}`)
  console.log(`[search-index] Success: ${successCount}, Failed: ${failedCount}`)
}

main().catch(error => {
  console.warn(`[search-index] Failed to build index: ${error.message}`)
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, '[]\n', 'utf8')
  }
  process.exit(0)
})
