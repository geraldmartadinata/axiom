import { Outlet } from 'react-router-dom'
import Background from './Background'
import DynamicIsland from './DynamicIsland'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen relative flex flex-col">
      <Background />
      <div className="relative z-10 flex-1">
        <DynamicIsland />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
