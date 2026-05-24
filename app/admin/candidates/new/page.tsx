import { isAdminAuthenticated } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminHeader from '../../AdminHeader'
import NewCandidateForm from './NewCandidateForm'

export default function NewCandidatePage() {
  if (!isAdminAuthenticated()) redirect('/admin')
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px', marginBottom: 22 }}>New candidate</h1>
        <NewCandidateForm />
      </main>
    </div>
  )
}
