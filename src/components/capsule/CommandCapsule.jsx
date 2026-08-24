import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExtraction } from '../../services/extraction'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { useAxiomStore } from '../../store/useAxiomStore'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * CommandCapsule — hero input bar (prototype match).
 * Single pill row: [ input ][ CAR | TECH | HOME chips ][ gold ANALYZE ]
 * Chips populate the input (never submit). Submit → Gemini → session →
 * navigate(/analyze/:sessionId) — flow preserved.
 */

const CHIPS = [
  { key: 'car', labelKey: 'dashboard.chipCar', exampleKey: 'dashboard.chipCarExample' },
  { key: 'tech', labelKey: 'dashboard.chipTech', exampleKey: 'dashboard.chipTechExample' },
  { key: 'home', labelKey: 'dashboard.chipHome', exampleKey: 'dashboard.chipHomeExample' },
]

export default function CommandCapsule() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { extract, loading: extracting } = useExtraction()

  const [input, setInput] = useState('')
  const [activeChip, setActiveChip] = useState(null)
  const [error, setError] = useState(null)

  const inputRef = useRef(null)

  // Chip → populate input only (spec: does NOT submit)
  const handleChipClick = (chip) => {
    setInput(t(chip.exampleKey))
    setActiveChip(chip.key)
    setError(null)
    inputRef.current?.focus()
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (activeChip) setActiveChip(null) // manual typing deselects chip
  }

  const handleSubmit = async () => {
    if (!input.trim() || extracting) return
    setError(null)
    try {
      const result = await extract(input) // await Gemini API
      if (result?.id) {
        useAxiomStore.getState().setCurrentScenario(result)
        useAxiomStore.getState().analyzePrompt(input)
        navigate(`/analyze/${result.id}`)
      }
    } catch (err) {
      console.error('Extraction failed:', err)
      setError(err.message || t('errors.extractionFailed'))
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
          placeholder={t('analyzer.placeholder')}
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

      {/* Inline error under the bar */}
      {error && (
        <motion.p
          className="mt-3 px-2 text-xs text-terracotta font-mono uppercase tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
          {' — '}
          <button onClick={() => setError(null)} className="underline hover:text-white">{t('common.retry')}</button>
        </motion.p>
      )}
    </div>
  )
}
