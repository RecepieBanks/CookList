import { 
  createRouter, 
  createRoute, 
  createRootRoute, 
  RouterProvider, 
  Outlet 
} from '@tanstack/react-router'
import { Toaster, LoadingOverlay } from '@blinkdotnew/ui'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { useAuth } from './hooks/useAuth'
import { useLang } from './i18n/LanguageContext'

// Real Pages
import DashboardPage from './pages/Dashboard'
import RecipesPage from './pages/Recipes'
import MealPlanPage from './pages/MealPlan'
import ShoppingListPage from './pages/ShoppingList'
import SettingsPage from './pages/Settings'

// Auth Guard Wrapper
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, login } = useAuth()
  const { t } = useLang()

  if (isLoading) {
    return <LoadingOverlay show />
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="flex items-center justify-center h-20 w-20 rounded-[2rem] bg-primary text-primary-foreground text-3xl font-bold mb-8 shadow-xl shadow-primary/20 animate-fade-in">
          C
        </div>
        <h1 className="text-4xl font-black mb-3 tracking-tight">{t('auth_welcome')}</h1>
        <p className="text-muted-foreground mb-10 max-w-sm text-lg leading-relaxed">
          {t('auth_subtitle')}
        </p>
        <button
          onClick={login}
          className="bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
        >
          {t('auth_signin')}
        </button>
      </div>
    )
  }

  return <>{children}</>
}

// Route Definition
const rootRoute = createRootRoute({
  component: () => (
    <AuthGuard>
      <SharedAppLayout appName="CookList">
        <Outlet />
      </SharedAppLayout>
      <Toaster position="top-right" />
    </AuthGuard>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const recipesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recipes',
  component: RecipesPage,
})

const planRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  component: MealPlanPage,
})

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shop',
  component: ShoppingListPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  recipesRoute,
  planRoute,
  shopRoute,
  settingsRoute,
])
import { createHashHistory } from '@tanstack/react-router'

const hashHistory = createHashHistory()

const router = createRouter({ 
  routeTree,
  history: hashHistory,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
