import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@blinkdotnew/ui'
import { Copy, Check, ExternalLink, ShoppingCart } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

interface ShoppingItem {
  name: string
  amount: number | string
  unit: string
  checked?: boolean
}

interface WillysExportModalProps {
  open: boolean
  onClose: () => void
  items: ShoppingItem[]
}

function formatForWillys(items: ShoppingItem[]): string {
  return items
    .filter(item => !item.checked)
    .map(item => {
      const parts = [
        item.amount ? String(item.amount) : '',
        item.unit || '',
        capitalize(item.name),
      ].filter(Boolean)
      return parts.join(' ')
    })
    .join('\n')
}

function capitalize(str: string) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const WILLYS_LIST_URL = 'https://www.willys.se/artikel/listsok'

export function WillysExportModal({ open, onClose, items }: WillysExportModalProps) {
  const [copied, setCopied] = useState(false)
  const { t } = useLang()

  const uncheckedItems = items.filter(i => !i.checked)
  const listText = formatForWillys(items)

  const copyAndOpen = async () => {
    try {
      await navigator.clipboard.writeText(listText)
    } catch {
      const el = document.getElementById('willys-list-text') as HTMLTextAreaElement
      if (el) { el.select(); document.execCommand('copy') }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    window.open(WILLYS_LIST_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setCopied(false) } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#e4002b] flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">{t('willys_title')}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {uncheckedItems.length} {t('willys_items_count')}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* How it works */}
        <div className="bg-[#e4002b]/5 border border-[#e4002b]/20 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{t('willys_how_title')}</p>
          <ol className="space-y-1.5">
            {([
              t('willys_step1'),
              t('willys_step2'),
              t('willys_step3'),
              t('willys_step4'),
            ] as string[]).map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#e4002b] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('willys_your_list')}</p>
            <Badge variant="secondary">{uncheckedItems.length} {t('willys_items')}</Badge>
          </div>
          <textarea
            id="willys-list-text"
            readOnly
            value={listText}
            rows={Math.min(uncheckedItems.length + 1, 8)}
            className="w-full text-sm font-mono bg-muted/50 border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#e4002b]/30"
          />
          <p className="text-xs text-muted-foreground">{t('willys_unchecked_note')}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            className="flex-1 bg-[#e4002b] hover:bg-[#c4001f] text-white font-bold gap-2"
            onClick={copyAndOpen}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {t('willys_copied')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t('willys_copy_open')}
              </>
            )}
            <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('willys_cancel')}
          </Button>
        </div>

        {copied && (
          <p className="text-center text-xs text-[#e4002b] font-medium animate-pulse">
            {t('willys_confirm')}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
