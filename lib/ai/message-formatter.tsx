import { ExternalLink } from "lucide-react"

/**
 * Parse and format markdown text into React components
 * Supports: bold, italic, code, links, lists
 */
export function formatMessageContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const lines = text.split('\n')

  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if it's a list item
    if (/^[-•]\s/.test(line)) {
      parts.push(
        <li key={`line-${key++}`} className="ml-4">
          {formatInlineContent(line.replace(/^[-•]\s/, ''), key++)}
        </li>
      )
    } else if (line.trim()) {
      // Regular line
      parts.push(
        <span key={`line-${key++}`}>
          {formatInlineContent(line, key++)}
        </span>
      )
    }

    // Add line break if not the last line and next line isn't a list continuation
    if (i < lines.length - 1 && lines[i + 1].trim()) {
      parts.push(<br key={`br-${key++}`} />)
    }
  }

  return parts
}

/**
 * Format inline content within a line (bold, italic, code, links)
 */
function formatInlineContent(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = baseKey * 1000

  while (remaining.length > 0) {
    // Try to match bold (**text**)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before bold
      if (boldMatch.index > 0) {
        parts.push(...formatItalicAndCode(remaining.substring(0, boldMatch.index), key++))
      }

      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold">
          {boldMatch[1]}
        </strong>
      )

      remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
      continue
    }

    // Try to match links ([text](url))
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch && linkMatch.index !== undefined) {
      // Add text before link
      if (linkMatch.index > 0) {
        parts.push(...formatItalicAndCode(remaining.substring(0, linkMatch.index), key++))
      }

      // Add link
      const linkText = linkMatch[1]
      const linkUrl = linkMatch[2]
      parts.push(
        <a
          key={`link-${key++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium inline-flex items-center gap-1"
        >
          {linkText}
          <ExternalLink className="h-3 w-3" />
        </a>
      )

      remaining = remaining.substring(linkMatch.index + linkMatch[0].length)
      continue
    }

    // No more special formatting found, process remaining text
    parts.push(...formatItalicAndCode(remaining, key++))
    break
  }

  return parts
}

/**
 * Format italic and code within text
 */
function formatItalicAndCode(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = baseKey * 1000

  while (remaining.length > 0) {
    // Try to match code (`text`)
    const codeMatch = remaining.match(/`([^`]+)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      // Add text before code
      if (codeMatch.index > 0) {
        parts.push(...formatItalic(remaining.substring(0, codeMatch.index), key++))
      }

      // Add code
      parts.push(
        <code
          key={`code-${key++}`}
          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
        >
          {codeMatch[1]}
        </code>
      )

      remaining = remaining.substring(codeMatch.index + codeMatch[0].length)
      continue
    }

    // No code found, process remaining for italic
    parts.push(...formatItalic(remaining, key++))
    break
  }

  return parts
}

/**
 * Format italic text (*text*)
 */
function formatItalic(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = baseKey * 1000

  while (remaining.length > 0) {
    // Try to match italic (*text* but not **)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/)
    if (italicMatch && italicMatch.index !== undefined) {
      // Add text before italic
      if (italicMatch.index > 0) {
        parts.push(remaining.substring(0, italicMatch.index))
      }

      // Add italic text
      parts.push(
        <em key={`italic-${key++}`} className="italic">
          {italicMatch[1]}
        </em>
      )

      remaining = remaining.substring(italicMatch.index + italicMatch[0].length)
      continue
    }

    // No italic found, return remaining text
    if (remaining) {
      parts.push(remaining)
    }
    break
  }

  return parts
}
