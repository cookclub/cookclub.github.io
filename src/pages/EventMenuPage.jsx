import { useState, useEffect } from 'react'
import { getCurrentEvent } from '../lib/supabase'
import { EventInfo } from '../components/EventInfo'
import { MenuDisplay } from '../components/MenuDisplay'
import { EmptyState } from '../components/EmptyState'
import { AlertCircle, Loader2 } from 'lucide-react'

export function EventMenuPage() {
  const [currentEvent, setCurrentEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadCurrentEvent() {
      try {
        setLoading(true)
        setError(null)
        const { data: event, error: eventError } = await getCurrentEvent()
        if (eventError) {
          throw new Error(eventError.message || 'Failed to load event')
        }
        setCurrentEvent(event)
      } catch (err) {
        console.error('Failed to load current event:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentEvent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading event information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to connect to the database. Please check your Supabase configuration.
          </p>
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            Error: {error}
          </p>
        </div>
      </div>
    )
  }

  if (!currentEvent) {
    return <EmptyState />
  }

  return (
    <div className="space-y-8">
      <EventInfo event={currentEvent} />
      <MenuDisplay eventId={currentEvent.id} />
    </div>
  )
}

