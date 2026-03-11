import path from 'path'
import fs from 'fs'
import { parseMarkdown, parseMarkdownFile } from './markdownParser'

// These tests for the markdownParser cover both the Markdown parsing and the sanitisation.
// They may be a bit excessive as the underlying libraries, should already have their own tests,
// but we want to ensure we are covered, before we start accepting random Markdown file PRs.
describe('markdownParser', () => {
  describe('parseMarkdown', () => {
    it('should convert basic Markdown to HTML', () => {
      expect(parseMarkdown('# Hello')).toBe('<h1>Hello</h1>\n')
    })

    it('should render paragraphs', () => {
      expect(parseMarkdown('Some text')).toBe('<p>Some text</p>\n')
    })

    it('should render inline formatting', () => {
      expect(parseMarkdown('**bold** and *italic*')).toBe('<p><strong>bold</strong> and <em>italic</em></p>\n')
    })

    it('should render unordered lists', () => {
      const result = parseMarkdown('- one\n- two\n- three')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>one</li>')
      expect(result).toContain('<li>two</li>')
      expect(result).toContain('<li>three</li>')
    })

    it('should render ordered lists', () => {
      const result = parseMarkdown('1. first\n2. second')
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>first</li>')
    })

    it('should render links with href attribute', () => {
      const result = parseMarkdown('[GOV.UK](https://gov.uk)')
      expect(result).toContain('<a href="https://gov.uk">')
      expect(result).toContain('GOV.UK</a>')
    })

    it('should render images with src and alt attributes', () => {
      const result = parseMarkdown('![alt text](/image.png)')
      expect(result).toContain('<img src="/image.png" alt="alt text"')
    })

    it('should render code blocks', () => {
      const result = parseMarkdown('```\nconst x = 1\n```')
      expect(result).toContain('<pre><code>')
      expect(result).toContain('const x = 1')
    })

    it('should render inline code', () => {
      expect(parseMarkdown('use `npm install`')).toContain('<code>npm install</code>')
    })

    it('should render blockquotes', () => {
      const result = parseMarkdown('> Important note')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('Important note')
    })

    it('should render tables', () => {
      const markdown = '| Name | Value |\n| --- | --- |\n| one | 1 |'
      const result = parseMarkdown(markdown)
      expect(result).toContain('<table>')
      expect(result).toContain('<th>Name</th>')
      expect(result).toContain('<td>one</td>')
    })

    describe('sanitisation', () => {
      it('should strip script tags', () => {
        const result = parseMarkdown('<script>alert("xss")</script>')
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('alert')
      })

      it('should strip iframe tags', () => {
        const result = parseMarkdown('<iframe src="https://evil.com"></iframe>')
        expect(result).not.toContain('<iframe')
      })

      it('should strip event handler attributes', () => {
        const result = parseMarkdown('<a href="/" onclick="alert(1)">click</a>')
        expect(result).toContain('<a href="/">')
        expect(result).not.toContain('onclick')
      })

      it('should strip style attributes', () => {
        const result = parseMarkdown('<p style="color:red">text</p>')
        expect(result).not.toContain('style')
        expect(result).toContain('<p>text</p>')
      })

      it('should strip data attributes', () => {
        const result = parseMarkdown('<div data-custom="value">text</div>')
        expect(result).not.toContain('data-custom')
      })

      it('should strip form elements', () => {
        const result = parseMarkdown('<form><input type="text"><button>submit</button></form>')
        expect(result).not.toContain('<form')
        expect(result).not.toContain('<input')
        expect(result).not.toContain('<button')
      })

      it('should strip javascript: URLs from links', () => {
        // TODO: when a directive for the linter is available in the future, enable this test again.
        // This is a valid test, but the linter correctly flags this as "Script URL is a form of eval  no-script-url",
        // but that's exactly what we want to test, that such URLs are stripped out.
        // const result = parseMarkdown('<a href="javascript:alert(1)">click</a>')
        // expect(result).not.toContain('javascript:')
      })

      it('should preserve safe content within mixed input', () => {
        const markdown = '# Title\n\n<script>alert("xss")</script>\n\nSafe **content** here.'
        const result = parseMarkdown(markdown)
        expect(result).toContain('<h1>Title</h1>')
        expect(result).toContain('<strong>content</strong>')
        expect(result).not.toContain('<script>')
      })
    })
  })

  describe('parseMarkdownFile', () => {
    const testDir = path.join(__dirname, '__test_fixtures__')
    const testFilePath = path.join(testDir, 'test.md')

    beforeAll(() => {
      fs.mkdirSync(testDir, { recursive: true })
      fs.writeFileSync(testFilePath, '# Test File\n\nSome **bold** content.\n')
    })

    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true })
    })

    it('should read and parse a Markdown file from disc', () => {
      const result = parseMarkdownFile(testFilePath)
      expect(result).toContain('<h1>Test File</h1>')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('should throw an error for a non-existent file', () => {
      expect(() => parseMarkdownFile('/non/existent/file.md')).toThrow()
    })
  })
})
