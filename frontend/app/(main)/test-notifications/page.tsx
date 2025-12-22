import { NotificationTest } from "@/components/ui/notification-test"
import { PageHeader } from "@/components/page-header"
import { NotificationTestButton } from "@/components/ui/notification-test-button"

export default function NotificationTestPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader 
        title="Notification System Test" 
        description="Test date formatting and notification sounds"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <NotificationTest />
        
        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Test Using Components</h2>
            <div className="flex flex-col gap-4">
              <NotificationTestButton />
              
              <div className="rounded bg-muted p-3 text-sm">
                <p className="mb-2">How the sound system works:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Uses Web Audio API to generate a modern notification sound</li>
                  <li>The sound lasts 2-3 seconds with multiple harmonics</li>
                  <li>Volume is set to maximum (1.0) for better audibility</li>
                  <li>Falls back to simpler sounds if browser support is limited</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 