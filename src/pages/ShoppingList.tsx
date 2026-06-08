import { useState, useRef } from 'react'
import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  PageActions, 
  Button, 
  Card, 
  CardContent, 
  EmptyState,
  toast
} from '@blinkdotnew/ui'
import { ShoppingCart, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import { WillysExportModal } from '@/components/WillysExportModal'
import { useLang } from '@/i18n/LanguageContext'

export default function ShoppingListPage() {
  const queryClient = useQueryClient()
  const [willysOpen, setWillysOpen] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { t } = useLang()

  const handleClearAllClick = () => {
    if (confirmClearAll) {
      clearAllMutation.mutate()
      setConfirmClearAll(false)
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    } else {
      setConfirmClearAll(true)
      confirmTimerRef.current = setTimeout(() => setConfirmClearAll(false), 3000)
    }
  }

  const { data: shoppingLists = [], isLoading } = useQuery({
    queryKey: ['shopping_lists'],
    queryFn: async () => {
      const data = await blink.db.shopping_lists.list()
      return data || []
    }
  })

  const activeList = (shoppingLists as any[])
    .filter(l => l.status === 'active')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const items: any[] = activeList ? JSON.parse(activeList.items) : []
  const checkedCount = items.filter(i => i.checked).length

  const toggleItemMutation = useMutation({
    mutationFn: async (itemName: string) => {
      const updatedItems = items.map((item: any) => 
        item.name === itemName ? { ...item, checked: !item.checked } : item
      )
      await blink.db.shopping_lists.update(activeList.id, {
        items: JSON.stringify(updatedItems)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
    }
  })

  const clearCheckedMutation = useMutation({
    mutationFn: async () => {
      const updatedItems = items.filter((item: any) => !item.checked)
      await blink.db.shopping_lists.update(activeList.id, {
        items: JSON.stringify(updatedItems)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('shop_cleared'))
    }
  })

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await blink.db.shopping_lists.update(activeList.id, {
        items: JSON.stringify([])
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('shop_all_cleared'))
    }
  })

  const archiveListMutation = useMutation({
    mutationFn: async () => {
      await blink.db.shopping_lists.update(activeList.id, { status: 'archived' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] })
      toast.success(t('shop_archived'))
    }
  })

  return (
    <Page>
      <PageHeader>
        <PageTitle>{t('shop_title')}</PageTitle>
        <PageActions>
          {activeList && (
            <div className="flex gap-2 flex-wrap">
              <Button
                className="bg-[#e4002b] hover:bg-[#c4001f] text-white font-semibold gap-2"
                onClick={() => setWillysOpen(true)}
                disabled={items.length === 0}
              >
                <WillysIcon />
                {t('shop_export_willys')}
              </Button>
              {checkedCount > 0 && (
                <Button variant="outline" size="sm" onClick={() => clearCheckedMutation.mutate()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('shop_clear_checked')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={items.length === 0}
                onClick={handleClearAllClick}
                className={confirmClearAll ? 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground' : ''}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {confirmClearAll ? t('shop_clear_all_confirm') : t('shop_clear_all')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => archiveListMutation.mutate()}>
                {t('shop_finish')}
              </Button>
            </div>
          )}
        </PageActions>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="max-w-2xl mx-auto space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : activeList ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Progress bar */}
            {items.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{checkedCount} {t('shop_done_of')} {items.length} {t('shop_done_label')}</span>
                  <span>{Math.round((checkedCount / items.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(checkedCount / items.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                {/* Unchecked items */}
                {items.filter(i => !i.checked).map((item: any) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border last:border-0"
                    onClick={() => toggleItemMutation.mutate(item.name)}
                  >
                    <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium capitalize">{item.name}</p>
                      {(item.amount || item.unit) && (
                        <p className="text-xs text-muted-foreground">
                          {[item.amount, item.unit].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Checked items — dimmed at bottom */}
                {checkedCount > 0 && (
                  <>
                    <div className="px-4 py-2 bg-muted/30 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('shop_checked_section')} ({checkedCount})
                      </p>
                    </div>
                    {items.filter(i => i.checked).map((item: any) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-4 p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border-b border-border last:border-0"
                        onClick={() => toggleItemMutation.mutate(item.name)}
                      >
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium capitalize text-muted-foreground line-through">{item.name}</p>
                          {(item.amount || item.unit) && (
                            <p className="text-xs text-muted-foreground/60">
                              {[item.amount, item.unit].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground italic">
              {t('shop_tip')}
            </p>
          </div>
        ) : (
          <EmptyState 
            icon={<ShoppingCart />}
            title={t('shop_empty_title')}
            description={t('shop_empty_desc')}
          />
        )}
      </PageBody>

      <WillysExportModal
        open={willysOpen}
        onClose={() => setWillysOpen(false)}
        items={items}
      />
    </Page>
  )
}

function WillysIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M2 5l4 14 3-8 3 8 4-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 5l4 14 4-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}