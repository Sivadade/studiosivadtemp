/**
 * Studio Sivad - Drop Functionality
 * Handles countdown timers, allocation tracking, and real-time updates
 * Version: 1.0.0
 */

class DropManager {
    constructor() {
      this.debug = false; // Set to true for debugging
      this.updateInterval = 30000; // 30 seconds
      this.ws = null;
      
      this.init();
    }
  
    init() {
      this.log('Initializing Drop Manager...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.startManagement();
        });
      } else {
        this.startManagement();
      }
    }
  
    startManagement() {
      this.initCountdownTimers();
      this.initAllocationTracking();
      this.initEditionSelector();
      this.initSizeSelector();
      this.initReserveButton();
      this.initRealtimeUpdates();
      this.initTabFunctionality();
      
      this.log('Drop Manager initialized successfully');
    }
  
    /**
     * Countdown Timer Management
     */
    initCountdownTimers() {
      const timers = document.querySelectorAll('.countdown-timer');
      
      timers.forEach(timer => {
        const endDate = timer.dataset.endDate;
        if (!endDate) {
          this.log('No end date found for timer', timer);
          return;
        }
  
        this.updateCountdown(timer, new Date(endDate));
        
        // Update every second
        setInterval(() => {
          this.updateCountdown(timer, new Date(endDate));
        }, 1000);
      });
  
      this.log(`Initialized ${timers.length} countdown timers`);
    }
  
    updateCountdown(timer, endDate) {
      const now = new Date().getTime();
      const timeLeft = endDate.getTime() - now;
  
      if (timeLeft <= 0) {
        this.handleDropExpired(timer);
        return;
      }
  
      const timeUnits = this.calculateTimeUnits(timeLeft);
      this.updateTimerDisplay(timer, timeUnits);
    }
  
    calculateTimeUnits(timeLeft) {
      return {
        days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((timeLeft % (1000 * 60)) / 1000)
      };
    }
  
    updateTimerDisplay(timer, timeUnits) {
      const elements = {
        days: timer.querySelector('.days'),
        hours: timer.querySelector('.hours'),
        minutes: timer.querySelector('.minutes'),
        seconds: timer.querySelector('.seconds')
      };
  
      Object.entries(elements).forEach(([unit, element]) => {
        if (element && timeUnits[unit] !== undefined) {
          element.textContent = timeUnits[unit].toString().padStart(2, '0');
        }
      });
    }
  
    handleDropExpired(timer) {
      timer.innerHTML = '<div class="drop-ended">This drop has ended</div>';
      
      // Disable reserve button
      const reserveBtn = document.querySelector('.reserve-btn');
      if (reserveBtn) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = 'Drop Ended';
        reserveBtn.classList.add('btn-disabled');
      }
  
      this.log('Drop expired, UI updated');
    }
  
    /**
     * Allocation Tracking
     */
    initAllocationTracking() {
      this.pollAllocationStatus();
      
      // Poll every 30 seconds
      setInterval(() => {
        this.pollAllocationStatus();
      }, this.updateInterval);
  
      this.log('Allocation tracking initialized');
    }
  
    async pollAllocationStatus() {
      try {
        const productId = this.getProductId();
        if (!productId) return;
  
        const response = await fetch(`/apps/studio-sivad/allocation-status?product_id=${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        this.updateAllocationDisplay(data);
        
      } catch (error) {
        this.log('Failed to fetch allocation status:', error);
        // Fallback to local data if available
        this.updateFromMetafields();
      }
    }
  
    updateAllocationDisplay(data) {
      const percentage = (data.current_reservations / data.allocation_target) * 100;
      
      // Update progress bars
      document.querySelectorAll('.progress-fill').forEach(fill => {
        fill.style.width = `${Math.min(percentage, 100)}%`;
      });
  
      // Update reservation counts
      document.querySelectorAll('.reservation-count').forEach(el => {
        el.textContent = data.current_reservations;
      });
  
      // Update allocation targets
      document.querySelectorAll('.allocation-target').forEach(el => {
        el.textContent = data.allocation_target;
      });
  
      // Update percentage displays
      document.querySelectorAll('.allocation-percentage').forEach(el => {
        el.textContent = `${Math.round(percentage)}%`;
      });
  
      this.log('Allocation display updated:', data);
    }
  
    updateFromMetafields() {
      // Fallback: use meta tags or data attributes if API fails
      const productData = this.getProductDataFromPage();
      if (productData) {
        this.updateAllocationDisplay(productData);
      }
    }
  
    getProductDataFromPage() {
      const metaElements = {
        current_reservations: document.querySelector('meta[name="product:reservations"]'),
        allocation_target: document.querySelector('meta[name="product:target"]')
      };
  
      if (metaElements.current_reservations && metaElements.allocation_target) {
        return {
          current_reservations: parseInt(metaElements.current_reservations.content),
          allocation_target: parseInt(metaElements.allocation_target.content)
        };
      }
  
      return null;
    }
  
    /**
     * Edition Selector
     */
    initEditionSelector() {
      const editionCards = document.querySelectorAll('.edition-card');
      
      editionCards.forEach(card => {
        card.addEventListener('click', () => {
          this.selectEdition(card);
        });
      });
  
      // Select first available edition by default
      const firstAvailable = document.querySelector('.edition-card:not(.sold-out)');
      if (firstAvailable) {
        this.selectEdition(firstAvailable);
      }
  
      this.log(`Initialized ${editionCards.length} edition selectors`);
    }
  
    selectEdition(card) {
      // Remove selected class from all cards
      document.querySelectorAll('.edition-card').forEach(c => {
        c.classList.remove('selected');
      });
      
      // Add selected class to clicked card
      card.classList.add('selected');
      
      // Update price display
      const price = card.dataset.price;
      const variantId = card.dataset.variantId;
      
      this.updatePriceDisplay(price);
      this.updateVariantSelection(variantId);
      
      this.log('Edition selected:', { price, variantId });
    }
  
    updatePriceDisplay(price) {
      const priceElements = document.querySelectorAll('.selected-price');
      priceElements.forEach(el => {
        el.textContent = `$${price}`;
      });
  
      // Update reserve button text
      const reserveBtn = document.querySelector('.reserve-btn .btn-text');
      if (reserveBtn) {
        reserveBtn.nextElementSibling.textContent = `$${price}`;
      }
    }
  
    updateVariantSelection(variantId) {
      const variantInput = document.querySelector('input[name="id"]');
      if (variantInput && variantId) {
        variantInput.value = variantId;
      }
  
      // Update form data
      const forms = document.querySelectorAll('form[action="/cart/add"]');
      forms.forEach(form => {
        let hiddenInput = form.querySelector('input[name="id"]');
        if (!hiddenInput) {
          hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'id';
          form.appendChild(hiddenInput);
        }
        hiddenInput.value = variantId;
      });
    }
  
    /**
     * Size Selector
     */
    initSizeSelector() {
      const sizeOptions = document.querySelectorAll('.size-option');
      
      sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
          this.selectSize(option);
        });
      });
  
      // Select medium by default if available
      const defaultSize = document.querySelector('.size-option[data-size="M"]') || 
                         document.querySelector('.size-option:not(:disabled)');
      if (defaultSize) {
        this.selectSize(defaultSize);
      }
  
      this.log(`Initialized ${sizeOptions.length} size options`);
    }
  
    selectSize(option) {
      if (option.disabled) return;
  
      // Remove selected class from all options
      document.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      option.classList.add('selected');
      
      const size = option.dataset.size;
      this.updateSizeSelection(size);
      
      this.log('Size selected:', size);
    }
  
    updateSizeSelection(size) {
      // Update hidden form inputs
      const sizeInputs = document.querySelectorAll('input[name="properties[Size]"]');
      sizeInputs.forEach(input => {
        input.value = size;
      });
  
      // Add size input if it doesn't exist
      const forms = document.querySelectorAll('form[action="/cart/add"]');
      forms.forEach(form => {
        let sizeInput = form.querySelector('input[name="properties[Size]"]');
        if (!sizeInput) {
          sizeInput = document.createElement('input');
          sizeInput.type = 'hidden';
          sizeInput.name = 'properties[Size]';
          form.appendChild(sizeInput);
        }
        sizeInput.value = size;
      });
    }
  
    /**
     * Reserve Button
     */
    initReserveButton() {
      const reserveButtons = document.querySelectorAll('.reserve-btn');
      
      reserveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          this.handleReserveClick(e, button);
        });
      });
  
      this.log(`Initialized ${reserveButtons.length} reserve buttons`);
    }
  
    async handleReserveClick(e, button) {
      e.preventDefault();
      
      // Validate selection
      if (!this.validateSelection()) {
        return;
      }
  
      // Show loading state
      this.setButtonLoading(button, true);
      
      try {
        await this.addToCart();
        this.showSuccessMessage();
        this.trackReservation();
        
      } catch (error) {
        this.log('Reserve failed:', error);
        this.showErrorMessage(error.message);
        
      } finally {
        this.setButtonLoading(button, false);
      }
    }
  
    validateSelection() {
      const selectedEdition = document.querySelector('.edition-card.selected');
      const selectedSize = document.querySelector('.size-option.selected');
      
      if (!selectedEdition) {
        this.showErrorMessage('Please select an edition');
        return false;
      }
      
      if (!selectedSize) {
        this.showErrorMessage('Please select a size');
        return false;
      }
      
      return true;
    }
  
    async addToCart() {
      const form = document.querySelector('form[action="/cart/add"]');
      if (!form) {
        throw new Error('Cart form not found');
      }
  
      const formData = new FormData(form);
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }
  
      return await response.json();
    }
  
    setButtonLoading(button, loading) {
      if (loading) {
        button.disabled = true;
        button.textContent = 'Adding to Cart...';
        button.classList.add('loading');
      } else {
        button.disabled = false;
        button.innerHTML = '<span class="btn-text">Reserve - </span><span class="selected-price">$0</span>';
        button.classList.remove('loading');
      }
    }
  
    /**
     * Tab Functionality
     */
    initTabFunctionality() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tabId = button.dataset.tab;
          this.switchTab(tabId);
        });
      });
  
      this.log(`Initialized ${tabButtons.length} content tabs`);
    }
  
    switchTab(tabId) {
      // Update button states
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      
      // Activate selected tab
      const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
      const activePane = document.getElementById(`${tabId}-tab`);
      
      if (activeButton) activeButton.classList.add('active');
      if (activePane) activePane.classList.add('active');
      
      this.log('Tab switched to:', tabId);
    }
  
    /**
     * Real-time Updates
     */
    initRealtimeUpdates() {
      if (!window.WebSocket) {
        this.log('WebSocket not supported, using polling only');
        return;
      }
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/apps/studio-sivad/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.sendSubscription();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            this.log('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          this.log('WebSocket disconnected, attempting reconnect...');
          setTimeout(() => {
            this.initRealtimeUpdates();
          }, 5000);
        };
        
        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
        };
        
      } catch (error) {
        this.log('WebSocket initialization failed:', error);
      }
    }
  
    sendSubscription() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const productId = this.getProductId();
        if (productId) {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            product_id: productId
          }));
        }
      }
    }
  
    handleWebSocketMessage(data) {
      switch (data.type) {
        case 'allocation_update':
          this.updateAllocationDisplay(data.payload);
          this.showNotification('New reservation received! 🎉');
          break;
          
        case 'drop_status_change':
          this.handleDropStatusChange(data.payload);
          break;
          
        case 'stock_update':
          this.updateStockDisplay(data.payload);
          break;
          
        default:
          this.log('Unknown WebSocket message type:', data.type);
      }
    }
  
    handleDropStatusChange(payload) {
      if (payload.status === 'ended') {
        const timer = document.querySelector('.countdown-timer');
        if (timer) {
          this.handleDropExpired(timer);
        }
        this.showNotification('This drop has ended', 'warning');
      }
    }
  
    updateStockDisplay(payload) {
      const editionCard = document.querySelector(`[data-variant-id="${payload.variant_id}"]`);
      if (editionCard) {
        const stockStatus = editionCard.querySelector('.stock-status');
        if (stockStatus) {
          if (payload.available <= 0) {
            stockStatus.textContent = 'Sold out';
            stockStatus.className = 'stock-status sold-out';
            editionCard.classList.add('sold-out');
          } else if (payload.available <= 3) {
            stockStatus.textContent = `Only ${payload.available} left`;
            stockStatus.className = 'stock-status low-stock';
          } else {
            stockStatus.textContent = `${payload.available} available`;
            stockStatus.className = 'stock-status available';
          }
        }
      }
    }
  
    /**
     * Utility Functions
     */
    getProductId() {
      const productElement = document.querySelector('[data-product-id]');
      return productElement ? productElement.dataset.productId : null;
    }
  
    showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      // Style the notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: '10000',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        animation: 'slideInRight 0.3s ease'
      });
      
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }
  
    showSuccessMessage() {
      this.showNotification('Added to cart successfully! 🛒');
    }
  
    showErrorMessage(message) {
      this.showNotification(message, 'error');
    }
  
    trackReservation() {
      // Track reservation event for analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'reserve_product', {
          event_category: 'Drop',
          event_label: this.getProductId(),
          value: 1
        });
      }
  
      // Send to Studio Sivad analytics
      this.sendAnalyticsEvent('reservation', {
        product_id: this.getProductId(),
        timestamp: new Date().toISOString()
      });
    }
  
    async sendAnalyticsEvent(event, data) {
      try {
        await fetch('/apps/studio-sivad/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            event: event,
            data: data
          })
        });
      } catch (error) {
        this.log('Failed to send analytics event:', error);
      }
    }
  
    /**
     * Revenue Split Calculator
     */
    calculateRevenueSplit(orderTotal, splitSettings = {}) {
      const defaults = {
        collaborator_percentage: 42.5,
        studio_percentage: 42.5,
        designer_percentage: 15
      };
      
      const settings = { ...defaults, ...splitSettings };
      
      const designerSplit = (settings.designer_percentage / 100) * orderTotal;
      const remainingAmount = orderTotal - designerSplit;
      
      const collaboratorSplit = (settings.collaborator_percentage / (settings.collaborator_percentage + settings.studio_percentage)) * remainingAmount;
      const studioSplit = remainingAmount - collaboratorSplit;
  
      return {
        total: orderTotal,
        designer: designerSplit,
        collaborator: collaboratorSplit,
        studio: studioSplit,
        breakdown: {
          designer_percentage: settings.designer_percentage,
          collaborator_percentage: (collaboratorSplit / orderTotal) * 100,
          studio_percentage: (studioSplit / orderTotal) * 100
        }
      };
    }
  
    log(...args) {
      if (this.debug) {
        console.log('[DropManager]', ...args);
      }
    }
  }
  
  /**
   * Animation Styles (injected via JavaScript)
   */
  function addAnimationStyles() {
    if (document.getElementById('drop-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'drop-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .loading {
        position: relative;
        color: transparent !important;
      }
      
      .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Initialize Drop Manager
   */
  (function() {
    // Add animation styles
    addAnimationStyles();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.dropManager = new DropManager();
      });
    } else {
      window.dropManager = new DropManager();
    }
  })();