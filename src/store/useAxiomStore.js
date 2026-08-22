import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { extractAndEnrich } from '../services/extraction'

const MAX_HISTORY = 50

export const useAxiomStore = create(
  persist(
    (set, get) => ({
      // --- state ---
      currentScenario: null,
      isAnalyzing: false,
      analyzeError: null,
      history: [],
      profile: null,
      currency: 'IDR',            // global default; sessions store their own

      // --- actions ---
      analyzePrompt: async (prompt) => {
        if (!prompt || !prompt.trim()) return
        set({ isAnalyzing: true, analyzeError: null })
        try {
          const enriched = await extractAndEnrich(prompt.trim())
          enriched.currency = get().currency
          enriched.status = 'ANALYZED'
          set({
            currentScenario: enriched,
            isAnalyzing: false,
            history: [enriched, ...get().history].slice(0, MAX_HISTORY),
          })
        } catch (err) {
          set({ isAnalyzing: false, analyzeError: err.message })
        }
      },

      loadFromHistory: (id) => {
        const scenario = get().history.find(s => s.id === id)
        if (scenario) set({ currentScenario: scenario })
      },

      deleteFromHistory: (id) => {
        set({ history: get().history.filter(s => s.id !== id) })
      },

      /** Mark a session as CONFIRMED (user actually bought it). */
      confirmPurchase: (id, overrides = {}) => {
        set({
          history: get().history.map(s => {
            if (s.id !== id) return s
            return {
              ...s,
              status: 'CONFIRMED',
              confirmed_at: new Date().toISOString(),
              confirmation: {
                final_price: overrides.final_price ?? s.financials?.base_price,
                final_down_payment: overrides.final_down_payment ?? s.financials?.down_payment,
                final_term_months: overrides.final_term_months ?? s.financials?.tenor_months,
              },
            }
          }),
        })
      },

      /** Undo a confirmation. */
      unconfirmPurchase: (id) => {
        set({
          history: get().history.map(s =>
            s.id === id ? { ...s, status: 'ANALYZED', confirmation: undefined, confirmed_at: undefined } : s
          ),
        })
      },

      setCurrency: (currency) => set({ currency }),

      saveProfile: (data) => {
        const profile = { ...data, updated_at: new Date().toISOString() }
        set({ profile })
      },
    }),
    {
      name: 'axiom-storage',
      version: 2,
      partialize: (state) => ({
        history: state.history,
        profile: state.profile,
        currency: state.currency,
      }),
    }
  )
)
