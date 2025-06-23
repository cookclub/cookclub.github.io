/**
 * MENU VISUALIZATION
 * Advanced visual representations of menu data
 */

class MenuVisualization {
    constructor() {
      this.charts = new Map();
      this.init();
    }
    
    init() {
      this.createVisualizationContainer();
      this.setupVisualizationControls();
    }
    
    createVisualizationContainer() {
      const menuSection = document.getElementById('menu-section');
      if (!menuSection) return;
      
      const vizContainer = document.createElement('div');
      vizContainer.className = 'menu-visualization';
      vizContainer.innerHTML = `
        <div class="viz-header">
          <h3 class="viz-title">📊 Menu Visualization</h3>
          <div class="viz-controls">
            <button type="button" class="viz-btn active" data-viz="category">
              By Category
            </button>
            <button type="button" class="viz-btn" data-viz="dietary">
              Dietary Options
            </button>
            <button type="button" class="viz-btn" data-viz="timeline">
              RSVP Timeline
            </button>
          </div>
        </div>
        <div class="viz-content" id="viz-content">
          <!-- Visualization will be rendered here -->
        </div>
      `;
      
      menuSection.appendChild(vizContainer);
      this.vizContainer = vizContainer;
      this.vizContent = vizContainer.querySelector('#viz-content');
    }
    
