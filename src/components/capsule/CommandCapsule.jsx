import { useState, useEffect, useRef } from 'react'
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

  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const typingSpeed = 1000 / examples[currentExampleIndex].length
  const deletingSpeed = 1000 / examples[currentExampleIndex].length
  const currentExample = examples[currentExampleIndex]
  const isFocusedRef = useRef(false)

  useEffect(() => {
    if (isFocusedRef.current || text) return

    let timeout

    if (isTyping) {
      if (displayedText.length < currentExample.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentExample.slice(0, displayedText.length + 1))
        }, typingSpeed)
      } else {
        setIsTyping(false)
        // Wait 3 seconds, cursor blinks
        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, 3000)
      }
    } else if (isDeleting) {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentExample.slice(0, displayedText.length - 1))
        }, deletingSpeed)
      } else {
        setIsDeleting(false)
        // Wait 1 second before typing next
        timeout = setTimeout(() => {
          setCurrentExampleIndex((prev) => (prev + 1) % examples.length)
          setIsTyping(true)
        }, 1000)
      }
    }

    return () => clearTimeout(timeout)
  }, [displayedText, isTyping, isDeleting, currentExample, currentExampleIndex, examples, text, typingSpeed, deletingSpeed])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

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
        <div className="absolute inset-0 pointer-events-none px-5 py-4 text-base whitespace-pre-wrap break-words">
          {(!text && !isFocusedRef.current) && (
            <span className="text-zinc-600">
              {displayedText}
              <span className={`inline-block w-[2px] h-[1.1em] ml-0.5 align-middle bg-zinc-400 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
            </span>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => isFocusedRef.current = true}
          onBlur={() => {
            isFocusedRef.current = false;
            if (!text) {
              setDisplayedText('');
              setIsTyping(true);
              setIsDeleting(false);
            }
          }}
          placeholder=""
          rows={3}
          className="w-full bg-zinc-950/60 backdrop-blur-md border border-white/[6%] rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[15%] transition-colors resize-none text-base relative z-10 bg-transparent"
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
    </div>
  )
}