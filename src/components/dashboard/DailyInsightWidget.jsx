import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import Card from '../ui/Card'
import { useLanguage } from '../../store/LanguageContext.jsx'
import { formatCurrency } from '../../utils/format'

export default function DailyInsightWidget({ income, expenses, savings }) {
  const { lang } = useLanguage()
  const isID = lang === 'id'
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      setLoading(true)

      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        // Fallback if no API key is provided
        const disposable = income - expenses - savings
        const ceiling = disposable * 40
        let generatedInsight = ''
        if (isID) {
          if (disposable < 0) {
            generatedInsight = "Peringatan: Pengeluaran dan tabunganmu melebihi pendapatan. Kurangi pengeluaran segera."
          } else if (disposable < 1000000) {
            generatedInsight = `Dengan sisa dana Rp${(disposable/1000000).toFixed(1)}jt/bln, sebaiknya fokus menambah dana darurat sebelum mengambil cicilan besar.`
          } else {
            generatedInsight = `Bagus! Dengan sisa uang dingin ${formatCurrency(disposable, 'IDR')}/bln, plafon kredit riil-mu sekitar ${formatCurrency(ceiling, 'IDR')}. Atau sabar 14 bulan lagi untuk nabung DP 30% lebih besar.`
          }
        } else {
          if (disposable < 0) {
            generatedInsight = "Warning: Your expenses and savings exceed your income. Please review your budget."
          } else if (disposable < 500) {
            generatedInsight = `With only ${formatCurrency(disposable, 'USD')}/mo left, focus on building your emergency fund rather than taking on new debt.`
          } else {
            generatedInsight = `Great job! With ${formatCurrency(disposable, 'USD')}/mo in free cash flow, your real debt ceiling is around ${formatCurrency(ceiling, 'USD')}. Or wait 14 months to save a 30% larger down payment.`
          }
        }

        if (isMounted) {
          setInsight(generatedInsight)
          setLoading(false)
        }
        return;
      }

      try {
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

        const systemPrompt = `You are an expert financial advisor. Provide a SINGLE, concise daily financial insight (max 2 sentences) based on the following user data. Do not use formatting like markdown or bullet points. Output raw text only.

User Data:
- Monthly Income: ${income}
- Monthly Expenses: ${expenses}
- Monthly Savings: ${savings}
- Disposable Income: ${income - expenses - savings}
- Currency format: ${isID ? 'IDR (Rp)' : 'USD ($)'}
- Language: ${isID ? 'Indonesian' : 'English'}`

        const response = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        })

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (text && isMounted) {
          setInsight(text.trim().replace(/^"|"$/g, ''))
        }
      } catch (error) {
        console.error("Failed to fetch daily insight from Gemini", error)
        if (isMounted) {
          setInsight(isID ? "Maaf, insight harian sedang tidak tersedia." : "Sorry, daily insight is currently unavailable.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Add a small debounce
    const timeout = setTimeout(fetchInsight, 1000)

    return () => {
      isMounted = false;
      clearTimeout(timeout)
    }
  }, [income, expenses, savings, isID])

  return (
    <Card className="mt-8 p-6 bg-emerald-950/20 border-emerald-500/20">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-emerald-400 mb-1">
            {isID ? 'Insight Finansial Harian' : 'Daily Financial Insight'}
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isID ? 'AI sedang menganalisis profilmu...' : 'AI is analyzing your profile...'}
            </div>
          ) : (
            <p className="text-sm text-zinc-300 leading-relaxed">
              {insight}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
