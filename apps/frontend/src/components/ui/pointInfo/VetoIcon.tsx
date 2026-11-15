import { useId } from 'react'

/** Veto marker: red disc with the X cut out (transparent), drawn in the traffic-light red token. */
export default function VetoIcon() {
  const maskId = useId()
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px size-3.5 shrink-0 text-light-red">
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="#fff" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="#000" strokeWidth="2.6" strokeLinecap="round" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="11" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
