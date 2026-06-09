import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/sidebar'

export function AdminLayout() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-8 xl:flex-row xl:px-8">
      <Sidebar />
      <section className="flex-1">
        <Outlet />
      </section>
    </main>
  )
}
