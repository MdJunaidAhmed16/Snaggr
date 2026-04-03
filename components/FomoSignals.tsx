import { clsx } from 'clsx'

interface FomoSignalsProps {
  views: number
  className?: string
}

export default function FomoSignals({ views, className }: FomoSignalsProps) {
  const isHighInterest = views > 10
  const interestLabel = isHighInterest ? 'High interest' : 'Trending'

  return (
    <div className={clsx('flex items-center gap-3 text-xs text-gray-400', className)}>
      <span className="flex items-center gap-1">
        <span aria-hidden="true">👁</span>
        <span>
          <span className="font-medium text-gray-300">{views}</span>{' '}
          {views === 1 ? 'person' : 'people'} viewed today
        </span>
      </span>
      <span className="text-gray-600">·</span>
      <span
        className={clsx(
          'flex items-center gap-1 font-medium',
          isHighInterest ? 'text-amber-400' : 'text-indigo-400'
        )}
      >
        <span aria-hidden="true">{isHighInterest ? '⚡' : '📈'}</span>
        {interestLabel}
      </span>
    </div>
  )
}
