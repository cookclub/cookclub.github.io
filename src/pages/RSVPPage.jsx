import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentEvent } from '../lib/supabase'
import { EnhancedRSVPForm } from '../components/EnhancedRSVPForm'
import { RSVPSuccess } from '../components/RSVPSuccess'
import { AlertCircle, Loader2 } from 'lucide-react'

export function RSVPPage() {
  const [currentEvent, setCurrentEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rsvpSuccess, setRsvpSuccess] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Get pre-selected recipe from navigation state (if coming from recipes page)
  const preSelectedRecipe = location.state?.selectedRecipe

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

  const handleRSVPSuccess = (memberName, recipeName) => {
    setRsvpSuccess({ memberName, recipeName })
  }

  const handleSuccessClose = () => {
    setRsvpSuccess(null)
    navigate('/')
  }

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
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">No Active Event</h2>
        <p className="text-muted-foreground">There are no upcoming events to RSVP for at this time.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">RSVP for Cookbook Club</h1>
        <p className="text-muted-foreground">
          {currentEvent.event_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {new Date(currentEvent.event_datetime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </p>
      </div>

      {rsvpSuccess ? (
        <RSVPSuccess
          memberName={rsvpSuccess.memberName}
          recipeName={rsvpSuccess.recipeName}
          onClose={handleSuccessClose}
        />
      ) : (
        <EnhancedRSVPForm
          eventId={currentEvent.id}
          preSelectedRecipe={preSelectedRecipe}
          onSuccess={handleRSVPSuccess}
        />
      )}
    </div>
  )
}

