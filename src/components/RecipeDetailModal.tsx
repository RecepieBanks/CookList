import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@blinkdotnew/ui'
import { ExternalLink, Users, CheckCircle2, Circle, Utensils, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/i18n/LanguageContext'

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Recipe {
  id: string
  title: string
  image_url?: string
  source_url?: string
  servings?: number
  ingredients: string
  instructions?: string
  tags?: string
}

interface RecipeDetailModalProps {
  recipe: Recipe | null
  open: boolean
  onClose: () => void
}

export function RecipeDetailModal({ recipe, open, onClose }: RecipeDetailModalProps) {
  const { t } = useLang()
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [customServings, setCustomServings] = useState<number | null>(null)

  const handleClose = () => {
    onClose()
    setCheckedIngredients(new Set())
    setCustomServings(null)
  }

  if (!recipe) return null

  const baseServings = recipe.servings || 4
  const servings = customServings ?? baseServings
  const scale = servings / baseServings

  let ingredients: Ingredient[] = []
  try { ingredients = JSON.parse(recipe.ingredients) } catch {}

  const scaleAmount = (amount: string): string => {
    if (!amount || scale === 1) return amount
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    const scaled = num * scale
    if (scaled % 1 === 0) return scaled.toString()
    if (scaled < 10) return parseFloat(scaled.toFixed(1)).toString()
    return Math.round(scaled).toString()
  }

  const instructions = recipe.instructions?.trim() || ''
  const steps = instructions
    ? instructions
        .split(/\n+/)
        .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean)
    : []

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {recipe.image_url ? (
          <div className="h-56 w-full shrink-0 overflow-hidden rounded-t-xl">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-40 w-full shrink-0 rounded-t-xl bg-muted flex items-center justify-center">
            <Utensils className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}

        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black leading-tight">{recipe.title}</DialogTitle>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('recipe_view_original')}
                </a>
              )}
            </div>
          </DialogHeader>

          {/* Serving scaler */}
          <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1">{t('recipe_servings')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomServings(Math.max(1, servings - 1))}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-background transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{servings}</span>
              <button
                onClick={() => setCustomServings(servings + 1)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-background transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {customServings !== null && customServings !== baseServings && (
              <button
                onClick={() => setCustomServings(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                {t('recipe_reset')}
              </button>
            )}
          </div>

          {/* Ingredients */}
          <section>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              {t('recipe_ingredients')}
              <Badge variant="secondary">{ingredients.length}</Badge>
            </h3>
            <div className="space-y-1.5">
              {ingredients.map((ing, i) => (
                <button
                  key={i}
                  onClick={() => toggleIngredient(i)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left',
                    checkedIngredients.has(i)
                      ? 'bg-muted/60 text-muted-foreground'
                      : 'hover:bg-muted/40'
                  )}
                >
                  {checkedIngredients.has(i)
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  }
                  <span className={cn('flex-1 text-sm font-medium capitalize', checkedIngredients.has(i) && 'line-through')}>
                    {ing.name}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {[scaleAmount(ing.amount), ing.unit].filter(Boolean).join(' ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Instructions */}
          {steps.length > 0 && (
            <section>
              <h3 className="text-lg font-bold mb-3">{t('recipe_instructions')}</h3>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {steps.length === 0 && instructions && (
            <section>
              <h3 className="text-lg font-bold mb-3">{t('recipe_instructions')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{instructions}</p>
            </section>
          )}

          {steps.length === 0 && !instructions && (
            <section>
              <h3 className="text-lg font-bold mb-2">{t('recipe_instructions')}</h3>
              <p className="text-sm text-muted-foreground italic">{t('recipe_no_instructions')}</p>
            </section>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={handleClose}>
              {t('recipe_close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
