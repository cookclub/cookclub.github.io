import { Link, useLocation } from 'react-router-dom'
import { Calendar, Utensils, ChefHat } from 'lucide-react'

export function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Event & Menu', icon: Calendar },
    { path: '/recipes', label: 'Browse Recipes', icon: ChefHat },
    { path: '/rsvp', label: 'RSVP', icon: Utensils }
  ]

  return (
    <nav className="bg-card border-b border-border mb-6">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center md:flex-row md:items-center">
        <Link to="/" className="brand-name mb-3 md:mb-0 md:mr-8">
          big spoon society
        </Link>
        <div className="flex space-x-8">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
