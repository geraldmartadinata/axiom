import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/**
 * ScoreGauge — circular 0-100 gauge with personalized gradient and label.
 *
 * Score → label mapping (per Stitch design):
 *   97-100: Perfect  (green)
 *   90-96:  Very Healthy (green)
 *   80-89:  Healthy (green)
 *   67-79:  Pretty Good (yellow-green)
 *   50-66:  Intermediate (yellow)
 *   34-49:  Fair (yellow-orange)
 *   21-33:  Poor (orange)
 *   11-20:  Bad (orange-red)
 *   0-10:   Very Bad (red)
 *
 * The gradient uses the full red→yellow→green spectrum based on the score.
 */
export default function ScoreGauge({
  score,
  size = 200,
  strokeWidth = 14,
  isPreliminary = false,
  scoreLabel = '',
  labels = {}, // optional i18n labels passed from parent
}) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Determine personalized label and color based on score
  const getScoreMeta = (s) => {
    if (s >= 97) return { label: labels.perfect || 'Perfect', color: '#4ade80' }
    if (s >= 90) return { label: labels.veryHealthy || 'Very Healthy', color: '#4ade80' }
    if (s >= 80) return { label: labels.healthy || 'Healthy', color: '#a3e635' }
    if (s >= 67) return { label: labels.prettyGood || 'Pretty Good', color: '#c0e635' }
    if (s >= 50) return { label: labels.intermediate || 'Intermediate', color: '#facc15' }
    if (s >= 34) return { label: labels.fair || 'Fair', color: '#f59e0b' }
    if (s >= 21) return { label: labels.poor || 'Poor', color: '#fb923c' }
    if (s >= 11) return { label: labels.bad || 'Bad', color: '#f87171' }
    return { label: labels.veryBad || 'Very Bad', color: '#ef4444' }
  }

  const meta = getScoreMeta(score)
  const statusLabel = scoreLabel || meta.label
  const color = meta.color

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const offset = circumference - (animatedScore / 100) * circumference

  const gradientId = `score-gradient-${score}`

  const renderGradient = () => {
    // Smooth red→yellow→green gradient based on the score
    const stops = [
      { offset: '0%', color: '#ef4444' },
      { offset: '33%', color: '#ef4444' },
      { offset: '50%', color: '#facc15' },
      { offset: '66%', color: '#a3e635' },
      { offset: '100%', color: '#4ade80' },
    ]
    return (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        {stops.map(stop => (
          <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
        ))}
      </linearGradient>
    )
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform">
        <defs>
          {renderGradient()}
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Active progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease' }}
        />
        {/* Score number */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          className="tabular-nums"
          style={{ fontSize: size * 0.24, fontWeight: 700, letterSpacing: '-0.04em', fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {animatedScore}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          style={{ fontSize: size * 0.06, fontWeight: 700, letterSpacing: '0.08em' }}
        >
          {statusLabel}
        </text>
      </svg>
      {isPreliminary && (
        <span className={cn(
          'mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold',
          'bg-amber-500/10 text-amber-400'
        )}>
          Preliminary Score
        </span>
      )}
    </div>
  )
}
