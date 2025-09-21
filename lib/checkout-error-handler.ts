/**
 * Error handling utilities for checkout process
 */

export interface CheckoutError {
  code: string
  message: string
  details?: any
  recoverable: boolean
}

export class CheckoutErrorHandler {
  /**
   * Handle dog metrics insertion errors
   */
  static async handleDogMetricsError(
    dogId: string, 
    metricsData: any, 
    supabase: any
  ): Promise<{ success: boolean; error?: CheckoutError }> {
    try {
      const today = new Date().toISOString().split("T")[0]
      
      // First, try to get existing metrics for today
      const { data: existingMetrics, error: fetchError } = await supabase
        .from('dog_metrics')
        .select('*')
        .eq('dog_id', dogId)
        .eq('measured_at', today)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: `Failed to check existing metrics: ${fetchError.message}`,
            details: fetchError,
            recoverable: false
          }
        }
      }
      
      if (existingMetrics) {
        // Update existing metrics
        const { error: updateError } = await supabase
          .from('dog_metrics')
          .update({
            weight_kg: metricsData.weight_kg,
            body_condition_score: metricsData.body_condition_score,
            notes: metricsData.notes
          })
          .eq('id', existingMetrics.id)
        
        if (updateError) {
          return {
            success: false,
            error: {
              code: 'UPDATE_ERROR',
              message: `Failed to update existing metrics: ${updateError.message}`,
              details: updateError,
              recoverable: false
            }
          }
        }
        
        console.log('[v0] ✅ Updated existing dog metrics for today')
        return { success: true }
      } else {
        // Insert new metrics
        const { error: insertError } = await supabase
          .from('dog_metrics')
          .insert({
            dog_id: dogId,
            weight_kg: metricsData.weight_kg,
            body_condition_score: metricsData.body_condition_score,
            measured_at: today,
            notes: metricsData.notes
          })
        
        if (insertError) {
          return {
            success: false,
            error: {
              code: 'INSERT_ERROR',
              message: `Failed to insert new metrics: ${insertError.message}`,
              details: insertError,
              recoverable: false
            }
          }
        }
        
        console.log('[v0] ✅ Inserted new dog metrics')
        return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `Unexpected error handling dog metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          recoverable: true
        }
      }
    }
  }
  
  /**
   * Handle RPC function errors
   */
  static handleRPCError(functionName: string, error: any): CheckoutError {
    if (error.code === 'PGRST202') {
      return {
        code: 'FUNCTION_NOT_FOUND',
        message: `RPC function '${functionName}' not found`,
        details: error,
        recoverable: false
      }
    }
    
    if (error.code === 'PGRST301') {
      return {
        code: 'INVALID_PARAMETERS',
        message: `Invalid parameters for RPC function '${functionName}'`,
        details: error,
        recoverable: true
      }
    }
    
    return {
      code: 'RPC_ERROR',
      message: `RPC function '${functionName}' failed: ${error.message}`,
      details: error,
      recoverable: true
    }
  }
  
  /**
   * Handle HTTP status errors
   */
  static handleHTTPError(status: number, url: string): CheckoutError {
    switch (status) {
      case 406:
        return {
          code: 'NOT_ACCEPTABLE',
          message: `Server returned 406 Not Acceptable for ${url}. This usually indicates a content-type or API endpoint issue.`,
          details: { status, url },
          recoverable: true
        }
      
      case 409:
        return {
          code: 'CONFLICT',
          message: `Server returned 409 Conflict for ${url}. This usually indicates a duplicate resource or constraint violation.`,
          details: { status, url },
          recoverable: true
        }
      
      case 500:
        return {
          code: 'SERVER_ERROR',
          message: `Server returned 500 Internal Server Error for ${url}`,
          details: { status, url },
          recoverable: true
        }
      
      default:
        return {
          code: 'HTTP_ERROR',
          message: `HTTP ${status} error for ${url}`,
          details: { status, url },
          recoverable: true
        }
    }
  }
  
  /**
   * Log error with context
   */
  static logError(context: string, error: CheckoutError): void {
    console.error(`[v0] ❌ ${context}:`, {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
      details: error.details
    })
    
    if (error.recoverable) {
      console.log(`[v0] 💡 This error is recoverable and the checkout can continue`)
    } else {
      console.log(`[v0] 🚨 This error is not recoverable and may block checkout`)
    }
  }
  
  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: CheckoutError): boolean {
    return error.recoverable
  }
}
