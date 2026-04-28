import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '@utils/sanitizeHtml'

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('preserves plain text', () => {
    expect(sanitizeHtml('hello world')).toBe('hello world')
  })

  it('preserves whitelisted formatting tags', () => {
    expect(sanitizeHtml('<b>bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeHtml('<strong>bold</strong>')).toBe('<strong>bold</strong>')
    expect(sanitizeHtml('<i>italic</i>')).toBe('<i>italic</i>')
    expect(sanitizeHtml('<em>italic</em>')).toBe('<em>italic</em>')
    expect(sanitizeHtml('<u>underline</u>')).toBe('<u>underline</u>')
    expect(sanitizeHtml('line<br>break')).toBe('line<br>break')
  })

  it('preserves nested whitelisted tags', () => {
    expect(sanitizeHtml('<b><i>nested</i></b>')).toBe('<b><i>nested</i></b>')
  })

  it('strips disallowed tags but keeps their text content', () => {
    expect(sanitizeHtml('<div>plain</div>')).toBe('plain')
    expect(sanitizeHtml('<span>text</span>')).toBe('text')
    expect(sanitizeHtml('<p>paragraph</p>')).toBe('paragraph')
  })

  it('removes script tags entirely', () => {
    const result = sanitizeHtml('safe<script>alert("xss")</script>text')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('safe')
    expect(result).toContain('text')
  })

  it('strips attributes from allowed tags', () => {
    expect(sanitizeHtml('<b style="color:red" onclick="alert(1)">x</b>')).toBe('<b>x</b>')
    expect(sanitizeHtml('<i class="malicious" data-evil="1">y</i>')).toBe('<i>y</i>')
  })

  it('strips event-handler attributes that come on disallowed tags', () => {
    const result = sanitizeHtml('<img src=x onerror="alert(1)">')
    expect(result).not.toContain('img')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('removes anchor tags but keeps the visible text', () => {
    const result = sanitizeHtml('<a href="https://evil.example">click</a>')
    expect(result).toBe('click')
  })

  it('handles mixed allowed and disallowed siblings', () => {
    const result = sanitizeHtml('<b>keep</b><script>drop</script><i>keep</i>')
    expect(result).toBe('<b>keep</b><i>keep</i>')
  })
})
