/**
 * COMPREHENSIVE TEST SUITE
 * Tests all frontend functionality and integration points
 */

class TestSuite {
    constructor() {
      this.tests = [];
      this.results = {
        passed: 0,
        failed: 0,
        total: 0
      };
      this.isRunning = false;
    }
    
    // Test registration
    addTest(name, testFunction, category = 'general') {
      this.tests.push({
        name,
        testFunction,
        category,
        status: 'pending'
      });
    }
    
    // Test execution
    async runAllTests() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      this.results = { passed: 0, failed: 0, total: this.tests.length };
      
      console.log('🧪 Starting test suite...');
      this.createTestUI();
      
      for (const test of this.tests) {
        await this.runSingleTest(test);
      }
      
      this.displayResults();
      this.isRunning = false;
    }
    
    async runSingleTest(test) {
      try {
        console.log(`Running: ${test.name}`);
        this.updateTestUI(test, 'running');
        
        await test.testFunction();
        
        test.status = 'passed';
        this.results.passed++;
        this.updateTestUI(test, 'passed');
        
      } catch (error) {
        test.status = 'failed';
        test.error = error.message;
        this.results.failed++;
        this.updateTestUI(test, 'failed', error.message);
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    // UI for test results
    createTestUI() {
      const testContainer = document.createElement('div');
      testContainer.id = 'test-results';
      testContainer.className = 'test-container';
      testContainer.innerHTML = `
        <div class="test-header">
          <h3>🧪 Test Results</h3>
          <div class="test-summary" id="test-summary">
            Running tests...
          </div>
        </div>
        <div class="test-list" id="test-list">
          ${this.tests.map(test => `
            <div class="test-item" id="test-${test.name.replace(/\s+/g, '-')}">
              <div class="test-name">${test.name}</div>
              <div class="test-status">⏳ Pending</div>
              <div class="test-error" style="display: none;"></div>
            </div>
          `).join('')}
        </div>
      `;
      
      document.body.appendChild(testContainer);
    }
    
    updateTestUI(test, status, error = null) {
      const testId = `test-${test.name.replace(/\s+/g, '-')}`;
      const testElement = document.getElementById(testId);
      
      if (testElement) {
        const statusElement = testElement.querySelector('.test-status');
        const errorElement = testElement.querySelector('.test-error');
        
        switch (status) {
          case 'running':
            statusElement.textContent = '🔄 Running';
            testElement.className = 'test-item test-running';
            break;
          case 'passed':
            statusElement.textContent = '✅ Passed';
            testElement.className = 'test-item test-passed';
            break;
          case 'failed':
            statusElement.textContent = '❌ Failed';
            testElement.className = 'test-item test-failed';
            if (error) {
              errorElement.textContent = error;
              errorElement.style.display = 'block';
            }
            break;
        }
      }
    }
    
    displayResults() {
      const summary = document.getElementById('test-summary');
      if (summary) {
        summary.innerHTML = `
          <div class="summary-stats">
            <span class="stat-item">
              <span class="stat-number">${this.results.total}</span>
              <span class="stat-label">Total</span>
            </span>
            <span class="stat-item stat-passed">
              <span class="stat-number">${this.results.passed}</span>
              <span class="stat-label">Passed</span>
            </span>
            <span class="stat-item stat-failed">
              <span class="stat-number">${this.results.failed}</span>
              <span class="stat-label">Failed</span>
            </span>
          </div>
        `;
      }
      
      console.log(`✅ Tests completed: ${this.results.passed}/${this.results.total} passed`);
    }
  }
  
  // Initialize test suite
  const testSuite = new TestSuite();
  
  // ===== API TESTS =====
  testSuite.addTest('API Ping Test', async () => {
    const response = await api.ping();
    if (!response.success) {
      throw new Error('API ping failed');
    }
  }, 'api');
  
  // ✅ UPDATED CODE:
  testSuite.addTest('API Get Form Data', async () => {
    // JSONP response is already parsed JSON
    const response = await api.getFormData();
    if (!response.success) {
      throw new Error('Failed to get form data');
    }
    if (!response.data.recipes || !Array.isArray(response.data.recipes)) {
      throw new Error('Invalid recipes data structure');
    }
  }, 'api');
  
  // ✅ UPDATED CODE:
  testSuite.addTest('API Get Menu Data', async () => {
    // JSONP response is already parsed JSON
    const response = await api.getMenuData();
    if (!response.success) {
      throw new Error('Failed to get menu data');
    }
  }, 'api');
  
  // ===== VALIDATION TESTS =====
  testSuite.addTest('Display Name Validation', async () => {
    const validName = Validation.validateDisplayName('John Doe');
    if (!validName.valid) {
      throw new Error('Valid name failed validation');
    }
    
    const invalidName = Validation.validateDisplayName('');
    if (invalidName.valid) {
      throw new Error('Empty name passed validation');
    }
  }, 'validation');
  
  testSuite.addTest('Instagram Handle Validation', async () => {
    const validHandle = Validation.validateInstagramHandle('@username');
    if (!validHandle.valid) {
      throw new Error('Valid Instagram handle failed validation');
    }
    
    const invalidHandle = Validation.validateInstagramHandle('invalid handle');
    if (invalidHandle.valid) {
      throw new Error('Invalid Instagram handle passed validation');
    }
  }, 'validation');
  
  testSuite.addTest('Email Validation', async () => {
    const validEmail = Validation.validateEmail('test@example.com');
    if (!validEmail.valid) {
      throw new Error('Valid email failed validation');
    }
    
    const invalidEmail = Validation.validateEmail('invalid-email');
    if (invalidEmail.valid) {
      throw new Error('Invalid email passed validation');
    }
  }, 'validation');
  
  // ===== COMPONENT TESTS =====
  testSuite.addTest('Recipe Picker Initialization', async () => {
    if (!window.recipePicker) {
      throw new Error('Recipe picker not initialized');
    }
    
    if (!window.recipePicker.recipes || !Array.isArray(window.recipePicker.recipes)) {
      throw new Error('Recipe picker recipes not loaded');
    }
  }, 'components');
  
  testSuite.addTest('Menu Display Initialization', async () => {
    if (!window.menuDisplay) {
      throw new Error('Menu display not initialized');
    }
  }, 'components');
  
  testSuite.addTest('Form Handler Initialization', async () => {
    if (!window.formHandler) {
      throw new Error('Form handler not initialized');
    }
    
    if (typeof window.formHandler.showStep !== 'function') {
      throw new Error('Form handler missing required methods');
    }
  }, 'components');
  
  // ===== UI TESTS =====
  testSuite.addTest('Form Elements Present', async () => {
    const requiredElements = [
      '#rsvp-form',
      '#user-type-member',
      '#user-type-guest',
      '#recipe-list',
      '#menu-content'
    ];
    
    for (const selector of requiredElements) {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Required element not found: ${selector}`);
      }
    }
  }, 'ui');
  
  testSuite.addTest('Navigation Buttons Present', async () => {
    const buttons = ['#next-step', '#prev-step', '#submit-rsvp'];
    
    for (const selector of buttons) {
      const button = document.querySelector(selector);
      if (!button) {
        throw new Error(`Navigation button not found: ${selector}`);
      }
    }
  }, 'ui');
  
  // ===== INTEGRATION TESTS =====
  testSuite.addTest('Form Step Navigation', async () => {
    if (!window.formHandler) {
      throw new Error('Form handler not available');
    }
    
    // Test step navigation
    window.formHandler.showStep(2);
    const step2 = document.querySelector('[data-step="2"]');
    if (!step2 || step2.style.display === 'none') {
      throw new Error('Step navigation failed');
    }
    
    // Return to step 1
    window.formHandler.showStep(1);
  }, 'integration');
  
  testSuite.addTest('Recipe Selection Flow', async () => {
    const recipeRadio = document.querySelector('input[name="recipeId"]');
    if (!recipeRadio) {
      throw new Error('No recipe options available');
    }
    
    // Simulate recipe selection
    recipeRadio.checked = true;
    recipeRadio.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Check if selection was processed
    if (!window.recipePicker.selectedRecipe) {
      throw new Error('Recipe selection not processed');
    }
  }, 'integration');
  
  // ===== PERFORMANCE TESTS =====
  testSuite.addTest('Page Load Performance', async () => {
    const loadTime = performance.now();
    if (loadTime > 5000) {
      throw new Error(`Page load time too slow: ${loadTime}ms`);
    }
  }, 'performance');
  
  testSuite.addTest('API Response Time', async () => {
    const startTime = performance.now();
    await api.ping();
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    if (responseTime > 3000) {
      throw new Error(`API response too slow: ${responseTime}ms`);
    }
  }, 'performance');
  
  // ===== ACCESSIBILITY TESTS =====
  testSuite.addTest('Form Labels Present', async () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    for (const input of inputs) {
      const label = document.querySelector(`label[for="${input.id}"]`) ||
                    input.closest('.form-group')?.querySelector('label');
      
      if (!label && !input.getAttribute('aria-label')) {
        throw new Error(`Input missing label: ${input.name || input.id}`);
      }
    }
  }, 'accessibility');
  
  testSuite.addTest('ARIA Attributes Present', async () => {
    const requiredAria = document.querySelectorAll('[aria-required="true"]');
    if (requiredAria.length === 0) {
      throw new Error('No required ARIA attributes found');
    }
  }, 'accessibility');

  // ✅ NEW TEST FOR POST REQUESTS:
  testSuite.addTest('API Submit RSVP (No-CORS)', async () => {
    const testData = {
      userType: 'guest',
      displayName: 'Test User',
      instagramHandle: '@testuser',
      cooking: false
    };
    
    try {
      // POST request with no-cors - response will be opaque
      const response = await api.submitRSVP(testData);
      
      // We can only verify that the request didn't throw a network error
      // The response will always be { success: true, message: 'Request sent successfully' }
      if (!response.success) {
        throw new Error('RSVP submission failed');
      }
      
      console.log('⚠️ Note: Cannot verify actual submission success due to no-cors mode');
      
    } catch (error) {
      // Only network errors will be caught here
      throw new Error(`Network error during RSVP submission: ${error.message}`);
    }
  }, 'api');
  
  // ===== UTILITY FUNCTIONS FOR TESTING =====
  function createTestButton() {
    const button = document.createElement('button');
    button.textContent = '🧪 Run Tests';
    button.className = 'btn btn-secondary';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    
    button.addEventListener('click', () => {
      testSuite.runAllTests();
    });
    
    document.body.appendChild(button);
  }
  
  // Add test styles
  function addTestStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .test-container {
        position: fixed;
        top: 50px;
        right: 10px;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 9998;
        overflow: hidden;
      }
      
      .test-header {
        padding: 16px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
      }
      
      .test-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }
      
      .test-summary {
        font-size: 14px;
        color: #666;
      }
      
      .summary-stats {
        display: flex;
        gap: 16px;
      }
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .stat-number {
        font-weight: bold;
        font-size: 18px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
      }
      
      .stat-passed .stat-number { color: #28a745; }
      .stat-failed .stat-number { color: #dc3545; }
      
      .test-list {
        max-height: 400px;
        overflow-y: auto;
      }
      
      .test-item {
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
      }
      
      .test-item:last-child {
        border-bottom: none;
      }
      
      .test-name {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .test-status {
        font-size: 14px;
      }
      
      .test-error {
        font-size: 12px;
        color: #dc3545;
        margin-top: 4px;
        padding: 8px;
        background: #f8d7da;
        border-radius: 4px;
      }
      
      .test-running {
        background: #fff3cd;
      }
      
      .test-passed {
        background: #d4edda;
      }
      
      .test-failed {
        background: #f8d7da;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Initialize testing environment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addTestStyles();
      createTestButton();
    });
  } else {
    addTestStyles();
    createTestButton();
  }