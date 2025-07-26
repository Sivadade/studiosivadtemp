/**
 * Studio Sivad - Admin Controls
 * Handles multi-store management, template control, and admin analytics
 * Version: 1.0.0
 */

class StudioSivadAdmin {
    constructor() {
      this.debug = false;
      this.refreshInterval = 30000; // 30 seconds
      this.ws = null;
      this.stores = [];
      this.selectedStores = new Set();
      
      this.init();
    }
  
    init() {
      this.log('Initializing Studio Sivad Admin...');
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.startAdmin();
        });
      } else {
        this.startAdmin();
      }
    }
  
    startAdmin() {
      // Only initialize if we're on admin pages
      if (!this.isAdminPage()) {
        return;
      }
  
      this.initAdminPanel();
      this.initMultiStoreManagement();
      this.initTemplateControl();
      this.initNetworkAnalytics();
      this.setupRealTimeMonitoring();
      this.initBulkActions();
      
      this.log('Studio Sivad Admin initialized successfully');
    }
  
    isAdminPage() {
      return document.querySelector('.studio-sivad-admin') ||
             window.location.pathname.includes('admin') ||
             document.body.classList.contains('admin-page');
    }
  
    /**
     * Admin Panel Management
     */
    initAdminPanel() {
      this.loadNetworkOverview();
      this.initAdminNavigation();
      this.setupAutoRefresh();
      
      this.log('Admin panel initialized');
    }
  
    async loadNetworkOverview() {
      try {
        this.showLoadingState('.network-overview', true);
        
        const response = await this.apiCall('/apps/studio-sivad/admin/network-overview');
        const data = await response.json();
        
        this.updateNetworkMetrics(data);
        this.stores = data.stores || [];
        this.updateStoresList(this.stores);
        
        this.showLoadingState('.network-overview', false);
        
      } catch (error) {
        this.log('Failed to load network overview:', error);
        this.showErrorMessage('Failed to load network data');
        this.showLoadingState('.network-overview', false);
      }
    }
  
    updateNetworkMetrics(data) {
      // Update main metrics
      this.updateMetric('.total-network-revenue', data.total_revenue, '$');
      this.updateMetric('.total-studio-earnings', data.studio_earnings, '$');
      this.updateMetric('.active-stores-count', data.active_stores);
      this.updateMetric('.avg-conversion-rate', data.avg_conversion, '%');
      this.updateMetric('.total-collaborators', data.total_collaborators);
      this.updateMetric('.monthly-growth', data.monthly_growth, '%');
  
      // Update trends
      this.updateTrend('.revenue-trend', data.revenue_trend);
      this.updateTrend('.stores-trend', data.stores_trend);
      this.updateTrend('.conversion-trend', data.conversion_trend);
  
      // Update charts if available
      this.updateCharts(data.charts);
  
      this.log('Network metrics updated:', data);
    }
  
    updateMetric(selector, value, prefix = '', suffix = '') {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = `${prefix}${this.formatNumber(value)}${suffix}`;
      }
    }
  
    updateTrend(selector, trend) {
      const element = document.querySelector(selector);
      if (element && trend !== undefined) {
        const isPositive = trend > 0;
        const isNegative = trend < 0;
        
        element.className = `trend ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`;
        element.textContent = `${isPositive ? '+' : ''}${trend.toFixed(1)}%`;
      }
    }
  
    initAdminNavigation() {
      const navItems = document.querySelectorAll('.admin-nav-item');
      
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const section = item.dataset.section;
          this.switchAdminSection(section);
        });
      });
    }
  
    switchAdminSection(sectionId) {
      // Update navigation
      document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
      });
      
      // Activate selected
      const navItem = document.querySelector(`[data-section="${sectionId}"]`);
      const section = document.getElementById(sectionId);
      
      if (navItem) navItem.classList.add('active');
      if (section) section.classList.add('active');
      
      // Load section-specific data
      this.onSectionSwitch(sectionId);
      
      this.log('Switched to admin section:', sectionId);
    }
  
    onSectionSwitch(sectionId) {
      switch (sectionId) {
        case 'overview':
          this.loadNetworkOverview();
          break;
        case 'stores':
          this.loadStoreManagement();
          break;
        case 'templates':
          this.loadTemplateControl();
          break;
        case 'analytics':
          this.loadNetworkAnalytics();
          break;
        case 'collaborators':
          this.loadCollaboratorManagement();
          break;
      }
    }
  
    setupAutoRefresh() {
      // Auto-refresh network data
      setInterval(() => {
        this.loadNetworkOverview();
      }, this.refreshInterval);
    }
  
    /**
     * Multi-Store Management
     */
    initMultiStoreManagement() {
      this.initStoreFilters();
      this.initStoreActions();
      this.initBulkSelection();
      
      // Store action handlers
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('store-action-btn')) {
          const action = e.target.dataset.action;
          const storeId = e.target.dataset.storeId;
          this.performStoreAction(action, storeId);
        }
        
        if (e.target.classList.contains('view-store-btn')) {
          const storeId = e.target.dataset.storeId;
          this.viewStore(storeId);
        }
        
        if (e.target.classList.contains('edit-store-btn')) {
          const storeId = e.target.dataset.storeId;
          this.editStore(storeId);
        }
      });
  
      this.log('Multi-store management initialized');
    }
  
    updateStoresList(stores) {
      const container = document.querySelector('.stores-list');
      if (!container) return;
  
      container.innerHTML = '';
      
      if (stores.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No Stores Found</h3>
            <p>No collaborator stores are currently active.</p>
          </div>
        `;
        return;
      }
  
      stores.forEach(store => {
        const storeCard = this.createStoreCard(store);
        container.appendChild(storeCard);
      });
    }
  
    createStoreCard(store) {
      const card = document.createElement('div');
      card.className = `store-card ${store.status}`;
      card.dataset.storeId = store.id;
      
      const healthClass = store.health >= 95 ? 'excellent' : 
                         store.health >= 85 ? 'good' : 
                         store.health >= 70 ? 'fair' : 'poor';
  
      card.innerHTML = `
        <div class="store-header">
          <div class="store-info">
            <input type="checkbox" class="store-checkbox" value="${store.id}" 
                   onchange="studioSivadAdmin.toggleStoreSelection('${store.id}', this.checked)">
            <div class="store-avatar">
              <img src="${store.avatar || '/assets/default-store-avatar.png'}" alt="${store.name}">
            </div>
            <div class="store-details">
              <h3>${store.name}</h3>
              <p class="store-domain">${store.domain}</p>
              <span class="store-status ${store.status}">${store.status.toUpperCase()}</span>
            </div>
          </div>
          <div class="store-health">
            <div class="health-score ${healthClass}">${store.health}%</div>
            <div class="health-label">Health</div>
          </div>
        </div>
        
        <div class="store-metrics">
          <div class="metric">
            <div class="metric-value">${this.formatNumber(store.revenue_30d)}</div>
            <div class="metric-label">30d Revenue</div>
          </div>
          <div class="metric">
            <div class="metric-value">${this.formatNumber(store.studio_earnings)}</div>
            <div class="metric-label">Studio Earnings</div>
          </div>
          <div class="metric">
            <div class="metric-value">${store.conversion_rate}%</div>
            <div class="metric-label">Conversion</div>
          </div>
          <div class="metric">
            <div class="metric-value">${store.drops_active}</div>
            <div class="metric-label">Active Drops</div>
          </div>
        </div>
        
        <div class="store-actions">
          <button class="btn btn-sm btn-secondary view-store-btn" data-store-id="${store.id}">
            View
          </button>
          <button class="btn btn-sm btn-secondary edit-store-btn" data-store-id="${store.id}">
            Edit
          </button>
          <div class="dropdown">
            <button class="btn btn-sm btn-secondary dropdown-toggle">
              Actions
            </button>
            <div class="dropdown-menu">
              <button class="dropdown-item store-action-btn" data-action="update-template" data-store-id="${store.id}">
                Update Template
              </button>
              <button class="dropdown-item store-action-btn" data-action="sync-data" data-store-id="${store.id}">
                Sync Data
              </button>
              <button class="dropdown-item store-action-btn" data-action="generate-report" data-store-id="${store.id}">
                Generate Report
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item store-action-btn" data-action="pause" data-store-id="${store.id}">
                Pause Store
              </button>
            </div>
          </div>
        </div>
        
        <div class="store-footer">
          <div class="last-updated">
            Last updated: ${this.formatTimeAgo(store.last_updated)}
          </div>
          <div class="template-version">
            Template v${store.template_version}
          </div>
        </div>
      `;
  
      return card;
    }
  
    async performStoreAction(action, storeId) {
      try {
        this.showActionLoading(storeId, true);
        
        const response = await this.apiCall('/apps/studio-sivad/admin/store-action', {
          method: 'POST',
          body: JSON.stringify({
            action: action,
            store_id: storeId
          })
        });
  
        const result = await response.json();
        
        if (result.success) {
          this.showSuccessMessage(`Action "${action}" completed successfully for ${result.store_name}`);
          this.loadNetworkOverview(); // Refresh data
          this.trackAdminAction(action, storeId);
        } else {
          throw new Error(result.message || 'Action failed');
        }
        
      } catch (error) {
        this.log('Store action failed:', error);
        this.showErrorMessage(`Action failed: ${error.message}`);
      } finally {
        this.showActionLoading(storeId, false);
      }
    }
  
    initStoreFilters() {
      const filterInputs = document.querySelectorAll('.store-filter');
      
      filterInputs.forEach(input => {
        input.addEventListener('input', () => {
          this.applyStoreFilters();
        });
      });
  
      const sortSelect = document.querySelector('.store-sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          this.sortStores(sortSelect.value);
        });
      }
    }
  
    applyStoreFilters() {
      const searchTerm = document.querySelector('.store-search')?.value.toLowerCase() || '';
      const statusFilter = document.querySelector('.status-filter')?.value || 'all';
      const healthFilter = document.querySelector('.health-filter')?.value || 'all';
  
      const storeCards = document.querySelectorAll('.store-card');
      
      storeCards.forEach(card => {
        const storeName = card.querySelector('h3').textContent.toLowerCase();
        const storeStatus = card.dataset.status || '';
        const healthScore = parseInt(card.querySelector('.health-score').textContent);
        
        let show = true;
        
        // Apply search filter
        if (searchTerm && !storeName.includes(searchTerm)) {
          show = false;
        }
        
        // Apply status filter
        if (statusFilter !== 'all' && storeStatus !== statusFilter) {
          show = false;
        }
        
        // Apply health filter
        if (healthFilter !== 'all') {
          const healthThresholds = {
            excellent: 95,
            good: 85,
            fair: 70,
            poor: 0
          };
          
          if (healthScore < healthThresholds[healthFilter]) {
            show = false;
          }
        }
        
        card.style.display = show ? 'block' : 'none';
      });
    }
  
    initBulkSelection() {
      const selectAllCheckbox = document.querySelector('.select-all-stores');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
          this.selectAllStores(e.target.checked);
        });
      }
  
      // Bulk action buttons
      const bulkActionBtns = document.querySelectorAll('.bulk-action-btn');
      bulkActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          this.performBulkAction(action);
        });
      });
    }
  
    toggleStoreSelection(storeId, selected) {
      if (selected) {
        this.selectedStores.add(storeId);
      } else {
        this.selectedStores.delete(storeId);
      }
      
      this.updateBulkActionButtons();
    }
  
    selectAllStores(selectAll) {
      const checkboxes = document.querySelectorAll('.store-checkbox');
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
        this.toggleStoreSelection(checkbox.value, selectAll);
      });
    }
  
    updateBulkActionButtons() {
      const bulkActions = document.querySelector('.bulk-actions');
      if (bulkActions) {
        bulkActions.style.display = this.selectedStores.size > 0 ? 'block' : 'none';
        
        const countElement = bulkActions.querySelector('.selected-count');
        if (countElement) {
          countElement.textContent = `${this.selectedStores.size} store(s) selected`;
        }
      }
    }
  
    async performBulkAction(action) {
      if (this.selectedStores.size === 0) {
        this.showErrorMessage('No stores selected');
        return;
      }
  
      const confirmMessage = `Are you sure you want to perform "${action}" on ${this.selectedStores.size} store(s)?`;
      if (!confirm(confirmMessage)) {
        return;
      }
  
      try {
        this.showBulkActionLoading(true);
        
        const response = await this.apiCall('/apps/studio-sivad/admin/bulk-action', {
          method: 'POST',
          body: JSON.stringify({
            action: action,
            store_ids: Array.from(this.selectedStores)
          })
        });
  
        const result = await response.json();
        
        if (result.success) {
          this.showSuccessMessage(`Bulk action "${action}" completed on ${result.updated_count} store(s)`);
          this.loadNetworkOverview();
          this.clearStoreSelection();
        } else {
          throw new Error(result.message || 'Bulk action failed');
        }
        
      } catch (error) {
        this.log('Bulk action failed:', error);
        this.showErrorMessage(`Bulk action failed: ${error.message}`);
      } finally {
        this.showBulkActionLoading(false);
      }
    }
  
    clearStoreSelection() {
      this.selectedStores.clear();
      document.querySelectorAll('.store-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      this.updateBulkActionButtons();
    }
  
    /**
     * Template Control
     */
    initTemplateControl() {
      const updateBtn = document.querySelector('.template-update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          this.pushTemplateUpdate();
        });
      }
  
      const settingsForm = document.querySelector('.global-settings-form');
      if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.updateGlobalSettings(new FormData(settingsForm));
        });
      }
  
      // Template version management
      this.initTemplateVersions();
      
      this.log('Template control initialized');
    }
  
    async pushTemplateUpdate() {
      const selectedVersion = document.querySelector('.template-version-select')?.value;
      const targetStores = this.getTemplateUpdateTargets();
      
      const confirmMessage = `Push template update (v${selectedVersion}) to ${targetStores.length} store(s)? This action cannot be undone.`;
      if (!confirm(confirmMessage)) {
        return;
      }
  
      try {
        this.showTemplateUpdateLoading(true);
        
        const response = await this.apiCall('/apps/studio-sivad/admin/push-template-update', {
          method: 'POST',
          body: JSON.stringify({
            version: selectedVersion,
            target_stores: targetStores,
            rollback_enabled: true
          })
        });
  
        const result = await response.json();
        
        if (result.success) {
          this.showSuccessMessage(`Template update pushed to ${result.stores_updated} store(s)`);
          this.loadNetworkOverview();
          this.trackTemplateUpdate(selectedVersion, result.stores_updated);
        } else {
          throw new Error(result.message || 'Template update failed');
        }
        
      } catch (error) {
        this.log('Template update failed:', error);
        this.showErrorMessage(`Template update failed: ${error.message}`);
      } finally {
        this.showTemplateUpdateLoading(false);
      }
    }
  
    getTemplateUpdateTargets() {
      // Get stores that need updates or are selected
      const outdatedStores = this.stores.filter(store => 
        this.isTemplateOutdated(store.template_version)
      );
      
      return this.selectedStores.size > 0 ? 
             Array.from(this.selectedStores) : 
             outdatedStores.map(store => store.id);
    }
  
    isTemplateOutdated(version) {
      const currentVersion = document.querySelector('.current-template-version')?.textContent || '1.0.0';
      return this.compareVersions(version, currentVersion) < 0;
    }
  
    compareVersions(version1, version2) {
      const v1parts = version1.split('.').map(Number);
      const v2parts = version2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part < v2part) return -1;
        if (v1part > v2part) return 1;
      }
      
      return 0;
    }
  
    async updateGlobalSettings(formData) {
      const settings = Object.fromEntries(formData);
  
      try {
        const response = await this.apiCall('/apps/studio-sivad/admin/global-settings', {
          method: 'POST',
          body: JSON.stringify(settings)
        });
  
        const result = await response.json();
        
        if (result.success) {
          this.showSuccessMessage('Global settings updated successfully');
          this.trackSettingsUpdate(settings);
        } else {
          throw new Error(result.message || 'Settings update failed');
        }
        
      } catch (error) {
        this.log('Settings update failed:', error);
        this.showErrorMessage(`Settings update failed: ${error.message}`);
      }
    }
  
    initTemplateVersions() {
      const versionSelect = document.querySelector('.template-version-select');
      if (versionSelect) {
        this.loadTemplateVersions(versionSelect);
      }
  
      // Version comparison tool
      const compareBtn = document.querySelector('.compare-versions-btn');
      if (compareBtn) {
        compareBtn.addEventListener('click', () => {
          this.openVersionComparison();
        });
      }
    }
  
    async loadTemplateVersions(selectElement) {
      try {
        const response = await this.apiCall('/apps/studio-sivad/admin/template-versions');
        const versions = await response.json();
        
        selectElement.innerHTML = '';
        versions.forEach(version => {
          const option = document.createElement('option');
          option.value = version.version;
          option.textContent = `v${version.version} - ${version.description}`;
          option.selected = version.is_current;
          selectElement.appendChild(option);
        });
        
      } catch (error) {
        this.log('Failed to load template versions:', error);
      }
    }
  
    /**
     * Network Analytics
     */
    initNetworkAnalytics() {
      this.initAnalyticsCharts();
      this.initAnalyticsFilters();
      this.initExportFeatures();
      
      this.log('Network analytics initialized');
    }
  
    async loadNetworkAnalytics() {
      try {
        this.showLoadingState('.analytics-section', true);
        
        const timeRange = this.getAnalyticsTimeRange();
        const response = await this.apiCall(`/apps/studio-sivad/admin/analytics?range=${timeRange}`);
        const data = await response.json();
        
        this.updateAnalyticsCharts(data.charts);
        this.updateAnalyticsMetrics(data.metrics);
        this.updateTopPerformers(data.top_performers);
        
        this.showLoadingState('.analytics-section', false);
        
      } catch (error) {
        this.log('Failed to load analytics:', error);
        this.showErrorMessage('Failed to load analytics data');
        this.showLoadingState('.analytics-section', false);
      }
    }
  
    updateAnalyticsCharts(charts) {
      // Update revenue chart
      if (charts.revenue && window.Chart) {
        this.updateRevenueChart(charts.revenue);
      }
      
      // Update conversion chart
      if (charts.conversion) {
        this.updateConversionChart(charts.conversion);
      }
      
      // Update growth chart
      if (charts.growth) {
        this.updateGrowthChart(charts.growth);
      }
    }
  
    updateRevenueChart(data) {
      const canvas = document.querySelector('#revenue-chart');
      if (!canvas) return;
  
      const ctx = canvas.getContext('2d');
      
      if (this.revenueChart) {
        this.revenueChart.destroy();
      }
      
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Network Revenue',
            data: data.revenue,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }, {
            label: 'Studio Sivad Earnings',
            data: data.studio_earnings,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Revenue Trends'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }
  
    /**
     * Real-time Monitoring
     */
    setupRealTimeMonitoring() {
      if (!window.WebSocket) {
        this.log('WebSocket not supported for admin monitoring');
        return;
      }
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/apps/studio-sivad/admin-ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.log('Admin monitoring connected');
          this.sendWSMessage({
            type: 'subscribe',
            admin_id: this.getAdminId()
          });
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleAdminUpdate(data);
          } catch (error) {
            this.log('Failed to parse admin WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          this.log('Admin monitoring disconnected, attempting reconnect...');
          setTimeout(() => {
            this.setupRealTimeMonitoring();
          }, 5000);
        };
        
      } catch (error) {
        this.log('Admin WebSocket initialization failed:', error);
      }
    }
  
    handleAdminUpdate(data) {
      switch (data.type) {
        case 'network_metrics_update':
          this.updateNetworkMetrics(data.payload);
          break;
        case 'new_store_added':
          this.handleNewStore(data.payload);
          break;
        case 'store_status_change':
          this.updateStoreStatus(data.payload);
          break;
        case 'template_update_complete':
          this.handleTemplateUpdateComplete(data.payload);
          break;
        case 'alert':
          this.handleAdminAlert(data.payload);
          break;
      }
    }
  
    handleNewStore(storeData) {
      this.showNotification(`New store added: ${storeData.store_name}`, 'info');
      this.loadNetworkOverview(); // Refresh store list
      this.trackNewStore(storeData);
    }
  
    updateStoreStatus(statusData) {
      const storeCard = document.querySelector(`[data-store-id="${statusData.store_id}"]`);
      if (storeCard) {
        const statusElement = storeCard.querySelector('.store-status');
        if (statusElement) {
          statusElement.textContent = statusData.status.toUpperCase();
          statusElement.className = `store-status ${statusData.status}`;
        }
      }
    }
  
    handleAdminAlert(alert) {
      this.showNotification(alert.message, alert.type || 'warning');
      
      if (alert.action_required) {
        this.showActionRequiredDialog(alert);
      }
    }
  
    /**
     * Utility Functions
     */
    async apiCall(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${this.getAdminToken()}`
        }
      };
  
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API call failed: ${response.status}`);
      }
      
      return response;
    }
  
    sendWSMessage(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
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
  
    formatTimeAgo(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInSeconds = Math.floor((now - time) / 1000);
  
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  
    getAdminId() {
      return document.querySelector('[data-admin-id]')?.dataset.adminId || 
             document.body.dataset.adminId || 
             'admin';
    }
  
    getAdminToken() {
      return document.querySelector('meta[name="admin-token"]')?.content ||
             localStorage.getItem('studio_sivad_admin_token') ||
             '';
    }
  
    showLoadingState(selector, show) {
      const element = document.querySelector(selector);
      if (element) {
        if (show) {
          element.classList.add('loading');
        } else {
          element.classList.remove('loading');
        }
      }
    }
  
    showActionLoading(storeId, show) {
      const storeCard = document.querySelector(`[data-store-id="${storeId}"]`);
      if (storeCard) {
        const actions = storeCard.querySelector('.store-actions');
        if (actions) {
          actions.style.opacity = show ? '0.5' : '1';
          actions.style.pointerEvents = show ? 'none' : 'auto';
        }
      }
    }
  
    showBulkActionLoading(show) {
      const bulkActions = document.querySelector('.bulk-actions');
      if (bulkActions) {
        bulkActions.style.opacity = show ? '0.5' : '1';
        bulkActions.style.pointerEvents = show ? 'none' : 'auto';
      }
    }
  
    showTemplateUpdateLoading(show) {
      const updateBtn = document.querySelector('.template-update-btn');
      if (updateBtn) {
        updateBtn.disabled = show;
        updateBtn.textContent = show ? 'Updating...' : 'Push Update';
      }
    }
  
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `admin-notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">${this.getNotificationIcon(type)}</div>
          <div class="notification-message">${message}</div>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: this.getNotificationColor(type),
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        zIndex: '10000',
        minWidth: '350px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideInRight 0.3s ease'
      });
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }
      }, 7000);
    }
  
    getNotificationIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || icons.info;
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
  
    // Analytics tracking
    trackAdminAction(action, storeId) {
      this.sendAnalyticsEvent('admin_action', {
        action: action,
        store_id: storeId,
        admin_id: this.getAdminId()
      });
    }
  
    trackTemplateUpdate(version, storeCount) {
      this.sendAnalyticsEvent('template_update', {
        version: version,
        stores_updated: storeCount,
        admin_id: this.getAdminId()
      });
    }
  
    trackNewStore(storeData) {
      this.sendAnalyticsEvent('new_store_added', {
        store_id: storeData.store_id,
        collaborator_id: storeData.collaborator_id,
        admin_id: this.getAdminId()
      });
    }
  
    async sendAnalyticsEvent(event, data) {
      try {
        await this.apiCall('/apps/studio-sivad/admin/analytics', {
          method: 'POST',
          body: JSON.stringify({
            event: event,
            data: data,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        this.log('Failed to send admin analytics event:', error);
      }
    }
  
    log(...args) {
      if (this.debug) {
        console.log('[StudioSivadAdmin]', ...args);
      }
    }
  }
  
  /**
   * Initialize Studio Sivad Admin
   */
  (function() {
    // Only initialize on admin pages
    if (document.querySelector('.studio-sivad-admin') || 
        window.location.pathname.includes('/admin/') ||
        document.body.classList.contains('admin-page')) {
      window.studioSivadAdmin = new StudioSivadAdmin();
    }
  })();