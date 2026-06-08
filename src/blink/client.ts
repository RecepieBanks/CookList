import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'cooklist-mvp-app-v6igt83b',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_yjjaZ3XhsBqVp728AVzNaGQ4pTbtVkyz',
  authRequired: false,
  auth: { mode: 'managed' },
})
