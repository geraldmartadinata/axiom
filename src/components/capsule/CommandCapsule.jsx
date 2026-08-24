import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useExtraction } from '../../services/extraction'
import { extractNumbers } from '../../utils/extractNumbers'
import { computeOverallScore } from '../../utils/overallScore'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ScoreGauge from '../score/ScoreGauge'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Sparkles, Target } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * CommandCapsule — the main input on Dashboard.
 * Type a purchase scenario → extracts numbers → navigates to /analyze.
 * Auto-growing textarea with ghost placeholder animation.
 */

const EXAMPLES = [
  'dashboard.example1',
  'dashboard.example2',
  'dashboard.example3',
]

const typingExamples = [
  "Can I afford a Tesla Model 3 for $40k with $5k down over 60 months, earning $8k/month?",
  "Can I afford a studio apartment in Jakarta for 2B IDR, DP 500M, 30 years at 6.5%?",
  "Bisa beli Honda Civic RS Rp550jt DP Rp100jt cicil 60 bln, gaji Rp12jt/bln?",
]

export default function CommandCapsule() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { extract, loading: extracting } = useExtraction()
  const history = useAxiomStore(s => s.history)
  const profile = useAxiomStore(s => s.profile)
  const overallScore = useMemo(
    () => computeOverallScore(history, profile),
    [history, profile]
  )
  
  const [input, setInput] = useState('')
    const [ghostText, setGhostText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [exampleIndex, setExampleIndex] = useState(0)
    const [hasUserTyped, setHasUserTyped] = useState(false)
    const textareaRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    // Auto-grow textarea
    const adjustHeight = useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
      }
    }, [])

    useEffect(() => {
      adjustHeight()
    }, [input, adjustHeight])

    // Ghost placeholder typing animation - background only, not actual input
    useEffect(() => {
      if (hasUserTyped || extracting || input.trim()) {
        setGhostText('')
        setIsTyping(false)
        return
      }

      const cycleExamples = async () => {
        setIsTyping(true)
        const example = typingExamples[exampleIndex]
      
        for (let i = 0; i <= example.length; i++) {
          if (hasUserTyped || extracting || input.trim()) break
          setGhostText(example.slice(0, i))
          await new Promise(r => setTimeout(r, 30))
        }
      
        if (!hasUserTyped && !extracting && !input.trim()) {
          await new Promise(r => setTimeout(r, 2000))
          if (!hasUserTyped && !extracting && !input.trim()) {
            for (let i = example.length; i >= 0; i--) {
              if (hasUserTyped || extracting || input.trim()) break
              setGhostText(example.slice(0, i))
              await new Promise(r => setTimeout(r, 15))
            }
            setExampleIndex((prev) => (prev + 1) % typingExamples.length)
          }
        }
        setIsTyping(false)
      }

      typingTimeoutRef.current = setTimeout(cycleExamples, 1000)
      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      }
    }, [exampleIndex, hasUserTyped, extracting, input, lang, adjustHeight])

    const handleChange = (e) => {
      const value = e.target.value
      setInput(value)
      if (!hasUserTyped && value.trim()) {
        setHasUserTyped(true)
      } else if (hasUserTyped && !value.trim()) {
        setHasUserTyped(false)
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const [submitError, setSubmitError] = useState(null)
  
  const handleSubmit = async () => {
    if (!input.trim() || extracting) return
    
    setSubmitError(null)
    try {
      const result = await extract(input)
      if (result?.id) {
        // Add to history and set as current
        useAxiomStore.getState().setCurrentScenario(result)
        useAxiomStore.getState().analyzePrompt(input)
        navigate(`/analyze/${result.id}`)
      }
    } catch (err) {
      console.error('Extraction failed:', err)
      setSubmitError(err.message || 'Analysis failed. Please try again.')
    }
  }

  const handleExampleClick = (exampleKey) => {
    const exampleText = t(exampleKey)
    setInput(exampleText)
    setHasUserTyped(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    adjustHeight()
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Overall Health Score Badge */}
      {overallScore.confirmedCount > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="rounded-2xl border border-white/[6%] bg-zinc-900/60 backdrop-blur-xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sand/10 border border-sand/20 grid place-items-center shrink-0">
                  <Target className="h-6 w-6 text-sand" />
                </div>
                <div>
                  <p className="font-display text-sm font-medium text-zinc-400">{t('dashboard.overallTitle')}</p>
                  <p className="font-display text-2xl font-bold text-sand tabular-nums">{overallScore.score}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-display text-xs uppercase tracking-wider text-zinc-500">{t('cards.overall.debtFactor')}</p>
                  <p className="font-display text-lg font-bold text-terracotta">{overallScore.factors.debt}%</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xs uppercase tracking-wider text-zinc-500">{t('cards.overall.emergencyFactor')}</p>
                  <p className="font-display text-lg font-bold text-golden">{overallScore.factors.emergency}%</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xs uppercase tracking-wider text-zinc-500">{t('cards.overall.savingsFactor')}</p>
                  <p className="font-display text-lg font-bold text-sand">{overallScore.factors.savings}%</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xs uppercase tracking-wider text-zinc-500">{t('cards.overall.dpFactor')}</p>
                  <p className="font-display text-lg font-bold text-sand">{overallScore.factors.dp}%</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Input Card - Stitch Style */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="relative overflow-hidden p-6 sm:p-8">
          {/* Accent top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-golden to-sand" />
          
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <motion.h1 
                className="font-display text-3xl sm:text-4xl font-light text-white tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <span className="font-normal">{t('dashboard.title')}</span>
                <span className="font-bold text-sand"> {t('dashboard.titleAccent')}</span>
              </motion.h1>
              <motion.p 
                className="mt-3 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {t('dashboard.subtitle')}
              </motion.p>
            </div>

            {/* Input Area */}
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <div className="relative">
                            {/* Ghost text overlay - behind textarea */}
                            {ghostText && !input.trim() && (
                              <div
                                className="absolute inset-5 pointer-events-none text-zinc-600 font-medium text-base leading-relaxed overflow-hidden"
                                style={{
                                  fontFamily: 'inherit',
                                  lineHeight: '1.6',
                                  whiteSpace: 'pre-wrap',
                                  wordWrap: 'break-word',
                                }}
                                aria-hidden="true"
                              >
                                {ghostText}
                              </div>
                            )}
                
                            <textarea
                              ref={textareaRef}
                              value={input}
                              onChange={handleChange}
                              onKeyDown={handleKeyDown}
                              placeholder={!hasUserTyped && !ghostText ? t('analyzer.placeholder') : ''}
                              className="relative w-full min-h-[100px] max-h-[200px] bg-zinc-950/50 border border-white/[6%] rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:border-sand/50 focus:outline-none focus:ring-2 focus:ring-sand/20 resize-none transition-all duration-200 font-medium text-base leading-relaxed bg-transparent"
                              style={{
                                fontFamily: 'inherit',
                                lineHeight: '1.6',
                              }}
                              disabled={extracting}
                              aria-label={t('analyzer.placeholder')}
                            />
                          </div>
            
                          {/* Ghost typing indicator - only when not typed and not extracting */}
                          {isTyping && !hasUserTyped && !input.trim() && !ghostText && (
                            <motion.div 
                              className="absolute bottom-3 right-3 flex items-center gap-1.5 text-zinc-500 text-xs"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-sand animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-sand animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-sand animate-bounce" style={{ animationDelay: '300ms' }} />
                            </motion.div>
                          )}

                          {/* Submit Button */}
                          <Button
                            variant="primary"
                            size="lg"
                            className="absolute bottom-4 right-4"
                            onClick={handleSubmit}
                            disabled={!input.trim() || extracting}
                            loading={extracting}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </motion.div>

            {/* Examples */}
            <motion.div
              className="pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3 text-center">{t('common.try') || 'Try:'}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((exKey, idx) => (
                  <motion.button
                    key={exKey}
                    onClick={() => handleExampleClick(exKey)}
                    className="px-3 py-1.5 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all duration-200 whitespace-nowrap"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                  >
                    {t(exKey)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* AI Status */}
            <motion.div
              className="flex items-center justify-center gap-2 text-xs text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-sand" />
              <span>{t('analyzer.status')}</span>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Scroll Hint */}
      <motion.div
        className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-wider">{t('dashboard.scrollHint')}</p>
        <motion.div
          className="w-1 h-6 rounded-full bg-gradient-to-b from-zinc-500 to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
