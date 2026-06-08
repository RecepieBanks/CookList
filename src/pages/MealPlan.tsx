import { useState } from 'react'
import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  PageActions, 
  Button, 
  Card, 
  CardContent, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  toast,
  Avatar,
  AvatarFallback
} from '@blinkdotnew/ui'
import { Plus, ChevronLeft, ChevronRight, Utensils, Trash2, ShoppingCart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import { format, addDays, startOfWeek } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import { RecipeDetailModal } from '@/components/RecipeDetailModal'
import { useLang } from '@/i18n/LanguageContext'

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  // selectedDay is a formatted string (yyyy-MM-dd) to avoid reference equality issues
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [viewingRecipe, setViewingRecipe] = useState<any>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useLang()

  const start = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = [...Array(7)].map((_, i) => addDays(start, i))

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const data = await blink.db.recipes.list()
      return data || []
    }
  })

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['meal_plans', format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      const data = await blink.db.meal_plans.list()
      return data || []
    }
  })

  const addMealMutation = useMutation({
    mutationFn: async ({ recipeId, dateStr }: { recipeId: string, dateStr: string }) => {
      await blink.db.mealPlans.create({
        recipeId,
        date: dateStr,
        mealType: 'dinner',
        servings: 4
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] })
      setSelectedDay(null)
      toast.success(t('plan_meal_added'))
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add meal')
    }
  })

  const removeMealMutation = useMutation({
    mutationFn: async (id: string) => {
      await blink.db.mealPlans.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_plans'] })
      toast.success(t('plan_meal_removed'))
    }
  })

  const generateShoppingListMutation = useMutation({
    mutationFn: async () => {
      const weeklyPlans = mealPlans.filter(p => {
        return p.date >= format(start, 'yyyy-MM-dd') && p.date <= format(addDays(start, 6), 'yyyy-MM-dd')
      })

      if (weeklyPlans.length === 0) throw new Error(t('plan_no_meals_error'))

      const recipeIds = [...new Set(weeklyPlans.map(p => p.recipeId || p.recipe_id))]
      const recipesToInclude = recipes.filter(r => recipeIds.includes(r.id))

      const aggregatedIngredients: Record<string, { amount: number, unit: string }> = {}

      recipesToInclude.forEach(recipe => {
        const ingredients = JSON.parse(recipe.ingredients || '[]')
        ingredients.forEach((ing: any) => {
          const key = ing.name?.toLowerCase() || ''
          if (!key) return
          const amount = parseFloat(ing.amount) || 0
          if (aggregatedIngredients[key]) {
            aggregatedIngredients[key].amount += amount
          } else {
            aggregatedIngredients[key] = { amount, unit: ing.unit || '' }
          }
        })
      })

      const items = Object.entries(aggregatedIngredients).map(([name, data]) => ({
        name,
        amount: data.amount,
        unit: data.unit,
        checked: false
      }))

      await blink.db.shoppingLists.create({
        items: JSON.stringify(items),
        status: 'active'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('plan_list_generated'))
      navigate({ to: '/shop' })
    },
    onError: (error: any) => {
      toast.error(error.message || t('plan_generate_error'))
    }
  })

  const getMealsForDay = (dateStr: string) => {
    return mealPlans
      .filter(p => (p.date || '').startsWith(dateStr))
      .map(p => ({
        ...p,
        recipe: recipes.find(r => r.id === (p.recipeId || p.recipe_id))
      }))
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>{t("plan_title")}</PageTitle>
        <PageActions>
          <div className="flex items-center gap-2 mr-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[150px] text-center">
              {format(start, 'MMM d')} - {format(addDays(start, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => generateShoppingListMutation.mutate()}
            disabled={mealPlans.length === 0 || generateShoppingListMutation.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {generateShoppingListMutation.isPending ? t('plan_generating') : t('plan_generate')}
          </Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const meals = getMealsForDay(dateStr)
            return (
              <div key={dateStr} className="space-y-3">
                <div className="text-center py-2 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{format(day, 'EEE')}</p>
                  <p className="text-lg font-bold">{format(day, 'd')}</p>
                </div>

                <div className="space-y-2">
                  {meals.map((meal) => (
                    <Card key={meal.id} className="relative group cursor-pointer hover:shadow-md transition-shadow" onClick={() => meal.recipe && setViewingRecipe(meal.recipe)}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 rounded-lg shrink-0">
                            {meal.recipe?.image_url ? (
                              <img src={meal.recipe.image_url} alt="" className="object-cover" />
                            ) : (
                              <AvatarFallback><Utensils className="h-4 w-4" /></AvatarFallback>
                            )}
                          </Avatar>
                          <p className="text-xs font-medium line-clamp-2">{meal.recipe?.title || 'Unknown'}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeMealMutation.mutate(meal.id) }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Simple button — opens the single shared dialog */}
                  <button
                    onClick={() => setSelectedDay(dateStr)}
                    className="w-full h-24 border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px] font-medium uppercase">{t('plan_add_meal')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Single shared Dialog — controlled by selectedDay string state */}
        <Dialog open={selectedDay !== null} onOpenChange={(open) => { if (!open) setSelectedDay(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t('plan_add_for')}{selectedDay ? ` for ${format(new Date(selectedDay + 'T12:00:00'), 'EEEE, MMM d')}` : ''}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {recipes.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => selectedDay && addMealMutation.mutate({ recipeId: recipe.id, dateStr: selectedDay })}
                      disabled={addMealMutation.isPending}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar className="h-10 w-10 rounded-lg shrink-0">
                        {recipe.image_url ? (
                          <img src={recipe.image_url} alt="" className="object-cover" />
                        ) : (
                          <AvatarFallback><Utensils className="h-5 w-5" /></AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipe.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(() => { try { return JSON.parse(recipe.ingredients).length } catch { return 0 } })()} ingredients
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">{t('plan_no_recipes')}</p>
                  <Button variant="link" onClick={() => { setSelectedDay(null); navigate({ to: '/recipes' }) }}>
                    {t('plan_go_recipes')}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageBody>
      <RecipeDetailModal
        recipe={viewingRecipe}
        open={viewingRecipe !== null}
        onClose={() => setViewingRecipe(null)}
      />
    </Page>
  )
}
