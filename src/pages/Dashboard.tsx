import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  StatGroup, 
  Stat, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Avatar,
  AvatarFallback,
  Button
} from '@blinkdotnew/ui'
import { Utensils, Calendar, ShoppingBag, Plus, ArrowRight, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { useLang } from '@/i18n/LanguageContext'

export default function DashboardPage() {
  const { t } = useLang()

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const data = await blink.db.recipes.list()
      return data || []
    }
  })

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['meal_plans'],
    queryFn: async () => {
      const data = await blink.db.meal_plans.list()
      return data || []
    }
  })

  const { data: shoppingLists = [] } = useQuery({
    queryKey: ['shopping_lists'],
    queryFn: async () => {
      const data = await blink.db.shopping_lists.list()
      return data || []
    }
  })

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayMeals = mealPlans
    .filter((p: any) => p.date === today)
    .map((p: any) => ({
      ...p,
      recipe: recipes.find((r: any) => r.id === p.recipe_id)
    }))

  const activeShoppingList = (shoppingLists as any[]).find(l => l.status === 'active')

  return (
    <Page>
      <PageHeader>
        <PageTitle>{t('dash_title')}</PageTitle>
      </PageHeader>
      <PageBody>
        <StatGroup className="mb-8">
          <Stat 
            label={t('dash_recipes_saved')}
            value={recipes.length.toString()} 
            icon={<Utensils className="h-4 w-4" />} 
          />
          <Stat 
            label={t('dash_meals_planned')}
            value={mealPlans.length.toString()} 
            icon={<Calendar className="h-4 w-4" />} 
          />
          <Stat 
            label={t('dash_shopping_list')}
            value={activeShoppingList ? JSON.parse(activeShoppingList.items).length.toString() : '0'} 
            icon={<ShoppingBag className="h-4 w-4" />} 
          />
        </StatGroup>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{t('dash_todays_meals')}</span>
                <span className="text-xs font-normal text-muted-foreground">{format(new Date(), 'EEEE, MMM d')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayMeals.length > 0 ? (
                <div className="space-y-4">
                  {todayMeals.map((meal: any) => (
                    <div key={meal.id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm">
                      <Avatar className="h-12 w-12 rounded-lg shrink-0">
                        {meal.recipe?.image_url ? (
                          <img src={meal.recipe.image_url} alt="" className="object-cover" />
                        ) : (
                          <AvatarFallback><Utensils className="h-6 w-6 text-primary" /></AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{meal.recipe?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{meal.meal_type}</p>
                      </div>
                      <Link to="/recipes">
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-muted-foreground text-sm">{t('dash_no_meals')}</p>
                  <Link to="/plan">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dash_plan_meal')}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('dash_quick_actions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/recipes">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 justify-center hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                  <Plus className="h-6 w-6" />
                  <span>{t('dash_import_recipe')}</span>
                </Button>
              </Link>
              <Link to="/plan">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 justify-center hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                  <Calendar className="h-6 w-6" />
                  <span>{t('dash_plan_weekly')}</span>
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 justify-center hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                  <ShoppingBag className="h-6 w-6" />
                  <span>{t('dash_view_shopping')}</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 justify-center hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                  <Settings className="h-6 w-6" />
                  <span>{t('dash_account_settings')}</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  )
}
