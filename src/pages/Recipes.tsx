import { useState } from 'react'
import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  PageActions, 
  Button, 
  Input, 
  Card, 
  CardContent, 
  EmptyState, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  toast,
  LoadingOverlay
} from '@blinkdotnew/ui'
import { Plus, Search, Link as LinkIcon, Image as ImageIcon, Heart, Users, Utensils } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import { RecipeDetailModal } from '@/components/RecipeDetailModal'
import { useLang } from '@/i18n/LanguageContext'

export default function RecipesPage() {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const data = await blink.db.recipes.list()
      return data || []
    }
  })

  const importMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsImporting(true)
      try {
        const { markdown } = await blink.data.scrape(url)
        const { object: recipeData } = await blink.ai.generateObject({
          prompt: `Extract recipe details from this content: ${markdown}`,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              ingredients: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    amount: { type: 'string' },
                    unit: { type: 'string' }
                  }
                }
              },
              servings: { type: 'number' },
              instructions: { type: 'string' },
              image_url: { type: 'string' }
            },
            required: ['title', 'ingredients']
          }
        })

        const newRecipe = {
          id: crypto.randomUUID(),
          title: recipeData.title,
          source_url: url,
          image_url: recipeData.image_url || '',
          ingredients: JSON.stringify(recipeData.ingredients),
          servings: recipeData.servings || 4,
          instructions: recipeData.instructions || '',
          tags: JSON.stringify([]),
          is_favorite: 0
        }

        await blink.db.recipes.create(newRecipe)
        return newRecipe
      } finally {
        setIsImporting(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      setIsImportOpen(false)
      setImportUrl('')
      toast.success(t('recipes_import_success'))
    },
    onError: (error) => {
      toast.error(t('recipes_import_error'))
      console.error(error)
    }
  })

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string, isFavorite: boolean }) => {
      await blink.db.recipes.update(id, { is_favorite: isFavorite ? 1 : 0 })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    }
  })

  const filteredRecipes = (recipes as any[]).filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Page>
      <PageHeader>
        <PageTitle>{t('recipes_title')}</PageTitle>
        <PageActions>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('recipes_add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('recipes_import_title')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('recipes_url_label')}</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder={t('recipes_url_placeholder')}
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && importUrl && !isImporting) importMutation.mutate(importUrl) }}
                    />
                    <Button 
                      onClick={() => importMutation.mutate(importUrl)}
                      disabled={!importUrl || isImporting}
                    >
                      {isImporting ? t('recipes_importing') : t('recipes_import_btn')}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t('recipes_upload_soon')}
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('recipes_manual_soon')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PageActions>
      </PageHeader>
      <PageBody>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('recipes_search')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe: any) => (
              <Card
                key={recipe.id}
                className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative h-48 bg-muted">
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Utensils className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite.mutate({ id: recipe.id, isFavorite: !recipe.is_favorite })
                    }}
                    className={cn(
                      "absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-colors",
                      recipe.is_favorite ? "bg-primary text-primary-foreground" : "bg-white/50 text-foreground hover:bg-white"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 truncate">{recipe.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recipe.servings} {t('recipes_servings')}
                    </div>
                    <span className="text-xs text-primary/60 font-medium">{t('recipes_tap_view')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<Utensils />}
            title={t('recipes_empty_title')}
            description={search ? t('recipes_empty_search') : t('recipes_empty_desc')}
            action={!search ? { label: t('recipes_add'), onClick: () => setIsImportOpen(true) } : undefined}
          />
        )}
      </PageBody>

      <LoadingOverlay show={isImporting} />

      <RecipeDetailModal
        recipe={selectedRecipe}
        open={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
      />
    </Page>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
