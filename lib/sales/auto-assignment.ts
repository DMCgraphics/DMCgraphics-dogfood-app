/**
 * Auto-Assignment Logic for Sales Leads
 *
 * Supports multiple assignment strategies:
 * - Round-robin: Evenly distribute leads across team
 * - Territory-based: Assign based on zip code
 * - Workload-based: Assign to rep with fewest active leads
 */

interface SalesRep {
  id: string
  email: string
  full_name: string | null
  roles: string[]
  territories?: string[] // zip codes or regions
}

interface Lead {
  id: string
  email: string
  source: string
  priority: string
  assigned_to: string | null
  source_metadata?: Record<string, any>
}

interface AssignmentStrategy {
  type: 'round-robin' | 'territory' | 'workload'
  options?: {
    excludeManagers?: boolean
    priorityBased?: boolean
  }
}

/**
 * Get active sales reps from profiles
 */
export async function getActiveSalesReps(supabase: any, excludeManagers = false): Promise<SalesRep[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, roles')
    .contains('roles', excludeManagers ? ['sales_rep'] : ['sales_rep', 'sales_manager'])

  if (error) {
    console.error('[Auto-Assignment] Error fetching sales reps:', error)
    return []
  }

  return profiles as SalesRep[]
}

/**
 * Get current workload for each sales rep
 */
export async function getSalesRepWorkloads(supabase: any, repIds: string[]): Promise<Map<string, number>> {
  const { data: leads, error } = await supabase
    .from('sales_leads')
    .select('assigned_to')
    .in('assigned_to', repIds)
    .in('status', ['new', 'contacted', 'qualified', 'nurturing']) // Only count active leads

  if (error) {
    console.error('[Auto-Assignment] Error fetching workloads:', error)
    return new Map()
  }

  const workloadMap = new Map<string, number>()

  // Initialize all reps with 0
  repIds.forEach(id => workloadMap.set(id, 0))

  // Count leads per rep
  leads?.forEach(lead => {
    if (lead.assigned_to) {
      workloadMap.set(lead.assigned_to, (workloadMap.get(lead.assigned_to) || 0) + 1)
    }
  })

  return workloadMap
}

/**
 * Round-robin assignment
 * Uses a simple counter stored in metadata to track last assigned rep
 */
export function roundRobinAssignment(salesReps: SalesRep[], lastAssignedIndex = -1): SalesRep {
  if (salesReps.length === 0) {
    throw new Error('No sales reps available for assignment')
  }

  const nextIndex = (lastAssignedIndex + 1) % salesReps.length
  return salesReps[nextIndex]
}

/**
 * Territory-based assignment
 * Assigns based on zip code if available in lead metadata
 */
export function territoryAssignment(lead: Lead, salesReps: SalesRep[]): SalesRep | null {
  // Extract zip code from lead metadata
  const zipCode = lead.source_metadata?.zip_code || lead.source_metadata?.zipCode

  if (!zipCode) {
    return null // No zip code, can't do territory assignment
  }

  // Find rep with matching territory
  for (const rep of salesReps) {
    if (rep.territories && rep.territories.includes(zipCode)) {
      return rep
    }
  }

  return null // No rep found for this territory
}

/**
 * Workload-based assignment
 * Assigns to rep with fewest active leads
 */
export function workloadAssignment(workloadMap: Map<string, number>, salesReps: SalesRep[]): SalesRep {
  if (salesReps.length === 0) {
    throw new Error('No sales reps available for assignment')
  }

  let minWorkload = Infinity
  let selectedRep = salesReps[0]

  for (const rep of salesReps) {
    const workload = workloadMap.get(rep.id) || 0
    if (workload < minWorkload) {
      minWorkload = workload
      selectedRep = rep
    }
  }

  return selectedRep
}

/**
 * Main assignment function
 * Attempts territory first, falls back to strategy
 */
export async function assignLead(
  supabase: any,
  lead: Lead,
  strategy: AssignmentStrategy = { type: 'round-robin' }
): Promise<{ assignedTo: SalesRep | null; method: string }> {
  // Get active sales reps
  const salesReps = await getActiveSalesReps(supabase, strategy.options?.excludeManagers)

  if (salesReps.length === 0) {
    return { assignedTo: null, method: 'none' }
  }

  // Try territory assignment first if available
  const territoryRep = territoryAssignment(lead, salesReps)
  if (territoryRep) {
    return { assignedTo: territoryRep, method: 'territory' }
  }

  // Fall back to selected strategy
  if (strategy.type === 'workload') {
    const repIds = salesReps.map(r => r.id)
    const workloadMap = await getSalesRepWorkloads(supabase, repIds)
    const assignedRep = workloadAssignment(workloadMap, salesReps)
    return { assignedTo: assignedRep, method: 'workload' }
  }

  // Default to round-robin
  // Get last assigned index from metadata or start at -1
  const { data: metadata } = await supabase
    .from('sales_leads')
    .select('source_metadata')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const lastAssignedIndex = metadata?.source_metadata?.last_assigned_index || -1
  const assignedRep = roundRobinAssignment(salesReps, lastAssignedIndex)

  return { assignedTo: assignedRep, method: 'round-robin' }
}

/**
 * Batch assign multiple unassigned leads
 */
export async function batchAssignLeads(
  supabase: any,
  leadIds: string[],
  strategy: AssignmentStrategy = { type: 'round-robin' }
): Promise<{ success: number; failed: number; assignments: Map<string, string> }> {
  const assignments = new Map<string, string>()
  let success = 0
  let failed = 0

  // Get all leads
  const { data: leads, error: fetchError } = await supabase
    .from('sales_leads')
    .select('*')
    .in('id', leadIds)

  if (fetchError) {
    console.error('[Auto-Assignment] Error fetching leads:', fetchError)
    return { success: 0, failed: leadIds.length, assignments }
  }

  // Get sales reps once
  const salesReps = await getActiveSalesReps(supabase, strategy.options?.excludeManagers)
  const repIds = salesReps.map(r => r.id)
  const workloadMap = await getSalesRepWorkloads(supabase, repIds)

  let lastIndex = -1

  for (const lead of leads) {
    try {
      let assignedRep: SalesRep | null = null

      // Try territory first
      assignedRep = territoryAssignment(lead, salesReps)

      // Fall back to strategy
      if (!assignedRep) {
        if (strategy.type === 'workload') {
          assignedRep = workloadAssignment(workloadMap, salesReps)
          // Update workload map for next iteration
          if (assignedRep) {
            workloadMap.set(assignedRep.id, (workloadMap.get(assignedRep.id) || 0) + 1)
          }
        } else {
          // Round-robin
          assignedRep = roundRobinAssignment(salesReps, lastIndex)
          lastIndex = (lastIndex + 1) % salesReps.length
        }
      }

      if (assignedRep) {
        // Update lead assignment
        const { error: updateError } = await supabase
          .from('sales_leads')
          .update({ assigned_to: assignedRep.id })
          .eq('id', lead.id)

        if (updateError) {
          console.error(`[Auto-Assignment] Error assigning lead ${lead.id}:`, updateError)
          failed++
        } else {
          assignments.set(lead.id, assignedRep.id)
          success++
        }
      } else {
        failed++
      }
    } catch (error) {
      console.error(`[Auto-Assignment] Error processing lead ${lead.id}:`, error)
      failed++
    }
  }

  return { success, failed, assignments }
}
