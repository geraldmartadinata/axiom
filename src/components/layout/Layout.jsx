import { Outlet } from 'react-router-dom'
import Background from './Background'
import DynamicIsland from './DynamicIsland'

export default function Layout() {
  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <DynamicIsland />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
