import { CheckCircle, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function RSVPSuccess({ memberName, recipeName, onClose }) {
  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            You're All Set! 🎉
          </h2>
        </div>
        
        <div className="space-y-3 text-muted-foreground">
          <p>
            <strong className="text-foreground">{memberName}</strong>, you've successfully claimed:
          </p>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="font-medium text-foreground">{recipeName}</p>
          </div>
          <p className="text-sm">
            Your recipe will now appear in the live menu. 
            We can't wait to see what you create!
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          View Updated Menu
        </button>
      </div>
    </div>
  )
}

