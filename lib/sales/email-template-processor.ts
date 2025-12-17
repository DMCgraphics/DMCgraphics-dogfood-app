/**
 * Email template processing utilities for sales email integration
 * Handles merge field replacement ({{field_name}}) with actual values
 */

export interface TemplateVariables {
  lead_name?: string
  lead_email?: string
  lead_phone?: string
  dog_name?: string
  dog_breed?: string
  dog_weight?: string
  rep_name?: string
  rep_email?: string
  rep_phone?: string
  company_name?: string
  [key: string]: string | undefined
}

/**
 * Process merge fields in a template string
 * Replaces {{field_name}} with actual values from variables object
 *
 * @param template - Template string with merge fields like "Hi {{lead_name}}"
 * @param variables - Object with field values
 * @returns Processed template with merge fields replaced
 *
 * @example
 * processMergeFields("Hi {{lead_name}}, welcome!", { lead_name: "John" })
 * // Returns: "Hi John, welcome!"
 */
export function processMergeFields(
  template: string,
  variables: TemplateVariables
): string {
  let processed = template

  // Replace each merge field with its value
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    processed = processed.replace(regex, value || '')
  })

  // Remove any unprocessed merge fields (fields without values)
  processed = processed.replace(/{{[^}]+}}/g, '')

  return processed
}

/**
 * Extract all merge field names from a template
 * Useful for validation and displaying available fields to users
 *
 * @param template - Template string containing merge fields
 * @returns Array of merge field names (without curly braces)
 *
 * @example
 * extractMergeFieldsFromTemplate("Hi {{lead_name}}, {{dog_name}} is cute!")
 * // Returns: ["lead_name", "dog_name"]
 */
export function extractMergeFieldsFromTemplate(template: string): string[] {
  const regex = /{{([^}]+)}}/g
  const fields = new Set<string>()
  let match

  while ((match = regex.exec(template)) !== null) {
    fields.add(match[1])
  }

  return Array.from(fields)
}

/**
 * Validate that all required merge fields have values
 *
 * @param requiredFields - Array of field names that must have values
 * @param variables - Variables object to check
 * @returns Object with validation result and missing fields
 */
export function validateMergeFields(
  requiredFields: string[],
  variables: TemplateVariables
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    field => !variables[field] || variables[field].trim() === ''
  )

  return {
    valid: missingFields.length === 0,
    missingFields
  }
}
