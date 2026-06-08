/**
 * Collapsible SaaS sidebar — expands to 15rem, collapses to 3rem (icon-only).
 * State is persisted to localStorage. Tooltips appear automatically when collapsed.
 */
import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'
import {
  LayoutDashboard,
  Utensils,
  Calendar,
  ShoppingBag,
  Settings,
  LogOut,
  PanelLeft,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/i18n/LanguageContext'
import { useTheme } from '@/i18n/ThemeContext'
import type { Lang } from '@/i18n/translations'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  href: string
  icon: ReactNode
  labelKey: string
}

const NAV_ITEMS: NavItemDef[] = [
  { href: '/', icon: <LayoutDashboard className="h-4 w-4" />, labelKey: 'nav_dashboard' },
  { href: '/recipes', icon: <Utensils className="h-4 w-4" />, labelKey: 'nav_recipes' },
  { href: '/plan', icon: <Calendar className="h-4 w-4" />, labelKey: 'nav_mealplan' },
  { href: '/shop', icon: <ShoppingBag className="h-4 w-4" />, labelKey: 'nav_shopping' },
  { href: '/settings', icon: <Settings className="h-4 w-4" />, labelKey: 'nav_settings' },
]

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  const location = useLocation()
  const { t } = useLang()
  const isActive = location.pathname === item.href
  const label = t(item.labelKey as any)

  const link = (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors cursor-pointer',
        collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

const LANG_OPTIONS: { code: Lang; flag: string; name: string }[] = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'sv', flag: '🇸🇪', name: 'Svenska' },
]

const THEME_OPTIONS = [
  { value: 'light' as const, icon: <Sun className="h-3.5 w-3.5" />, label: 'Light' },
  { value: 'dark'  as const, icon: <Moon className="h-3.5 w-3.5" />, label: 'Dark' },
  { value: 'system' as const, icon: <Monitor className="h-3.5 w-3.5" />, label: 'Auto' },
]

function themeIcon(theme: string) {
  if (theme === 'light') return <Sun className="h-4 w-4" />
  if (theme === 'dark') return <Moon className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

export function AppSidebarShell() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-background border-r border-border overflow-hidden',
          'transition-[width] duration-200 ease-linear shrink-0',
          collapsed ? 'w-[3rem]' : 'w-[15rem]'
        )}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-2 shrink-0 border-b border-border h-[52px] px-3',
            collapsed && 'justify-center px-2'
          )}
        >
          {!collapsed && (
            <>
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                C
              </div>
              <span className="flex-1 font-semibold text-sm truncate">CookList</span>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={toggle}
              >
                <PanelLeft
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    collapsed && 'rotate-180'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? t('nav_expand') : t('nav_collapse')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Nav ───────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          {!collapsed && (
            <p className="px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('nav_main')}
            </p>
          )}
          {NAV_ITEMS.map(item => (
            <NavItem key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div
          className={cn(
            'shrink-0 border-t border-border',
            collapsed ? 'flex flex-col items-center gap-1 p-2' : 'p-3 space-y-1'
          )}
        >
          {/* Theme switcher */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {themeIcon(theme)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex gap-1 px-1">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                    theme === opt.value
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Language switcher */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLang(lang === 'en' ? 'sv' : 'en')}
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors text-sm"
                  title={lang === 'en' ? 'Svenska' : 'English'}
                >
                  {lang === 'en' ? '🇸🇪' : '🇬🇧'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {lang === 'en' ? 'Svenska' : 'English'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex gap-1 px-1">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLang(opt.code)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
                    lang === opt.code
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* User row */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors cursor-pointer">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-muted">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.displayName || user?.email}</TooltipContent>
            </Tooltip>
          ) : (
            <button className="flex items-center gap-2 rounded-md hover:bg-accent transition-colors cursor-pointer w-full px-2 py-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-muted">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium leading-tight truncate">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{user?.email}</p>
              </div>
            </button>
          )}

          {/* Sign out */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('nav_signout')}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {t('nav_signout')}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
