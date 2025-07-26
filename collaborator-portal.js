/**
 * Studio Sivad - Collaborator Portal
 * Handles dashboard functionality, analytics, asset uploads, and AI recommendations
 * Version: 1.0.0
 */

class CollaboratorPortal {
    constructor() {
      this.debug = false;
      this.refreshInterval = 60000; // 1 minute
      this.ws = null;
      this.currentTab = 'dashboard';
      this.aiRecommendations = [];
      
      this.init();
    }
  
    init() {
      this.log('Initializing Collaborator Portal...');
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.startPortal();
        });
      } else {
        this.startPortal();
      }
    }
  
    startPortal() {
      // Only initialize if we're on the portal page
      if (!document.querySelector('.collaborator-portal')) {
        return;
      }
  
      this.initPortalTabs();
      this.loadDashboardData();
      this.initAnalyticsTracking();
      this.initAssetUpload();
      this.initAIRecommendations();
      this.setupRealTimeUpdates();
      this.initDropManagement();
      
      this.log('Collaborator Portal initialized successfully');
    }
  
    /**
     * Portal Tab Management
     */
    initPortalTabs() {
      const tabs = document.querySelectorAll('.portal-tab');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const tabId = tab.getAttribute('href').substring(1);
          this.switchTab(tabId);
          this.trackTabNavigation(tabId);
        });
      });
  
      // Initialize first tab
      const activeTab = document.querySelector('.portal-tab.active');
      if (activeTab) {
        const tabId = activeTab.getAttribute('href').substring(1);
        this.currentTab = tabId;
      }
  
      this.log(`Initialized ${tabs.length} portal tabs`);
    }
  
    switchTab(tabId) {
      // Update tab buttons
      document.querySelectorAll('.portal-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      
      // Activate selected tab
      const activeTab = document.querySelector(`[href="#${tabId}"]`);
      const activePane = document.getElementById(tabId);
      
      if (activeTab) activeTab.classList.add('active');
      if (activePane) activePane.classList.add('active');
      
      this.currentTab = tabId;
      this.onTabSwitch(tabId);
      
      this.log('Switched to tab:', tabId);
    }
  
    onTabSwitch(tabId) {
      switch (tabId) {
        case 'dashboard':
          this.refreshDashboard();
          break;
        case 'analytics':
          this.loadAnalytics();
          break;
        case 'assets':
          this.initAssetManager();
          break;
        case 'drops':
          this.loadDropManager();
          break;
        case 'settings':
          this.loadSettings();
          break;
      }
    }
  
    /**
     * Dashboard Data Management
     */
    async loadDashboardData() {
      try {
        this.showDashboardLoading(true);
        
        const response = await this.apiCall('/apps/studio-sivad/collaborator-data');
        const data = await response.json();
        
        this.updateDashboard(data);
        this.showDashboardLoading(false);
        
      } catch (error) {
        this.log('Failed to load dashboard data:', error);
        this.showErrorMessage('Failed to load dashboard data');
        this.showDashboardLoading(false);
      }
    }
  
    updateDashboard(data) {
      // Update metric cards
      this.updateMetricCard('.total-earnings', data.total_earnings, '$');
      this.updateMetricCard('.total-orders', data.total_orders);
      this.updateMetricCard('.conversion-rate', data.conversion_rate, '%');
      this.updateMetricCard('.followers', this.formatFollowers(data.social_followers));
      this.updateMetricCard('.last-30-days', data.last_30_days, '$');
  
      // Update metric changes
      this.updateMetricChange('.earnings-change', data.earnings_change);
      this.updateMetricChange('.orders-change', data.orders_change);
      this.updateMetricChange('.conversion-change', data.conversion_change);
      this.updateMetricChange('.followers-change', data.followers_change);
  
      // Update active drops
      this.updateActiveDrops(data.active_drops || []);
  
      // Update recent activity
      this.updateRecentActivity(data.recent_activity || []);
  
      this.log('Dashboard updated with data:', data);
    }
  
    updateMetricCard(selector, value, prefix = '', suffix = '') {
      const element = document.querySelector(`${selector} .metric-value`);
      if (element) {
        element.textContent = `${prefix}${this.formatNumber(value)}${suffix}`;
      }
    }
  
    updateMetricChange(selector, change) {
      const element = document.querySelector(selector);
      if (element && change !== undefined) {
        const isPositive = change > 0;
        const isNegative = change < 0;
        
        element.className = `metric-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`;
        element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
      }
    }
  
    updateActiveDrops(drops) {
      const container = document.querySelector('.drops-grid');
      if (!container) return;
  
      container.innerHTML = '';
      
      if (drops.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No Active Drops</h3>
            <p>Create your first drop to get started!</p>
            <button class="btn btn-primary" onclick="collaboratorPortal.switchTab('drops')">
              Create Drop
            </button>
          </div>
        `;
        return;
      }
  
      drops.forEach(drop => {
        const dropCard = this.createDropCard(drop);
        container.appendChild(dropCard);
      });
    }
  
    createDropCard(drop) {
      const card = document.createElement('div');
      card.className = 'drop-card';
      card.dataset.dropId = drop.id;
      
      const progress = (drop.current_reservations / drop.allocation_target) * 100;
      const estimatedEarnings = drop.current_reservations * drop.average_price * 0.425; // Collaborator split
  
      card.innerHTML = `
        <div class="drop-image">
          <img src="${drop.image || '/assets/placeholder-product.jpg'}" alt="${drop.name}" loading="lazy">
          <div class="drop-status-badge ${drop.status}">${drop.status.toUpperCase()}</div>
        </div>
        <div class="drop-details">
          <h3>${drop.name}</h3>
          <div class="drop-stats">
            <div class="stat">
              <span class="stat-value">${progress.toFixed(0)}%</span>
              <span class="stat-label">Progress</span>
            </div>
            <div class="stat">
              <span class="stat-value">${drop.current_reservations}</span>
              <span class="stat-label">Reserved</span>
            </div>
            <div class="stat">
              <span class="stat-value">${estimatedEarnings.toLocaleString()}</span>
              <span class="stat-label">Est. Earnings</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <div class="drop-actions">
            <button class="btn btn-sm btn-secondary" onclick="collaboratorPortal.viewDrop('${drop.id}')">
              View Details
            </button>
            <button class="btn btn-sm btn-primary" onclick="collaboratorPortal.shareDrop('${drop.id}')">
              Share
            </button>
          </div>
        </div>
      `;
  
      return card;
    }
  
    /**
     * Analytics Tracking
     */
    initAnalyticsTracking() {
      // Track portal page view
      this.trackEvent('portal_view', {
        page: 'dashboard'
      });
  
      // Track time spent on portal
      this.startTimeTracking();
  
      // Track scroll depth
      this.trackScrollDepth();
  
      this.log('Analytics tracking initialized');
    }
  
    trackEvent(eventName, parameters = {}) {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          event_category: 'Collaborator Portal',
          ...parameters
        });
      }
  
      // Studio Sivad Analytics
      this.sendAnalyticsEvent(eventName, parameters);
    }
  
    async sendAnalyticsEvent(event, data) {
      try {
        await this.apiCall('/apps/studio-sivad/analytics', {
          method: 'POST',
          body: JSON.stringify({
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href
          })
        });
      } catch (error) {
        this.log('Failed to send analytics event:', error);
      }
    }
  
    trackTabNavigation(tabId) {
      this.trackEvent('tab_navigation', {
        tab: tabId,
        previous_tab: this.currentTab
      });
    }
  
    startTimeTracking() {
      this.startTime = Date.now();
      
      // Track time when user leaves
      window.addEventListener('beforeunload', () => {
        const timeSpent = Date.now() - this.startTime;
        this.trackEvent('time_spent', {
          duration: Math.floor(timeSpent / 1000), // seconds
          tab: this.currentTab
        });
      });
    }
  
    trackScrollDepth() {
      let maxScroll = 0;
      
      window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          
          // Track milestones
          if ([25, 50, 75, 100].includes(scrollPercent)) {
            this.trackEvent('scroll_depth', {
              depth: scrollPercent,
              tab: this.currentTab
            });
          }
        }
      });
    }
  
    /**
     * Asset Upload Management
     */
    initAssetUpload() {
      const uploadArea = document.querySelector('.asset-upload-area');
      const fileInput = document.querySelector('.asset-file-input');
      
      if (!uploadArea) return;
  
      // Drag and drop handlers
      uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
      uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
      uploadArea.addEventListener('drop', this.handleDrop.bind(this));
      
      // Click to upload
      uploadArea.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
  
      // File input change
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const files = Array.from(e.target.files);
          this.handleFileUpload(files);
        });
      }
  
      this.log('Asset upload initialized');
    }
  
    handleDragOver(e) {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    }
  
    handleDragLeave(e) {
      e.currentTarget.classList.remove('drag-over');
    }
  
    handleDrop(e) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFileUpload(files);
    }
  
    async handleFileUpload(files) {
      if (files.length === 0) return;
  
      // Validate files
      const validFiles = this.validateFiles(files);
      if (validFiles.length === 0) {
        this.showErrorMessage('No valid files selected. Please upload images, videos, or documents.');
        return;
      }
  
      // Show upload progress
      this.showUploadProgress(validFiles);
  
      try {
        const results = await this.uploadFiles(validFiles);
        this.handleUploadSuccess(results);
        this.refreshAssetLibrary();
        
      } catch (error) {
        this.log('Upload failed:', error);
        this.showErrorMessage('Upload failed: ' + error.message);
      }
    }
  
    validateFiles(files) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf',
        'text/plain'
      ];
  
      return files.filter(file => {
        if (file.size > maxSize) {
          this.showErrorMessage(`File ${file.name} is too large. Maximum size is 10MB.`);
          return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
          this.showErrorMessage(`File ${file.name} is not a supported format.`);
          return false;
        }
        
        return true;
      });
    }
  
    async uploadFiles(files) {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
  
      formData.append('upload_type', 'asset');
      formData.append('collaborator_id', this.getCollaboratorId());
  
      const response = await this.apiCall('/apps/studio-sivad/upload-assets', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
  
      return await response.json();
    }
  
    showUploadProgress(files) {
      const progressContainer = document.querySelector('.upload-progress');
      if (!progressContainer) return;
  
      progressContainer.innerHTML = `
        <div class="upload-status">
          <h4>Uploading ${files.length} file(s)...</h4>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      `;
  
      // Simulate progress (replace with real progress tracking)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        const fill = progressContainer.querySelector('.progress-fill');
        if (fill) {
          fill.style.width = `${progress}%`;
        }
        
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    }
  
    handleUploadSuccess(results) {
      this.showSuccessMessage(`Successfully uploaded ${results.uploaded.length} file(s)`);
      
      // Clear upload progress
      const progressContainer = document.querySelector('.upload-progress');
      if (progressContainer) {
        progressContainer.innerHTML = '';
      }
  
      // Track upload event
      this.trackEvent('asset_upload', {
        file_count: results.uploaded.length,
        total_size: results.total_size
      });
    }
  
    /**
     * AI Recommendations
     */
    initAIRecommendations() {
      this.loadAIRecommendations();
      
      // Refresh recommendations every 5 minutes
      setInterval(() => {
        this.loadAIRecommendations();
      }, 5 * 60 * 1000);
  
      // Initialize AI chat if enabled
      this.initAIChat();
  
      this.log('AI recommendations initialized');
    }
  
    async loadAIRecommendations() {
      try {
        const response = await this.apiCall('/apps/studio-sivad/ai-recommendations');
        const recommendations = await response.json();
        
        this.aiRecommendations = recommendations;
        this.displayRecommendations(recommendations);
        
      } catch (error) {
        this.log('Failed to load AI recommendations:', error);
      }
    }
  
    displayRecommendations(recommendations) {
      const container = document.querySelector('.ai-recommendations');
      if (!container) return;
  
      if (recommendations.length === 0) {
        container.innerHTML = `
          <div class="no-recommendations">
            <h4>No recommendations available</h4>
            <p>Keep creating and we'll provide personalized insights!</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.urgency}" data-rec-id="${rec.id}">
          <div class="rec-header">
            <div class="rec-icon">${this.getRecommendationIcon(rec.type)}</div>
            <div class="rec-title">
              <h4>${rec.title}</h4>
              <span class="urgency-badge ${rec.urgency}">${rec.urgency.toUpperCase()}</span>
            </div>
          </div>
          <p class="rec-insight">${rec.insight}</p>
          <div class="rec-impact">${rec.impact}</div>
          <div class="rec-actions">
            <button class="btn btn-sm btn-secondary" onclick="collaboratorPortal.dismissRecommendation('${rec.id}')">
              Dismiss
            </button>
            <button class="btn btn-sm btn-primary" onclick="collaboratorPortal.implementRecommendation('${rec.id}')">
              ${rec.action_label || 'Implement'}
            </button>
          </div>
        </div>
      `).join('');
    }
  
    getRecommendationIcon(type) {
      const icons = {
        pricing: '💰',
        marketing: '📈',
        content: '📝',
        timing: '⏰',
        audience: '👥',
        product: '📦'
      };
      return icons[type] || '💡';
    }
  
    async implementRecommendation(recId) {
      try {
        const response = await this.apiCall('/apps/studio-sivad/implement-recommendation', {
          method: 'POST',
          body: JSON.stringify({ recommendation_id: recId })
        });
  
        const result = await response.json();
        
        if (result.success) {
          this.showSuccessMessage('Recommendation implemented successfully!');
          this.loadAIRecommendations(); // Refresh recommendations
          this.loadDashboardData(); // Refresh dashboard
          
          this.trackEvent('ai_recommendation_implemented', {
            recommendation_id: recId,
            type: result.type
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        this.log('Failed to implement recommendation:', error);
        this.showErrorMessage('Failed to implement: ' + error.message);
      }
    }
  
    async dismissRecommendation(recId) {
      try {
        await this.apiCall('/apps/studio-sivad/dismiss-recommendation', {
          method: 'POST',
          body: JSON.stringify({ recommendation_id: recId })
        });
  
        // Remove from UI
        const recCard = document.querySelector(`[data-rec-id="${recId}"]`);
        if (recCard) {
          recCard.remove();
        }
  
        this.trackEvent('ai_recommendation_dismissed', {
          recommendation_id: recId
        });
        
      } catch (error) {
        this.log('Failed to dismiss recommendation:', error);
      }
    }
  
    initAIChat() {
      const chatContainer = document.querySelector('.ai-chat-container');
      if (!chatContainer) return;
  
      const chatInput = chatContainer.querySelector('.chat-input');
      const sendButton = chatContainer.querySelector('.send-button');
      const messagesContainer = chatContainer.querySelector('.chat-messages');
  
      if (chatInput && sendButton) {
        sendButton.addEventListener('click', () => {
          this.sendChatMessage(chatInput.value);
          chatInput.value = '';
        });
  
        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendChatMessage(chatInput.value);
            chatInput.value = '';
          }
        });
      }
  
      // Add initial welcome message
      this.addChatMessage('ai', 'Hi! I\'m your AI assistant. I can help you optimize your drops, analyze performance, and suggest marketing strategies. What would you like to know?');
    }
  
    async sendChatMessage(message) {
      if (!message.trim()) return;
  
      // Add user message to chat
      this.addChatMessage('user', message);
      
      // Show typing indicator
      this.showTypingIndicator();
  
      try {
        const response = await this.apiCall('/apps/studio-sivad/ai-chat', {
          method: 'POST',
          body: JSON.stringify({
            message: message,
            context: this.getChatContext()
          })
        });
  
        const result = await response.json();
        
        // Remove typing indicator
        this.hideTypingIndicator();
        
        // Add AI response
        this.addChatMessage('ai', result.response);
  
        // Track chat interaction
        this.trackEvent('ai_chat_interaction', {
          message_length: message.length,
          response_length: result.response.length
        });
        
      } catch (error) {
        this.hideTypingIndicator();
        this.addChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
        this.log('AI chat error:', error);
      }
    }
  
    addChatMessage(type, content) {
      const messagesContainer = document.querySelector('.chat-messages');
      if (!messagesContainer) return;
  
      const messageElement = document.createElement('div');
      messageElement.className = `chat-message ${type}`;
      messageElement.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
      `;
  
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  
    showTypingIndicator() {
      const messagesContainer = document.querySelector('.chat-messages');
      if (!messagesContainer) return;
  
      const indicator = document.createElement('div');
      indicator.className = 'typing-indicator';
      indicator.innerHTML = `
        <div class="typing-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `;
  
      messagesContainer.appendChild(indicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  
    hideTypingIndicator() {
      const indicator = document.querySelector('.typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  
    getChatContext() {
      return {
        current_tab: this.currentTab,
        active_drops: this.getActiveDropsData(),
        recent_performance: this.getRecentPerformanceData()
      };
    }
  
    /**
     * Drop Management
     */
    initDropManagement() {
      const createDropBtn = document.querySelector('.create-drop-btn');
      if (createDropBtn) {
        createDropBtn.addEventListener('click', () => {
          this.openCreateDropModal();
        });
      }
  
      // Initialize drop action buttons
      this.initDropActionButtons();
    }
  
    initDropActionButtons() {
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-drop-btn')) {
          const dropId = e.target.dataset.dropId;
          this.editDrop(dropId);
        }
        
        if (e.target.classList.contains('pause-drop-btn')) {
          const dropId = e.target.dataset.dropId;
          this.pauseDrop(dropId);
        }
        
        if (e.target.classList.contains('delete-drop-btn')) {
          const dropId = e.target.dataset.dropId;
          this.deleteDrop(dropId);
        }
      });
    }
  
    openCreateDropModal() {
      // This would open a modal for creating new drops
      this.trackEvent('create_drop_initiated');
      
      // For now, redirect to a create page or show a modal
      this.showNotification('Drop creation feature coming soon!', 'info');
    }
  
    /**
     * Real-time Updates
     */
    setupRealTimeUpdates() {
      if (!window.WebSocket) {
        this.log('WebSocket not supported');
        return;
      }
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/apps/studio-sivad/collaborator-ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.log('Real-time updates connected');
          this.sendWSMessage({
            type: 'subscribe',
            collaborator_id: this.getCollaboratorId()
          });
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleRealTimeUpdate(data);
          } catch (error) {
            this.log('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          this.log('Real-time updates disconnected, attempting reconnect...');
          setTimeout(() => {
            this.setupRealTimeUpdates();
          }, 5000);
        };
        
      } catch (error) {
        this.log('WebSocket initialization failed:', error);
      }
    }
  
    handleRealTimeUpdate(data) {
      switch (data.type) {
        case 'new_order':
          this.handleNewOrder(data.payload);
          break;
        case 'allocation_update':
          this.handleAllocationUpdate(data.payload);
          break;
        case 'ai_recommendation':
          this.loadAIRecommendations();
          break;
        case 'earnings_update':
          this.handleEarningsUpdate(data.payload);
          break;
      }
    }
  
    handleNewOrder(orderData) {
      // Update metrics immediately
      this.updateOrderMetrics(orderData);
      
      // Show notification
      this.showNotification(`New order received! +${orderData.amount} 🎉`, 'success');
      
      // Track event
      this.trackEvent('new_order_received', {
        amount: orderData.amount,
        product_id: orderData.product_id
      });
    }
  
    /**
     * Utility Functions
     */
    async apiCall(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
  
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    }
  
    formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toLocaleString();
    }
  
    formatFollowers(num) {
      return this.formatNumber(num);
    }
  
    getCollaboratorId() {
      return document.querySelector('[data-collaborator-id]')?.dataset.collaboratorId || 
             document.body.dataset.collaboratorId;
    }
  
    showDashboardLoading(show) {
      const loader = document.querySelector('.dashboard-loader');
      if (loader) {
        loader.style.display = show ? 'block' : 'none';
      }
    }
  
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-message">${message}</span>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      // Style notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: this.getNotificationColor(type),
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        zIndex: '10000',
        minWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideInRight 0.3s ease'
      });
      
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }
      }, 5000);
    }
  
    getNotificationColor(type) {
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return colors[type] || colors.info;
    }
  
    showSuccessMessage(message) {
      this.showNotification(message, 'success');
    }
  
    showErrorMessage(message) {
      this.showNotification(message, 'error');
    }
  
    refreshDashboard() {
      this.loadDashboardData();
    }
  
    log(...args) {
      if (this.debug) {
        console.log('[CollaboratorPortal]', ...args);
      }
    }
  }
  
  /**
   * Initialize Collaborator Portal
   */
  (function() {
    // Only initialize on collaborator portal pages
    if (document.querySelector('.collaborator-portal') || 
        window.location.pathname.includes('collaborator-portal')) {
      window.collaboratorPortal = new CollaboratorPortal();
    }
  })();