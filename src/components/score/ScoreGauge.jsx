import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/**
 * ScoreGauge — circular 0-100 gauge with red→amber→green zone gradation.
 *
 * Zones (per design direction):
 *   0-49  red    (danger)
 *   50-79 amber  (caution)
 *   80-100 green (safe)
 *
 * The active arc renders in the zone color; the zone segments are drawn
 * behind it so the user sees the full red→amber→green scale.
 */
export default function ScoreGauge({
  score,
  size = 200,
  strokeWidth = 14,
  isPreliminary = false,
  scoreLabel = '',
}) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'
  const statusLabel = scoreLabel || (score >= 80 ? 'SAFE' : score >= 50 ? 'WARNING' : 'DANGER')

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const offset = circumference - (animatedScore / 100) * circumference

  const gradientId = `score-gradient-${score}`

  const renderGradient = () => {
    if (score <= 33) {
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      )
    } else if (score <= 66) {
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="33%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      )
    } else {
      return (
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="33%" stopColor="#ef4444" />
          <stop offset="66%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      )
    }
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform">
        <defs>
          {renderGradient()}
        </defs>
        {/* Background track (optional, helps visualize full circle) */}
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
