import { useEffect, useState } from 'react'

export default function ScoreGauge({ score, size = 200, strokeWidth = 12, isPreliminary = false, scoreLabel = '' }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const color = score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171'
  const statusLabel = scoreLabel || (score >= 80 ? 'SAFE' : score >= 50 ? 'WARNING' : 'DANGER')

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
        {/* Score number */}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          style={{ fontSize: size * 0.24, fontWeight: 900, letterSpacing: '-0.05em' }}
        >
          {score}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          style={{ fontSize: size * 0.06, fontWeight: 700, letterSpacing: '0.05em' }}
        >
          {statusLabel}
        </text>
      </svg>
      {isPreliminary && (
        <span className="mt-2 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold">
          Preliminary Score
        </span>
      )}
    </div>
  )
}
