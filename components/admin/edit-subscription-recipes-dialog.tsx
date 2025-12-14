'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'

interface Recipe {
  id: string
  name: string
  slug: string
}

interface EditSubscriptionRecipesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  userId: string
  currentRecipes: Recipe[]
  onSuccess?: () => void
}

export function EditSubscriptionRecipesDialog({
  open,
  onOpenChange,
  planId,
  userId,
  currentRecipes,
  onSuccess
}: EditSubscriptionRecipesDialogProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>(
    currentRecipes.map(r => r.id).filter(Boolean)
  )
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch all available recipes
    const fetchRecipes = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipes')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (data) setAllRecipes(data)
    }

    if (open) fetchRecipes()
  }, [open])

  const handleToggleRecipe = (recipeId: string) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Call API to update plan_items
      const response = await fetch(`/api/admin/plans/${planId}/recipes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: selectedRecipes })
      })

      if (!response.ok) throw new Error('Failed to update recipes')

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating recipes:', error)
      alert('Failed to update recipes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subscription Recipes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {allRecipes.map(recipe => (
              <div key={recipe.id} className="flex items-center space-x-2">
                <Checkbox
                  id={recipe.id}
                  checked={selectedRecipes.includes(recipe.id)}
                  onCheckedChange={() => handleToggleRecipe(recipe.id)}
                />
                <label htmlFor={recipe.id} className="text-sm cursor-pointer">
                  {recipe.name}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || selectedRecipes.length === 0}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
