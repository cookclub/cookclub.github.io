import { Calendar, Clock, Users } from 'lucide-react'

export function EventInfo({ event }) {
  if (!event) return null

  const eventDate = new Date(event.event_datetime)
  const isUpcoming = eventDate > new Date()

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Cookbook Club RSVP & Menu
      </h1>
      
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Mobile-first layout: stacked on small screens, side-by-side on larger screens */}
        <div className="md:flex">
          {/* Cookbook Cover - prominent display */}
          <div className="md:w-1/3 lg:w-1/4 bg-muted/30 flex items-center justify-center p-6">
            {event.cookbook_cover_url ? (
              <img 
                src={event.cookbook_cover_url} 
                alt={`${event.cookbook_title} cover`}
                className="max-w-full max-h-48 md:max-h-64 object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-32 h-40 md:w-40 md:h-52 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-sm">Cookbook Cover</div>
                </div>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="md:w-2/3 lg:w-3/4 p-6">
            <div className="mb-4">
              {isUpcoming ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                  <Clock className="w-3 h-3 mr-1" />
                  Upcoming Event
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  Recent Event
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {event.event_name}
            </h2>

            {event.cookbook_title && (
              <p className="text-lg text-muted-foreground mb-4">
                Featuring: <span className="font-medium text-foreground">{event.cookbook_title}</span>
                {event.cookbook_author && (
                  <span className="text-sm"> by {event.cookbook_author}</span>
                )}
              </p>
            )}

            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <span>
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span>
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