    setupVisualizationControls() {
      if (!this.vizContainer) return;
      
      const buttons = this.vizContainer.querySelectorAll('.viz-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Update active state
          buttons.forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          
          // Render visualization
          const vizType = e.target.dataset.viz;
          this.renderVisualization(vizType);
        });
      });
      
      // Render default visualization
      this.renderVisualization('category');
    }
    
    async renderVisualization(type) {
      if (!this.vizContent) return;
      
      try {
        // Get menu data
        const menuData = window.menuDisplay?.menuData;
        if (!menuData) {
          this.showNoDataMessage();
          return;
        }
        
        switch (type) {
          case 'category':
            this.renderCategoryChart(menuData);
            break;
          case 'dietary':
            this.renderDietaryChart(menuData);
            break;
          case 'timeline':
            this.renderTimelineChart(menuData);
            break;
        }
        
      } catch (error) {
        console.error('Failed to render visualization:', error);
        this.showErrorMessage();
      }
    }
    
    renderCategoryChart(menuData) {
      const { menu_by_category } = menuData;
      
      const data = Object.entries(menu_by_category).map(([category, dishes]) => ({
        category,
        count: dishes.length,
        emoji: Utils.getCategoryEmoji(category)
      }));
      
      const total = data.reduce((sum, item) => sum + item.count, 0);
      
      const chartHTML = `
        <div class="chart-container">
          <h4 class="chart-title">Dishes by Category</h4>
          <div class="bar-chart">
            ${data.map(item => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return `
                <div class="bar-item">
                  <div class="bar-label">
                    <span class="bar-emoji">${item.emoji}</span>
                    <span class="bar-text">${item.category}</span>
                    <span class="bar-count">${item.count}</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                  </div>
                  <div class="bar-percentage">${Math.round(percentage)}%</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      
      this.vizContent.innerHTML = chartHTML;
    }
    
    renderDietaryChart(menuData) {
      const { menu_by_category } = menuData;
      
      const dietaryOptions = {};
      
      // Collect dietary information
      Object.values(menu_by_category).flat().forEach(dish => {
        if (dish.dietary_tags) {
          dish.dietary_tags.split(',').forEach(tag => {
            const cleanTag = tag.trim();
            dietaryOptions[cleanTag] = (dietaryOptions[cleanTag] || 0) + 1;
          });
        }
      });
      
      if (Object.keys(dietaryOptions).length === 0) {
        this.vizContent.innerHTML = `
          <div class="no-data-message">
            <div class="no-data-icon">🌱</div>
            <div class="no-data-text">No dietary information available</div>
          </div>
        `;
        return;
      }
      
      const data = Object.entries(dietaryOptions).map(([tag, count]) => ({
        tag,
        count,
        emoji: this.getDietaryEmoji(tag)
      }));
      
      const total = data.reduce((sum, item) => sum + item.count, 0);
      
      const chartHTML = `
        <div class="chart-container">
          <h4 class="chart-title">Dietary Accommodations</h4>
          <div class="pie-chart-container">
            <div class="pie-chart">
              ${this.renderPieChart(data, total)}
            </div>
            <div class="pie-legend">
              ${data.map(item => `
                <div class="legend-item">
                  <span class="legend-color" style="background-color: ${this.getDietaryColor(item.tag)}"></span>
                  <span class="legend-emoji">${item.emoji}</span>
                  <span class="legend-text">${item.tag}</span>
                  <span class="legend-count">${item.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      this.vizContent.innerHTML = chartHTML;
    }
    
    renderTimelineChart(menuData) {
      const { rsvp_summary } = menuData;
      
      if (!rsvp_summary.rsvp_timeline) {
        this.vizContent.innerHTML = `
          <div class="no-data-message">
            <div class="no-data-icon">📅</div>
            <div class="no-data-text">Timeline data not available</div>
          </div>
        `;
        return;
      }
      
      const timeline = rsvp_summary.rsvp_timeline;
      
      const chartHTML = `
        <div class="chart-container">
          <h4 class="chart-title">RSVP Timeline</h4>
          <div class="timeline-chart">
            ${timeline.map((entry, index) => `
              <div class="timeline-item">
                <div class="timeline-marker">
                  <span class="timeline-number">${index + 1}</span>
                </div>
                <div class="timeline-content">
                  <div class="timeline-name">${Utils.sanitizeHTML(entry.display_name)}</div>
                  <div class="timeline-type">${entry.response_type === 'cooking' ? '👨‍🍳 Cooking' : '🍽️ Attending'}</div>
                  <div class="timeline-time">${Utils.formatTime(entry.timestamp)}</div>
                  ${entry.recipe_name ? `
                    <div class="timeline-recipe">${Utils.sanitizeHTML(entry.recipe_name)}</div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      this.vizContent.innerHTML = chartHTML;
    }
    
    renderPieChart(data, total) {
      let currentAngle = 0;
      const radius = 80;
      const centerX = 100;
      const centerY = 100;
      
      const slices = data.map(item => {
        const percentage = (item.count / total) * 100;
        const angle = (item.count / total) * 360;
        
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        
        const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
        const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
        const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
        const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${startX} ${startY}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          'Z'
        ].join(' ');
        
        return `
          <path d="${pathData}" 
                fill="${this.getDietaryColor(item.tag)}" 
                stroke="white" 
                stroke-width="2"
                class="pie-slice"
                data-tag="${item.tag}"
                data-count="${item.count}">
            <title>${item.tag}: ${item.count} dishes (${Math.round(percentage)}%)</title>
          </path>
        `;
      }).join('');
      
      return `
        <svg viewBox="0 0 200 200" class="pie-svg">
          ${slices}
        </svg>
      `;
    }
    
    getDietaryEmoji(tag) {
      const emojiMap = {
        'vegetarian': '🥬',
        'vegan': '🌱',
        'gluten-free': '🌾',
        'dairy-free': '🥛',
        'nut-free': '🥜',
        'low-carb': '🥩',
        'keto': '🥑'
      };
      
      return emojiMap[tag.toLowerCase()] || '🍽️';
    }
    
    getDietaryColor(tag) {
      const colorMap = {
        'vegetarian': '#4CAF50',
        'vegan': '#8BC34A',
        'gluten-free': '#FF9800',
        'dairy-free': '#2196F3',
        'nut-free': '#9C27B0',
        'low-carb': '#F44336',
        'keto': '#607D8B'
      };
      
      return colorMap[tag.toLowerCase()] || '#9E9E9E';
    }
    
    showNoDataMessage() {
      this.vizContent.innerHTML = `
        <div class="no-data-message">
          <div class="no-data-icon">📊</div>
          <div class="no-data-text">No menu data available for visualization</div>
        </div>
      `;
    }
    
    showErrorMessage() {
      this.vizContent.innerHTML = `
        <div class="error-message">
          <div class="error-icon">❌</div>
          <div class="error-text">Failed to load visualization</div>
        </div>
      `;
    }
    
    // Update visualizations when menu data changes
    updateVisualizations() {
      const activeBtn = this.vizContainer?.querySelector('.viz-btn.active');
      if (activeBtn) {
        const vizType = activeBtn.dataset.viz;
        this.renderVisualization(vizType);
      }
    }
  }
  
  // Initialize menu visualization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.menuVisualization = new MenuVisualization();
      
      // Update visualizations when menu data changes
      if (window.realTimeSync) {
        window.realTimeSync.subscribe('dataUpdated', () => {
          window.menuVisualization.updateVisualizations();
        });
      }
    });
  } else {
    window.menuVisualization = new MenuVisualization();
  }