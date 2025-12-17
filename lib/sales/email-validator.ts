/**
 * Email validation utilities for sales email sending
 * Validates email format and blocks disposable/invalid domains
 */

/**
 * Common disposable email domains to block
 * These are temporary email services that should not be used for sales
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'discard.email',
  'trashmail.com',
  'maildrop.cc',
  'getnada.com',
  'sharklasers.com',
  'yopmail.com',
  'mailnesia.com',
  'mintemail.com',
]

/**
 * RFC 5322 compliant email regex (simplified version)
 * More permissive than the full spec but catches most common errors
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate email format using regex
 */
export function validateEmailFormat(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' }
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Check for multiple @ symbols
  if ((trimmedEmail.match(/@/g) || []).length !== 1) {
    return { valid: false, error: 'Email must contain exactly one @ symbol' }
  }

  // Split into local and domain parts
  const [localPart, domainPart] = trimmedEmail.split('@')

  if (!localPart || localPart.length > 64) {
    return { valid: false, error: 'Email local part is invalid or too long' }
  }

  if (!domainPart || domainPart.length === 0) {
    return { valid: false, error: 'Email domain is required' }
  }

  // Basic domain validation
  if (!domainPart.includes('.')) {
    return { valid: false, error: 'Email domain must contain a period' }
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { valid: false, error: 'Email domain cannot start or end with a period' }
  }

  if (domainPart.includes('..')) {
    return { valid: false, error: 'Email domain cannot contain consecutive periods' }
  }

  return { valid: true }
}

/**
 * Check if email domain is a known disposable email service
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const trimmedEmail = email.trim().toLowerCase()
  const domain = trimmedEmail.split('@')[1]

  if (!domain) {
    return false
  }

  return DISPOSABLE_EMAIL_DOMAINS.some((disposableDomain) => {
    return domain === disposableDomain || domain.endsWith(`.${disposableDomain}`)
  })
}

/**
 * Comprehensive email validation
 * Checks format and blocks disposable emails
 */
export function validateEmail(email: string): ValidationResult {
  // Check format first
  const formatCheck = validateEmailFormat(email)
  if (!formatCheck.valid) {
    return formatCheck
  }

  // Check for disposable email
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed',
    }
  }

  return { valid: true }
}

/**
 * Sanitize email by trimming and lowercasing
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }

  return email.trim().toLowerCase()
}

/**
 * Validate email subject line
 */
export function validateSubject(subject: string): ValidationResult {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' }
  }

  const trimmedSubject = subject.trim()

  if (trimmedSubject.length === 0) {
    return { valid: false, error: 'Subject cannot be empty' }
  }

  if (trimmedSubject.length > 998) {
    return { valid: false, error: 'Subject is too long (max 998 characters)' }
  }

  return { valid: true }
}

/**
 * Validate email body
 */
export function validateEmailBody(body: string): ValidationResult {
  if (!body || typeof body !== 'string') {
    return { valid: false, error: 'Email body is required' }
  }

  const trimmedBody = body.trim()

  if (trimmedBody.length === 0) {
    return { valid: false, error: 'Email body cannot be empty' }
  }

  if (trimmedBody.length > 500000) {
    return { valid: false, error: 'Email body is too large (max 500KB)' }
  }

  return { valid: true }
}
