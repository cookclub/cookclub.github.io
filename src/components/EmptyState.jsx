import { Calendar, Coffee } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Our next get-together is still in the oven!
          </h1>
          <p className="text-muted-foreground mb-6">
            No upcoming events are scheduled at the moment. Check back soon for our next meeting!
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Stay Connected</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep an eye on the Discord for announcements about our next meeting!
          </p>
        </div>
      </div>
    </div>
  )
}

