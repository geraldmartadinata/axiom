import { create } from 'zustand'
import { extractAndEnrich } from '../services/extraction'
import { enrichScenario } from '../utils/calculations'

const HISTORY_KEY = 'axiom_history'
const PROFILE_KEY = 'axiom_profile'
const MAX_HISTORY = 50

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistoryToStorage(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (e) { console.error('Failed to save history:', e) }
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getProfile() {
  return loadProfileFromStorage()
}

export function saveScenarioToHistory(scenario) {
  const state = useAxiomStore.getState()
  const newHistory = [scenario, ...state.history].slice(0, MAX_HISTORY)
  saveHistoryToStorage(newHistory)
  useAxiomStore.setState({ history: newHistory })
}

export const useAxiomStore = create((set, get) => ({
  currentScenario: null,
  isAnalyzing: false,
  analyzeError: null,
  history: loadHistoryFromStorage(),
  profile: loadProfileFromStorage(),

  analyzePrompt: async (prompt) => {
    if (!prompt || !prompt.trim()) return
    set({ isAnalyzing: true, analyzeError: null })
    try {
      const enriched = await extractAndEnrich(prompt.trim())
      set({ currentScenario: enriched, isAnalyzing: false })
    } catch (err) {
      set({ isAnalyzing: false, analyzeError: err.message })
    }
  },

  loadFromHistory: (id) => {
    const scenario = get().history.find(s => s.id === id)
    if (scenario) set({ currentScenario: scenario })
  },

  deleteFromHistory: (id) => {
    const newHistory = get().history.filter(s => s.id !== id)
    saveHistoryToStorage(newHistory)
    set({ history: newHistory })
  },

  saveProfile: (data) => {
    const profile = { ...data, updated_at: new Date().toISOString() }
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch (e) { console.error('Failed to save profile:', e) }
    set({ profile })
  },
}))
