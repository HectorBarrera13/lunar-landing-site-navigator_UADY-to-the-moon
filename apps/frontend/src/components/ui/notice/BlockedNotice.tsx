import { ICON_BUTTON, PANEL, SECTION_TITLE } from '@/components/ui/common/styles'
import { useAppStore } from '@/store'
import { NOTICE_UI_STRINGS as S } from './strings'

/**
 * Educational alert for a blocked selection (`blockedNotice`, e.g. a far-side click, R-10/R-11).
 * Placed top-left below the 112 px top bar, above the horizon panel column, so it is visible in
 * both the globe and the 2D view without covering the top bar, the 2D viewport or the sidebar.
 * No auto-dismiss: the user closes it (or a valid focus clears it in the store).
 */
export default function BlockedNotice() {
  const notice = useAppStore((s) => s.blockedNotice)
  const setBlockedNotice = useAppStore((s) => s.setBlockedNotice)

  if (notice === null) return null

  return (
    <div
      role="alert"
      className={`${PANEL} pointer-events-auto absolute top-32 left-4 z-30 flex w-[560px] max-w-[calc(100vw-2rem)] items-start gap-2 border-l-2 border-l-primary p-3`}
    >
      <span aria-hidden="true" className="font-mono text-sm leading-5 text-primary">
        {'⊘'}
      </span>
      <div className="min-w-0 flex-1">
        <p className={SECTION_TITLE}>{S.title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">{notice}</p>
      </div>
      <button type="button" onClick={() => setBlockedNotice(null)} aria-label={S.dismiss} className={ICON_BUTTON}>
        <span aria-hidden="true">{'✕'}</span>
      </button>
    </div>
  )
}
