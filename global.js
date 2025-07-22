/**
 * Studio Sivad - Global JavaScript
 * Core functionality and utilities for the Studio Sivad theme
 * Version: 1.0.0
 */

// Utility Functions
function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
      )
    );
  }
  
  function trapFocus(container, elementToFocus = container) {
    var elements = getFocusableElements(container);
    var first = elements[0];
    var last = elements[elements.length - 1];
  
    removeTrapFocus();
  
    container.setAttribute('tabindex', '-1');
    elementToFocus.focus();
  
    function focusHandler(event) {
      if (event.code.toUpperCase() !== 'TAB') return;
  
      if (event.target === last && !event.shiftKey) {
        event.preventDefault();
        first.focus();
      }
  
      if ((event.target === container || event.target === first) && event.shiftKey) {
        event.preventDefault();
        last.focus();
      }
    }
  
    document.addEventListener('keydown', focusHandler);
  
    container.focusHandler = focusHandler;
  }
  
  function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener('keydown', document.activeElement.focusHandler);
  
    if (elementToFocus) elementToFocus.focus();
  }
  
  function onKeyUpEscape(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;
  
    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;
  
    const summaryElement = openDetailsElement.querySelector('summary');
    openDetailsElement.removeAttribute('open');
    summaryElement.setAttribute('aria-expanded', false);
    summaryElement.focus();
  }
  
  // Details/Summary Accessibility
  document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));
  
    if(summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute('aria-controls', summary.nextElementSibling.id);
    }
  
    summary.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });
  
    if (summary.closest('header-drawer')) return;
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });
  
  // Cart Functionality
  class CartManager {
    constructor() {
      this.cart = {};
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.updateCartCount();
    }
  
    bindEvents() {
      // Add to cart forms
      document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
        form.addEventListener('submit', this.handleAddToCart.bind(this));
      });
  
      // Cart quantity changes
      document.querySelectorAll('.cart-quantity-input').forEach(input => {
        input.addEventListener('change', this.handleQuantityChange.bind(this));
      });
  
      // Remove from cart
      document.querySelectorAll('.cart-remove').forEach(button => {
        button.addEventListener('click', this.handleRemoveFromCart.bind(this));
      });
    }
  
    async handleAddToCart(event) {
      event.preventDefault();
      
      const form = event.target;
      const formData = new FormData(form);
      const button = form.querySelector('[type="submit"]');
      
      // Show loading state
      const originalText = button.textContent;
      button.textContent = 'Adding...';
      button.disabled = true;
  
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });
  
        if (response.ok) {
          const item = await response.json();
          this.showAddToCartNotification(item);
          this.updateCartCount();
        } else {
          throw new Error('Failed to add item to cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        this.showNotification('Error adding item to cart', 'error');
      } finally {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  
    async handleQuantityChange(event) {
      const input = event.target;
      const line = input.dataset.line;
      const quantity = parseInt(input.value);
  
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            line: line,
            quantity: quantity
          })
        });
  
        if (response.ok) {
          this.updateCartCount();
          // Optionally reload cart section
          this.reloadCartSection();
        }
      } catch (error) {
        console.error('Quantity change error:', error);
      }
    }
  
    async handleRemoveFromCart(event) {
      event.preventDefault();
      
      const button = event.target;
      const line = button.dataset.line;
  
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            line: line,
            quantity: 0
          })
        });
  
        if (response.ok) {
          this.updateCartCount();
          this.reloadCartSection();
          this.showNotification('Item removed from cart', 'success');
        }
      } catch (error) {
        console.error('Remove from cart error:', error);
      }
    }
  
    async updateCartCount() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        
        document.querySelectorAll('.cart-count').forEach(element => {
          element.textContent = cart.item_count;
        });
  
        this.cart = cart;
      } catch (error) {
        console.error('Cart count update error:', error);
      }
    }
  
    async reloadCartSection() {
      // This would reload the cart drawer/section if present
      const cartSection = document.querySelector('#cart-drawer');
      if (cartSection) {
        // Implement cart section reload logic
      }
    }
  
    showAddToCartNotification(item) {
      this.showNotification(`${item.product_title} added to cart`, 'success');
    }
  
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 0.9rem;
      `;
      notification.textContent = message;
  
      document.body.appendChild(notification);
  
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);
  
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }
  
  // Variant Selection
  class VariantSelector {
    constructor() {
      this.init();
    }
  
    init() {
      document.querySelectorAll('.variant-selector').forEach(selector => {
        this.bindVariantSelector(selector);
      });
    }
  
    bindVariantSelector(selector) {
      const options = selector.querySelectorAll('.variant-option');
      const hiddenInput = selector.querySelector('input[name="id"]');
  
      options.forEach(option => {
        option.addEventListener('click', () => {
          // Remove active class from all options
          options.forEach(opt => opt.classList.remove('active'));
          
          // Add active class to clicked option
          option.classList.add('active');
          
          // Update hidden input
          if (hiddenInput) {
            hiddenInput.value = option.dataset.variantId;
          }
  
          // Update price and availability
          this.updateProductInfo(option.dataset.variantId);
        });
      });
    }
  
    updateProductInfo(variantId) {
      // Update product price, availability, etc.
      const variant = this.getVariantById(variantId);
      if (!variant) return;
  
      // Update price
      const priceElement = document.querySelector('.product-price');
      if (priceElement && variant.price) {
        priceElement.textContent = `$${(variant.price / 100).toFixed(2)}`;
      }
  
      // Update availability
      const addToCartButton = document.querySelector('.add-to-cart-button');
      if (addToCartButton) {
        if (variant.available) {
          addToCartButton.textContent = 'Add to Cart';
          addToCartButton.disabled = false;
        } else {
          addToCartButton.textContent = 'Sold Out';
          addToCartButton.disabled = true;
        }
      }
    }
  
    getVariantById(variantId) {
      // This would typically fetch variant data from a global product object
      return window.productVariants?.find(v => v.id == variantId);
    }
  }
  
  // Image Gallery
  class ImageGallery {
    constructor() {
      this.init();
    }
  
    init() {
      document.querySelectorAll('.image-gallery').forEach(gallery => {
        this.bindGallery(gallery);
      });
    }
  
    bindGallery(gallery) {
      const thumbnails = gallery.querySelectorAll('.thumbnail');
      const mainImage = gallery.querySelector('.main-image');
  
      thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active class from all thumbnails
          thumbnails.forEach(thumb => thumb.classList.remove('active'));
          
          // Add active class to clicked thumbnail
          thumbnail.classList.add('active');
          
          // Update main image
          if (mainImage) {
            const newImageSrc = thumbnail.dataset.imageUrl || thumbnail.href;
            mainImage.src = newImageSrc;
            mainImage.alt = thumbnail.dataset.imageAlt || thumbnail.alt;
          }
        });
      });
    }
  }
  
  // Lazy Loading
  class LazyLoader {
    constructor() {
      this.init();
    }
  
    init() {
      if ('IntersectionObserver' in window) {
        this.createObserver();
      } else {
        // Fallback for older browsers
        this.loadAllImages();
      }
    }
  
    createObserver() {
      const options = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      };
  
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, options);
  
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.observer.observe(img);
      });
    }
  
    loadImage(img) {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
      }
    }
  
    loadAllImages() {
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.loadImage(img);
      });
    }
  }
  
  // Mobile Menu
  class MobileMenu {
    constructor() {
      this.init();
    }
  
    init() {
      const menuToggle = document.querySelector('.mobile-menu-toggle');
      const mobileMenu = document.querySelector('.mobile-menu');
      const menuClose = document.querySelector('.mobile-menu-close');
  
      if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
          mobileMenu.classList.add('active');
          document.body.classList.add('menu-open');
          trapFocus(mobileMenu);
        });
      }
  
      if (menuClose && mobileMenu) {
        menuClose.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
          document.body.classList.remove('menu-open');
          removeTrapFocus(menuToggle);
        });
      }
  
      // Close on overlay click
      if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
          if (e.target === mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            removeTrapFocus(menuToggle);
          }
        });
      }
  
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          document.body.classList.remove('menu-open');
          removeTrapFocus(menuToggle);
        }
      });
    }
  }
  
  // Initialize everything when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functionality
    new CartManager();
    new VariantSelector();
    new ImageGallery();
    new LazyLoader();
    new MobileMenu();
  
    // Initialize theme-specific features if settings allow
    if (window.themeSettings) {
      if (window.themeSettings.enable_lazy_loading) {
        new LazyLoader();
      }
    }
  
    // Accessibility improvements
    document.querySelectorAll('a[href="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
      });
    });
  
    // Form validation
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', function(e) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
  
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
          } else {
            field.classList.remove('error');
          }
        });
  
        if (!isValid) {
          e.preventDefault();
        }
      });
    });
  });
  
  // Export for global access
  window.StudioSivad = {
    CartManager,
    VariantSelector,
    ImageGallery,
    LazyLoader,
    MobileMenu,
    trapFocus,
    removeTrapFocus,
    onKeyUpEscape
  };