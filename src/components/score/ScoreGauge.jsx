import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

/**
 * ScoreGauge — circular 0-100 gauge with personalized gradient and label.
 *
 * Score → label mapping (per Stitch AI design):
 *   ≤10        → "Very Bad" (pure red / terracotta)
 *   11-20      → "Bad"
 *   21-33      → "Poor"
 *   34-49      → "Fair"
 *   50-66      → "Intermediate" (red→yellow)
 *   67-79      → "Good"
 *   80-89      → "Pretty Good"
 *   90-96      → "Healthy"
 *   97-100     → "Perfect" (green / sand)
 *
 * If no purchases confirmed → "No purchase made"
 *
 * Gradient: red (terracotta) → yellow (golden) → green (sand) based on score.
 */
export default function ScoreGauge({ 
  score, 
  isPreliminary = false, 
  scoreLabel = '',
  labels = {},
  size = 200,
  showArcLabels = false,
}) {
  // Determine personalized label from score
  const personalizedLabel = useMemo(() => {
    if (score === 0) return labels.noPurchase || 'No purchase made'
    if (score <= 10) return labels.veryBad || 'Very Bad'
    if (score <= 20) return labels.bad || 'Bad'
    if (score <= 33) return labels.poor || 'Poor'
    if (score <= 49) return labels.fair || 'Fair'
    if (score <= 66) return labels.intermediate || 'Intermediate'
    if (score <= 79) return labels.good || 'Good'
    if (score <= 89) return labels.prettyGood || 'Pretty Good'
    if (score <= 96) return labels.healthy || 'Healthy'
    return labels.perfect || 'Perfect'
  }, [score, labels])

  // Gradient stops for arc (terracotta → golden → sand)
  const gradientStops = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, score))
    const pct = clamped / 100
    return [
      { offset: 0, color: '#e76f51' },    // terracotta
      { offset: 0.5, color: '#e9c46a' },  // golden
      { offset: 1, color: '#d4a373' },    // sand
    ]
  }, [score])

  // SVG arc calculations
  const radius = (size - 24) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)

  const arcGradientId = `arc-gradient-${score}-${size}`
  const bgGradientId = `bg-gradient-${size}`

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const labelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <motion.div 
      className={cn('relative flex flex-col items-center', 'w-full')}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <defs>
            <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e76f51" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#e9c46a" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#d4a373" stopOpacity={0.15} />
            </linearGradient>
            {/* Foreground arc gradient */}
            <linearGradient id={arcGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e76f51" />
              <stop offset="50%" stopColor="#e9c46a" />
              <stop offset="100%" stopColor="#d4a373" />
            </linearGradient>
          </defs>
          
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${bgGradientId})`}
            strokeWidth={12}
            strokeLinecap="round"
          />
          
          <AnimatePresence mode="wait">
            <motion.circle
              key={score}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${arcGradientId})`}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: 'drop-shadow(0 4px 12px rgba(212, 163, 115, 0.4))' }}
            />
          </AnimatePresence>

          {/* Arc labels if enabled */}
          {showArcLabels && (
            <>
              <text 
                x={size / 2 + radius + 16} 
                y={size / 2 - radius - 8} 
                textAnchor="start" 
                dominantBaseline="middle"
                className="text-xs text-terracotta font-medium"
              >
                {labels.veryBad || 'Very Bad'}
              </text>
              <text 
                x={size / 2 + radius + 16} 
                y={size / 2 + 8} 
                textAnchor="start" 
                dominantBaseline="middle"
                className="text-xs text-golden font-medium"
              >
                {labels.intermediate || 'Intermediate'}
              </text>
              <text 
                x={size / 2 + radius + 16} 
                y={size / 2 + radius + 8} 
                textAnchor="start" 
                dominantBaseline="middle"
                className="text-xs text-sand font-medium"
              >
                {labels.perfect || 'Perfect'}
              </text>
            </>
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            className="text-center"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tighter">
              {isPreliminary ? '—' : score}
            </div>
            <div className={cn(
              'font-display text-sm sm:text-base mt-2 tracking-wide',
              isPreliminary ? 'text-zinc-500' : 'text-white'
            )}>
              {isPreliminary ? (labels.prelim || 'Preliminary') : personalizedLabel}
            </div>
            {isPreliminary && (
              <motion.span
                className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta/10 text-terracotta border border-terracotta/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <span className="relative h-1.5 w-1.5 rounded-full bg-terracotta animate-pulse" />
                {labels.prelim || 'Preliminary'}
              </motion.span>
            )}
          </motion.div>
        </div>
      </div>

      {/* External score label (from engine) */}
      {scoreLabel && !isPreliminary && (
        <motion.p 
          className="mt-4 text-sm text-zinc-400 text-center font-display"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {scoreLabel}
        </motion.p>
      )}
    </motion.div>
  )
}
