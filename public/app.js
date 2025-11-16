let allProducts = [];
let whatsappNumber = '';
let currentFilter = 'all';

// Load WhatsApp number
async function loadWhatsAppNumber() {
  try {
    const response = await fetch('/api/whatsapp');
    const data = await response.json();
    whatsappNumber = data.number;
  } catch (error) {
    console.error('Error loading WhatsApp number:', error);
  }
}

// Load products
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    allProducts = products;
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    showNoProducts();
  }
}

// Display products
function displayProducts(products) {
  const container = document.getElementById('products-container');
  const noProductsEl = document.getElementById('no-products');

  if (products.length === 0) {
    showNoProducts();
    return;
  }

  noProductsEl.style.display = 'none';
  container.innerHTML = products.map(product => createProductCard(product)).join('');

  // Add event listeners to like buttons
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLike(btn.dataset.productId);
    });
  });
}

// Create product card HTML
function createProductCard(product) {
  const heartIcon = product.user_liked ? '❤️' : '🤍';
  const likedClass = product.user_liked ? 'liked' : '';
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in "${product.title}" - ${product.price ? '$' + product.price : 'Price not listed'}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return `
    <div class="product-card" data-category="${product.category || 'other'}">
      <img src="${product.image_path}" alt="${product.title}" class="product-image" loading="lazy">
      <div class="product-info">
        <div class="product-header">
          <div>
            <h3 class="product-title">${product.title}</h3>
            ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
          </div>
        </div>
        ${product.price ? `<div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>` : ''}
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <div class="product-actions">
          <button class="like-btn ${likedClass}" data-product-id="${product.id}">
            <span class="heart">${heartIcon}</span>
            <span>${product.likes_count || 0}</span>
          </button>
          <a href="${whatsappLink}" target="_blank" class="whatsapp-btn">
            <span>💬</span>
            <span>Buy on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// Handle like/unlike
async function handleLike(productId) {
  try {
    const response = await fetch(`/api/products/${productId}/like`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      // Reload products to update the UI
      await loadProducts();
      filterProducts(currentFilter);
    }
  } catch (error) {
    console.error('Error liking product:', error);
  }
}

// Show no products message
function showNoProducts() {
  document.getElementById('products-container').innerHTML = '';
  document.getElementById('no-products').style.display = 'block';
}

// Filter products by category
function filterProducts(category) {
  currentFilter = category;

  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });

  // Filter and display products
  const filtered = category === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === category);

  displayProducts(filtered);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadWhatsAppNumber();
  await loadProducts();

  // Add filter button listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterProducts(btn.dataset.category);
    });
  });

  // Refresh products every 30 seconds
  setInterval(loadProducts, 30000);
});
