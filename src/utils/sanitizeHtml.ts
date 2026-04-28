/**
 * Whitelist-based HTML sanitizer for sticky note rich text. Only allows the
 * minimal set of formatting tags (b, strong, i, em, u, br). Strips everything
 * else including attributes, scripts, and unsupported elements. Uses DOMParser.
 */

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR'])

const BLOCKED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'NOSCRIPT',
  'TEMPLATE',
])

function transformNode(node: Node, output: Node): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      output.appendChild(document.createTextNode(child.textContent ?? ''))
      continue
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const element = child as Element

    if (BLOCKED_TAGS.has(element.tagName)) continue

    if (ALLOWED_TAGS.has(element.tagName)) {
      const clone = document.createElement(element.tagName.toLowerCase())
      transformNode(element, clone)
      output.appendChild(clone)
    } else {
      // Unsupported tag — keep its text content but drop the wrapper.
      const wrapper = document.createDocumentFragment()
      transformNode(element, wrapper)
      output.appendChild(wrapper)
    }
  }
}

export function sanitizeHtml(input: string): string {
  if (!input) return ''
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html')
  const source = doc.body.firstChild
  if (!source) return ''

  const target = document.createElement('div')
  transformNode(source, target)
  return target.innerHTML
}
