import { BUTTON_PRIMARY } from '@/components/ui/common/styles'
import { useAppStore } from '@/store'
import { LANDING_BUTTON_STRINGS as S } from './strings'

/** Bottom-centered action that opens the 2D "Landing zone" window for the selected point. */
export default function ShowLandingSiteButton() {
  const hasFocus = useAppStore((s) => s.focus !== null)
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)

  if (!hasFocus || mode !== '3d') return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
      <button type="button" onClick={() => setMode('2d')} className={`${BUTTON_PRIMARY} pointer-events-auto h-10 px-6`}>
        {S.show}
      </button>
    </div>
  )
}
