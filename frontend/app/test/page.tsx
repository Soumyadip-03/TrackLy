import { SupabaseTest } from '@/components/test/supabase-test'

export const metadata = {
  title: 'Supabase Test - TrackLy',
  description: 'Test Supabase connection and operations',
}

export default function TestPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Supabase Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test your Supabase connection and database operations
        </p>
      </div>
      <SupabaseTest />
    </div>
  )
} 