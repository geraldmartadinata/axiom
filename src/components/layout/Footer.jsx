import { useLanguage } from '../../store/LanguageContext.jsx'

export default function Footer() {
  const { lang } = useLanguage()
  const isID = lang === 'id'

  return (
    <footer className="mt-24 border-t border-white/[6%] bg-zinc-950 pt-16 pb-8 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Axiom</h2>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          {isID
            ? "Keputusan finansial yang jujur dan transparan untuk masa depanmu."
            : "Honest and transparent financial decisions for your future."}
        </p>
        <div className="flex justify-center gap-6 text-sm text-zinc-400 mb-8">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Axiom. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
