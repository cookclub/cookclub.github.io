import { useState, useEffect } from 'react'
import { User, Mail, MessageSquare, ChefHat, Loader2, Users, UserPlus, CheckCircle } from 'lucide-react'
import { supabase, getEventRecipes } from '../lib/supabase'
import confetti from 'canvas-confetti'

export function EnhancedRSVPForm({ eventId, preSelectedRecipe, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Member/Guest, 2: Identity, 3: Cook/Attend, 4: Recipe Selection
  const [userType, setUserType] = useState('') // 'member' or 'guest'
  const [selectedMember, setSelectedMember] = useState(null)
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' })
  const [rsvpType, setRsvpType] = useState('') // 'cook' or 'guest_only'
  const [selectedRecipe, setSelectedRecipe] = useState(preSelectedRecipe || null)
  const [dishNotes, setDishNotes] = useState('')
  const [plusOneCount, setPlusOneCount] = useState(0)
  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [members, setMembers] = useState([])
  const [availableRecipes, setAvailableRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [existingRSVP, setExistingRSVP] = useState(null)
  const [existingRecipes, setExistingRecipes] = useState([])
  const [isModification, setIsModification] = useState(false)

  // Load members for dropdown
  useEffect(() => {
    async function loadMembers() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('member_id, first_name')
          .order('first_name')

        if (error) throw error
        console.log('Loaded members:', data)
        setMembers(data || [])
      } catch (err) {
        console.error('Error loading members:', err)
      }
    }

    loadMembers()
  }, [])

  // Check for existing RSVP when member is selected
  useEffect(() => {
    async function checkExistingRSVP() {
      if (!selectedMember || !eventId) return

      try {
        // Check for existing RSVP and recipe claims
        const { data: rsvpData, error: rsvpError } = await supabase
          
          .from('event_attendees')
          .select('event_attendee_id, rsvp_status, plus_one_count, attendance_notes')
          .eq('event_id', eventId)
          .eq('member_id', selectedMember.member_id)
          .single()

        if (rsvpError && rsvpError.code !== 'PGRST116') {
          throw rsvpError
        }

        if (rsvpData) {
          // User has existing RSVP - load their data
          setExistingRSVP(rsvpData)
          setIsModification(true)
          setPlusOneCount(rsvpData.plus_one_count || 0)
          setAttendanceNotes(rsvpData.attendance_notes || '')

          // Load existing recipe claims
          const { data: recipeData, error: recipeError } = await supabase
            
            .from('event_recipe_claims')
            .select(`
              recipe_claim_id,
              recipe_id,
              dish_notes,
              recipes (recipe_name, page_number, category, subcategory)
            `)
            .eq('event_id', eventId)
            .eq('member_id', selectedMember.member_id)

          if (recipeError) throw recipeError

          setExistingRecipes(recipeData || [])
          
          // Set RSVP type based on whether they have recipe claims
          if (recipeData && recipeData.length > 0) {
            setRsvpType('cook')
          } else {
            setRsvpType('guest_only')
          }

          console.log(`Found existing RSVP for ${selectedMember.first_name}:`, {
            rsvp: rsvpData,
            recipes: recipeData
          })
        } else {
          // No existing RSVP - reset to fresh state
          setExistingRSVP(null)
          setIsModification(false)
          setExistingRecipes([])
          setPlusOneCount(0)
          setAttendanceNotes('')
          setRsvpType('')
        }
      } catch (err) {
        console.error('Error checking existing RSVP:', err)
      }
    }

    checkExistingRSVP()
  }, [selectedMember, eventId])

  // Load available recipes when user chooses to cook
  useEffect(() => {
    async function loadRecipes() {
      if (rsvpType !== 'cook') return

      try {
        setLoadingRecipes(true)
        
        // Use the getEventRecipes function
        const { data: recipes, error: recipesError } = await getEventRecipes(eventId)

        if (recipesError) throw recipesError

        // Get claimed recipe IDs
        const { data: claimedRecipes, error: claimedError } = await supabase
          
          .from('event_recipe_claims')
          .select('recipe_id')
          .eq('event_id', eventId)

        if (claimedError) throw claimedError

        const claimedIds = new Set(claimedRecipes.map(c => c.recipe_id))
        const available = recipes.filter(recipe => !claimedIds.has(recipe.recipe_id))

        setAvailableRecipes(available)
      } catch (err) {
        console.error('Error loading recipes:', err)
        setError('Failed to load available recipes: ' + err.message)
      } finally {
        setLoadingRecipes(false)
      }
    }

    if (eventId && rsvpType === 'cook') {
      loadRecipes()
    }
  }, [eventId, rsvpType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let memberId = null
      let memberName = ''

      if (userType === 'member') {
        memberId = selectedMember.member_id
        memberName = selectedMember.first_name
      } else {
        // For guests, create or find member record
        const { data: existingMember, error: findError } = await supabase
          
          .from('members')
          .select('member_id, first_name')
          .eq('email', guestInfo.email)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          throw findError
        }

        if (existingMember) {
          memberId = existingMember.member_id
          memberName = existingMember.first_name
        } else {
          // Create new member record for guest
          const { data: newMember, error: createError } = await supabase
            
            .from('members')
            .insert({
              first_name: guestInfo.name,
              email: guestInfo.email,
              is_guest: true
            })
            .select()
            .single()

          if (createError) throw createError
          memberId = newMember.member_id
          memberName = newMember.first_name
        }
      }

      // Check if member already has an RSVP for this event
      const { data: existingRSVP, error: checkError } = await supabase
        
        .from('event_attendees')
        .select('event_attendee_id, rsvp_status')
        .eq('event_id', eventId)
        .eq('member_id', memberId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for first-time RSVPs
        throw checkError
      }

      // Create or update RSVP record
      if (!existingRSVP) {
        // First time RSVP - create new attendance record
        const { error: rsvpError } = await supabase
          
          .from('event_attendees')
          .insert({
            event_id: eventId,
            member_id: memberId,
            rsvp_status: 'Confirmed',
            plus_one_count: plusOneCount,
            attendance_notes: attendanceNotes
          })

        if (rsvpError) throw rsvpError
      } else {
        // Update existing RSVP record
        const { error: updateError } = await supabase
          
          .from('event_attendees')
          .update({
            rsvp_status: 'Confirmed',
            plus_one_count: plusOneCount,
            attendance_notes: attendanceNotes
          })
          .eq('event_attendee_id', existingRSVP.event_attendee_id)

        if (updateError) throw updateError
        console.log(`Updated RSVP for ${memberName}`)
      }

      // If cooking, create recipe claim
      if (rsvpType === 'cook' && selectedRecipe) {
        const { error: claimError } = await supabase
          
          .from('event_recipe_claims')
          .insert({
            event_id: eventId,
            member_id: memberId,
            recipe_id: selectedRecipe.recipe_id,
            dish_notes: dishNotes
          })

        if (claimError) {
          // Check if this is a duplicate recipe claim (user already claimed this specific recipe)
          if (claimError.code === '23505' && claimError.message.includes('event_recipe_claims_unique_claim')) {
            throw new Error(`You have already claimed "${selectedRecipe.recipe_name}" for this event. Please choose a different recipe.`)
          }
          throw claimError
        }
      }

      // Success!
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'] // Orange theme colors
      })

      // Set success state with user data
      setSuccessData({
        memberName,
        recipeName: selectedRecipe?.recipe_name,
        rsvpType,
        dishNotes,
        plusOneCount,
        attendanceNotes,
        isModification
      })
      setSuccess(true)

      // Call parent success handler for live updates
      if (onSuccess) {
        onSuccess({
          memberName,
          recipeName: selectedRecipe?.recipe_name,
          rsvpType,
          isModification
        })
      }

    } catch (err) {
      console.error('Error submitting RSVP:', err)
      setError('Failed to submit RSVP: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return userType !== ''
      case 2: return userType === 'member' ? selectedMember : (guestInfo.name && guestInfo.email)
      case 3: return rsvpType !== ''
      case 4: return rsvpType === 'guest_only' || selectedRecipe
      default: return false
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Success Screen */}
      {success && successData && (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isModification ? 'RSVP Updated!' : 'Thanks for your RSVP,'} {successData.memberName}! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              {isModification 
                ? 'Your cookbook club RSVP has been successfully updated!'
                : 'You\'re all set for our cookbook club event!'
              }
            </p>
          </div>

          {/* RSVP Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Your RSVP Summary</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Participation:</strong> {successData.rsvpType === 'cook' ? 'Cooking' : 'Attending'}
              </div>
              {successData.plusOneCount > 0 && (
                <div>
                  <strong>Plus-ones:</strong> {successData.plusOneCount} guest{successData.plusOneCount > 1 ? 's' : ''}
                </div>
              )}
              {successData.attendanceNotes && (
                <div>
                  <strong>Notes:</strong> {successData.attendanceNotes}
                </div>
              )}
            </div>
          </div>

          {successData.recipeName && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">
                {isModification ? 'New Recipe Claim' : 'Your Recipe Claim'}
              </h3>
              <p className="text-orange-800">
                <strong>{successData.recipeName}</strong>
              </p>
              {successData.dishNotes && (
                <p className="text-sm text-orange-700 mt-2">
                  Notes: {successData.dishNotes}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Check your email for event reminders</li>
              <li>• Join our Discord for recipe tips and community chat</li>
              <li>• Browse the menu below to see what others are bringing</li>
              <li>• Get excited for delicious food and great company!</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            View Updated Menu
          </button>
        </div>
      )}

      {/* Form Steps (only show if not successful) */}
      {!success && (
        <>
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > num ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
        {/* Step 1: Member or Guest */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
              <p className="text-gray-600">Are you a club member or joining as a guest?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('member')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  userType === 'member'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-8 h-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold text-gray-900 mb-2">I'm a Member</h3>
                <p className="text-sm text-gray-600">
                  I'm part of the Discord community and have attended before
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUserType('guest')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  userType === 'guest'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserPlus className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold text-gray-900 mb-2">I'm a Guest</h3>
                <p className="text-sm text-gray-600">
                  This is my first time or I'm not in the Discord yet
                </p>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  Note: Guests must bring a dish
                </p>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us who you are</h2>
              <p className="text-gray-600">
                {userType === 'member' 
                  ? 'Select your name from the member list'
                  : 'Enter your name and email address'
                }
              </p>
            </div>

            {userType === 'member' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your name
                </label>
                <select
                  value={selectedMember?.member_id || ''}
                  onChange={(e) => {
                    console.log('Member selection changed:', e.target.value)
                    console.log('Available members:', members)
                    const member = members.find(m => m.member_id === e.target.value)
                    console.log('Found member:', member)
                    setSelectedMember(member || null)
                  }}
                  onInput={(e) => {
                    // Additional handler for better browser compatibility
                    const member = members.find(m => m.member_id === e.target.value)
                    setSelectedMember(member || null)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Choose your name...</option>
                  {members.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.first_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Cook or Attend */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How will you participate?</h2>
              <p className="text-gray-600">
                {userType === 'member' 
                  ? 'Choose whether you want to cook a dish or just attend'
                  : 'As a guest, you\'ll need to bring a dish to share'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRsvpType('cook')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  rsvpType === 'cook'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ChefHat className="w-8 h-8 mx-auto mb-3 text-orange-600" />
                <h3 className="font-semibold text-gray-900 mb-2">I'll Cook</h3>
                <p className="text-sm text-gray-600">
                  I want to prepare a dish from the featured cookbook
                </p>
              </button>

              {userType === 'member' && (
                <button
                  type="button"
                  onClick={() => setRsvpType('guest_only')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    rsvpType === 'guest_only'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Just Attend</h3>
                  <p className="text-sm text-gray-600">
                    I'll come to enjoy the food and community
                  </p>
                </button>
              )}
            </div>

            {/* Plus-one and attendance notes section */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900">Additional Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Plus-ones (optional)
                </label>
                <select
                  value={plusOneCount}
                  onChange={(e) => setPlusOneCount(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={0}>Just me</option>
                  <option value={1}>+1 guest</option>
                  <option value={2}>+2 guests</option>
                  <option value={3}>+3 guests</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Notes (optional)
                </label>
                <textarea
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Any notes about your attendance, dietary restrictions, or plus-ones..."
                />
              </div>
            </div>

            {/* Show existing recipes if this is a modification */}
            {isModification && existingRecipes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Your Current Recipe Claims</h3>
                <div className="space-y-2">
                  {existingRecipes.map((claim) => (
                    <div key={claim.recipe_claim_id} className="text-sm text-blue-800">
                      <strong>{claim.recipes.recipe_name}</strong>
                      {claim.dish_notes && (
                        <span className="text-blue-600"> - {claim.dish_notes}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {rsvpType === 'cook' ? 'You can add another recipe in the next step.' : 'Switch to "I\'ll Cook" to add more recipes.'}
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Recipe Selection or Final Confirmation */}
        {step === 4 && (
          <div className="space-y-6">
            {rsvpType === 'cook' ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Recipe</h2>
                  <p className="text-gray-600">Select a recipe from the available options</p>
                </div>

                {loadingRecipes ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
                    <p className="text-gray-600">Loading available recipes...</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {availableRecipes.map((recipe) => (
                      <button
                        key={recipe.recipe_id}
                        type="button"
                        onClick={() => setSelectedRecipe(recipe)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedRecipe?.recipe_id === recipe.recipe_id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{recipe.recipe_name}</h3>
                        {recipe.page_number && (
                          <p className="text-sm text-gray-600">Page {recipe.page_number}</p>
                        )}
                        {recipe.categories && recipe.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {recipe.categories.slice(0, 3).map((category, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRecipe && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Dish Notes (Optional)
                    </label>
                    <textarea
                      value={dishNotes}
                      onChange={(e) => setDishNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Any modifications, dietary notes, or special preparations..."
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your RSVP</h2>
                <p className="text-gray-600">
                  Great! You're all set to attend as a guest-only member.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!canProceed() || loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 mr-2" />
                    {isModification 
                      ? (rsvpType === 'cook' ? 'Add Recipe & Update RSVP' : 'Update RSVP')
                      : (rsvpType === 'cook' ? 'Claim Recipe & RSVP' : 'Confirm RSVP')
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </form>
      )}
    </div>
  )
}

