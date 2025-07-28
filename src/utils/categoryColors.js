// Generate pastel colors evenly spaced around the hue wheel
const generatePastelColors = (count) => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count
    colors.push({
      hue,
      hsl: `hsl(${hue}, 65%, 85%)`,
      textColor: '#333333'
    })
  }
  return colors
}

// Common cookbook categories with assigned pastel colors
const CATEGORY_COLORS = {
  'Afternoon tea': { bg: 'hsl(0, 65%, 85%)', text: '#333333' },
  'American': { bg: 'hsl(20, 65%, 85%)', text: '#333333' },
  'American south': { bg: 'hsl(40, 65%, 85%)', text: '#333333' },
  'Appetizers / starters': { bg: 'hsl(60, 65%, 85%)', text: '#333333' },
  'Australian': { bg: 'hsl(80, 65%, 85%)', text: '#333333' },
  'Bangladeshi': { bg: 'hsl(100, 65%, 85%)', text: '#333333' },
  'Basque': { bg: 'hsl(120, 65%, 85%)', text: '#333333' },
  'Beverages / drinks (no-alcohol)': { bg: 'hsl(140, 65%, 85%)', text: '#333333' },
  'Bread & buns, sweet': { bg: 'hsl(160, 65%, 85%)', text: '#333333' },
  'Bread & rolls, savory': { bg: 'hsl(180, 65%, 85%)', text: '#333333' },
  'Breakfast / brunch': { bg: 'hsl(200, 65%, 85%)', text: '#333333' },
  'Brownies, slices & bars': { bg: 'hsl(220, 65%, 85%)', text: '#333333' },
  'Cakes, large': { bg: 'hsl(240, 65%, 85%)', text: '#333333' },
  'Cakes, small': { bg: 'hsl(260, 65%, 85%)', text: '#333333' },
  'Candy / sweets': { bg: 'hsl(280, 65%, 85%)', text: '#333333' },
  'Cheesecakes': { bg: 'hsl(300, 65%, 85%)', text: '#333333' },
  'Chilean': { bg: 'hsl(320, 65%, 85%)', text: '#333333' },
  'Chutneys, pickles & relishes': { bg: 'hsl(340, 65%, 85%)', text: '#333333' },
  'Cocktails / drinks (with alcohol)': { bg: 'hsl(15, 65%, 85%)', text: '#333333' },
  'Cookies, biscuits & crackers': { bg: 'hsl(35, 65%, 85%)', text: '#333333' },
  'Cooking for 1 or 2': { bg: 'hsl(55, 65%, 85%)', text: '#333333' },
  'Dessert': { bg: 'hsl(75, 65%, 85%)', text: '#333333' },
  'Dressings & marinades': { bg: 'hsl(95, 65%, 85%)', text: '#333333' },
  'Egg dishes': { bg: 'hsl(115, 65%, 85%)', text: '#333333' },
  'English': { bg: 'hsl(135, 65%, 85%)', text: '#333333' },
  'French': { bg: 'hsl(155, 65%, 85%)', text: '#333333' },
  'Frostings & fillings': { bg: 'hsl(175, 65%, 85%)', text: '#333333' },
  'Gluten-free': { bg: 'hsl(195, 65%, 85%)', text: '#333333' },
  'Italian': { bg: 'hsl(215, 65%, 85%)', text: '#333333' },
  'Main course': { bg: 'hsl(235, 65%, 85%)', text: '#333333' },
  'Mousses, trifles, custards & creams': { bg: 'hsl(255, 65%, 85%)', text: '#333333' },
  'Pies, tarts & pastries': { bg: 'hsl(275, 65%, 85%)', text: '#333333' },
  'Quick / easy': { bg: 'hsl(295, 65%, 85%)', text: '#333333' },
  'Salads': { bg: 'hsl(315, 65%, 85%)', text: '#333333' },
  'Sandwiches & burgers': { bg: 'hsl(335, 65%, 85%)', text: '#333333' },
  'Side dish': { bg: 'hsl(355, 65%, 85%)', text: '#333333' },
  'Soups': { bg: 'hsl(25, 65%, 85%)', text: '#333333' },
  'Swiss': { bg: 'hsl(45, 65%, 85%)', text: '#333333' },
  'Vegan': { bg: 'hsl(65, 65%, 85%)', text: '#333333' },
  'Vegetarian': { bg: 'hsl(85, 65%, 85%)', text: '#333333' },
  'Vietnamese': { bg: 'hsl(105, 65%, 85%)', text: '#333333' }
}

// Fallback color generator for unknown categories
let colorIndex = 0
const fallbackColors = generatePastelColors(50)

export function getCategoryColor(category) {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category]
  }
  
  // Generate a consistent color for unknown categories
  const hash = category.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const colorIndex = Math.abs(hash) % fallbackColors.length
  return {
    bg: fallbackColors[colorIndex].hsl,
    text: fallbackColors[colorIndex].textColor
  }
}

export function getCategoryTags(categories, maxVisible = 3) {
  if (!categories || !Array.isArray(categories)) {
    return { visible: [], hidden: [] }
  }
  
  const visible = categories.slice(0, maxVisible)
  const hidden = categories.slice(maxVisible)
  
  return { visible, hidden }
}

