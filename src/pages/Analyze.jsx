import { useParams } from 'react-router-dom'
import AnalyzeIndex from './analyze/AnalyzeIndex'
import AnalyzeSession from './analyze/AnalyzeSession'

/**
 * Analyze — parent route dispatcher.
 * - /analyze → Mode A: history list
 * - /analyze/:sessionId → Mode B: session detail
 */
export default function Analyze() {
  const { sessionId } = useParams()
  if (sessionId) {
    return <AnalyzeSession />
  }
  return <AnalyzeIndex />
}