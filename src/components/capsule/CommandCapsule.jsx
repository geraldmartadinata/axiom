import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAxiomStore } from '../../store/useAxiomStore'
import { useLanguage } from '../../store/LanguageContext.jsx'
import Button from '../ui/Button'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CommandCapsule() {
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const { isAnalyzing, analyzeError, analyzePrompt } = useAxiomStore()
  const { t } = useLanguage()

  const examples = [
    t('dashboard.example1'),
    t('dashboard.example2'),
    t('dashboard.example3'),
  ]

  const handleSubmit = async () => {
    if (!text.trim() || isAnalyzing) return
    await analyzePrompt(text)
    if (!useAxiomStore.getState().analyzeError) navigate('/analyze')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('dashboard.placeholder')}
          rows={3}
          className="w-full bg-zinc-950/60 backdrop-blur-md border border-white/[6%] rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[15%] transition-colors resize-none text-base"
        />
      </div>

      {analyzeError && (
        <p className="mt-3 text-sm text-red-400">{analyzeError}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-zinc-600">{t('dashboard.placeholder').includes('iPhone') ? 'Tekan Ctrl+Enter untuk analisis' : 'Press Ctrl+Enter to analyze'}</p>
        <Button onClick={handleSubmit} loading={isAnalyzing} disabled={!text.trim()}>
          {isAnalyzing ? t('dashboard.analyzingButton') : t('dashboard.analyzeButton')}
          {!isAnalyzing && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {!text && (
        <div className="mt-8 space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{t('dashboard.examples')}</p>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="block w-full text-left px-4 py-2.5 rounded-xl bg-zinc-900/40 border border-white/[4%] text-sm text-zinc-400 hover:text-white hover:border-white/[10%] transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}