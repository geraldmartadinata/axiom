import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { cn } from '../../utils/cn'
import { ArrowRight, Car, Home, Smartphone, Zap } from 'lucide-react'

const CATEGORIES = ['auto', 'house', 'tech'] // auto|house|tech — icons below

const CATEGORY_META = {
  auto:   { icon: Car,        key: 'cat.auto' },
  house:  { icon: Home,       key: 'cat.house' },
  tech:   { icon: Smartphone, key: 'cat.tech' },
}

/**
 * The neon AI analyzer input.
 * - emerald left border + focus glow (v0 style)
 * - category chips with Lucide icons (NO emojis)
 * - typing-effect recommendations while idle
 */
export default function CommandCapsule({ autoFocus = false }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('auto')
  const [typing, setTyping] = useState('')
  const [typingIndex, setTypingIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const navigate = useNavigate()
  const { isAnalyzing, analyzeError, analyzePrompt } = useAxiomStore()
  const { t, lang } = useLanguage()
  const typingRef = useRef(null)

  const examples = [
    t('dashboard.example1'),
    t('dashboard.example2'),
    t('dashboard.example3'),
  ]

  // Typing effect: cycles through examples, type → pause → erase
  useEffect(() => {
    if (text) { setTyping(''); return }
    let cancelled = false
    const step = () => {
      if (cancelled) return
      const current = examples[typingIndex % examples.length]
      if (charIndex < current.length) {
        setTyping(current.slice(0, charIndex + 1))
        setCharIndex(c => c + 1)
        typingRef.current = setTimeout(step, 32)
      } else {
        typingRef.current = setTimeout(() => {
          setTyping('')
          setCharIndex(0)
          setTypingIndex(i => i + 1)
        }, 2200)
      }
    }
    step()
    return () => { cancelled = true; clearTimeout(typingRef.current) }
  }, [charIndex, typingIndex, text, examples, lang])

  const handleSubmit = async () => {
    if (!text.trim() || isAnalyzing) return
    const ok = await analyzePrompt(text.trim())
    // navigate to the session page on success
    const state = useAxiomStore.getState()
    if (!state.analyzeError && state.currentScenario?.id) {
      navigate(`/analyze/${state.currentScenario.id}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  const hasText = text.trim().length > 0

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'relative rounded-2xl border border-white/10 border-l-2 border-l-emerald-400',
          'bg-zinc-900/70 backdrop-blur-xl saturate-150 p-5 shadow-2xl shadow-black/40',
          'transition-all duration-300',
          hasText && 'shadow-[0_0_40px_rgba(34,211,238,0.08)]'
        )}
      >
        {/* input */}
        <div className="relative min-h-[72px]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('analyzer.placeholder')}
            rows={2}
            autoFocus={autoFocus}
            className="w-full bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-white placeholder:text-zinc-600"
          />
          {/* typing-effect ghost text (only when idle) */}
          {!hasText && !isAnalyzing && (
            <div className="absolute inset-0 pointer-events-none flex items-start pt-0">
              <span className="text-[15px] leading-relaxed text-zinc-700">{typing}<span className="inline-block w-[2px] h-[1.1em] bg-emerald-400/70 ml-0.5 align-middle animate-pulse" /></span>
            </div>
          )}
        </div>

        {/* chips + CTA */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat]
              const Icon = meta.icon
              const active = category === cat
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                    active
                      ? 'bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                      : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white hover:border-white/20'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(meta.key)}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!hasText || isAnalyzing}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              hasText && !isAnalyzing
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:shadow-[0_0_36px_rgba(34,211,238,0.45)] hover:-translate-y-px active:translate-y-0'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            )}
          >
            {isAnalyzing ? t('dashboard.analyzingButton') : t('dashboard.analyzeButton')}
            {!isAnalyzing && <Zap className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {analyzeError && (
        <p className="mt-3 text-sm text-red-400 animate-fade-in">{analyzeError}</p>
      )}

      {/* example quick-picks when idle */}
      {!hasText && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-500 hover:text-white hover:border-white/20 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
