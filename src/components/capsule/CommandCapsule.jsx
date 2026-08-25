import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * CommandCapsule — hero input bar (prototype match).
 * Single pill row: [ input ][ CAR | TECH | HOME chips ][ gold ANALYZE ]
 * Chips populate the input (never submit). Submit → Gemini → session →
 * navigate(/analyze/:sessionId) — flow preserved.
 *
 * Placeholder runs a typewriter loop (type → hold → delete → next example),
 * pausing while the input is focused or has text; resumes ~3s after the
 * field is cleared and blurred. Disabled entirely under
 * prefers-reduced-motion (static first example instead).
 */

const TYPE_MS = 50
const HOLD_MS = 2000
const DELETE_MS = 25
const GAP_MS = 400
const RESUME_IDLE_MS = 3000

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

/**
 * Typewriter placeholder. Returns the string to render in the input's
 * placeholder attribute (including a "|" caret while typing/deleting/holding).
 * Single interval-chain in a ref; one small setState per character —
 * contained to this component. Cleans up on unmount/pause.
 */
function useTypingPlaceholder(examples, active) {
  const [frame, setFrame] = useState({ text: '', caret: false })
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!active || !Array.isArray(examples) || examples.length === 0) return undefined

    const st = { i: 0, pos: 0, phase: 'typing' }

    const step = () => {
      const ex = String(examples[st.i] ?? '')
      let delay = TYPE_MS
      let caret = true

      if (st.phase === 'typing') {
        st.pos += 1
        setFrame({ text: ex.slice(0, st.pos), caret })
        if (st.pos >= ex.length) { st.phase = 'holding'; delay = HOLD_MS }
      } else if (st.phase === 'holding') {
        setFrame({ text: ex, caret: true }) // keep blinking caret during hold
        st.phase = 'deleting'
        delay = DELETE_MS
      } else if (st.phase === 'deleting') {
        st.pos -= 1
        if (st.pos <= 0) {
          setFrame({ text: '', caret: false })
          st.phase = 'gap'
          delay = GAP_MS
        } else {
          setFrame({ text: ex.slice(0, st.pos), caret })
        }
      } else { // gap between examples
        st.i = (st.i + 1) % examples.length
        st.phase = 'typing'
        caret = false
        delay = TYPE_MS
      }
      timerRef.current = setTimeout(step, delay)
    }

    timerRef.current = setTimeout(step, TYPE_MS)
    return () => clearTimeout(timerRef.current)
  }, [active, examples])

  return frame.caret ? `${frame.text}|` : frame.text
}

const CHIPS = [
  { key: 'car', labelKey: 'dashboard.chipCar', exampleKey: 'dashboard.chipCarExample' },
  { key: 'tech', labelKey: 'dashboard.chipTech', exampleKey: 'dashboard.chipTechExample' },
  { key: 'home', labelKey: 'dashboard.chipHome', exampleKey: 'dashboard.chipHomeExample' },
]

export default function CommandCapsule() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [everTyped, setEverTyped] = useState(false) // stop animation once real input happens
  const [resumeOk, setResumeOk] = useState(true) // gates the ~3s idle before resuming
  const [activeChip, setActiveChip] = useState(null)
  const [error, setError] = useState(null)
  const [extracting, setExtracting] = useState(false)

  const inputRef = useRef(null)
  const resumeTimer = useRef(null)

  const reducedMotion = usePrefersReducedMotion()
  const examples = useMemo(() => {
    const raw = t('dashboard.examples')
    return Array.isArray(raw) ? raw.map(String) : []
  }, [t])

  const hasText = input.trim().length > 0
  const typingActive = !reducedMotion && !everTyped && !focused && !hasText && resumeOk && examples.length > 0
  const animatedPlaceholder = useTypingPlaceholder(examples, typingActive)

  const placeholder = hasText
    ? ''
    : reducedMotion
      ? (examples[0] || '')
      : animatedPlaceholder // frozen frame while focused; empty while waiting to resume

  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  // Chip → populate input only (spec: does NOT submit)
  const handleChipClick = (chip) => {
    setInput(t(chip.exampleKey))
    setEverTyped(false) // chip text is disposable — let the animation come back later
    setActiveChip(chip.key)
    setError(null)
    inputRef.current?.focus()
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (e.target.value.trim()) setEverTyped(true) // permanent stop on real typing
    setActiveChip(null)
  }

  const handleBlur = () => {
    setFocused(false)
    // cleared + blurred → resume the loop FROM THE START after ~3s idle
    if (!input.trim()) {
      clearTimeout(resumeTimer.current)
      setResumeOk(false)
      resumeTimer.current = setTimeout(() => {
        setEverTyped(false)
        setResumeOk(true)
      }, RESUME_IDLE_MS)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || extracting) return
    setError(null)
    setExtracting(true)
    try {
      // SINGLE pipeline run: extract → enrich → store (with unique ID) → returns the stored session.
      const session = await useAxiomStore.getState().analyzePrompt(input)
      if (!session?.id) throw new Error('Session was not created')
      setInput('') // success → clear input; typewriter resumes after idle
      navigate(`/analyze/${session.id}`)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || t('errors.extractionFailed'))
      // No navigation, no broken session — stays on page with inline error.
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Single pill row */}
      <motion.div
        className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 rounded-[999px] bg-zinc-950/70 border border-white/[7%] p-2 pl-5 sm:pl-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={extracting}
          className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-60 py-3 lg:py-0"
          aria-label={t('analyzer.placeholder')}
        />

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Category chips */}
          {CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleChipClick(chip)}
              className={`px-3.5 py-1.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${activeChip === chip.key ? 'border-amber-400 text-amber-300 bg-amber-400/10' : 'border-white/[9%] text-zinc-500 hover:text-white hover:border-white/20'}`}
            >
              {t(chip.labelKey)}
            </button>
          ))}

          {/* ANALYZE button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || extracting}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-widest transition-all ${!input.trim() || extracting ? 'bg-amber-400/40 text-zinc-500 cursor-not-allowed shadow-none' : 'bg-amber-400 text-zinc-950 hover:shadow-[0_0_28px_rgba(232,196,122,0.45)] hover:-translate-y-px'}`}
          >
            {extracting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {extracting ? t('dashboard.analyzingButton') : t('analyzer.cta')}
          </button>
        </div>
      </motion.div>

      {/* Inline error under the bar — never navigate, never leave a broken session */}
      {error && (
        <motion.div
          className="mt-3 mx-2 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs font-mono uppercase tracking-wide text-terracotta">
            {t('errors.analysisFailed')}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400 break-words">{error}</p>
          <button onClick={() => setError(null)} className="mt-1.5 text-[11px] underline text-zinc-500 hover:text-white">
            {t('common.retry')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
