// Check admin status on load
async function checkAdminStatus() {
  try {
    const response = await fetch('/api/admin/status');
    const data = await response.json();

    if (data.isAdmin) {
      showAdminPanel();
      loadAdminProducts();
    } else {
      showLoginForm();
    }
  } catch (error) {
    showLoginForm();
  }
}

// Show login form
function showLoginForm() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('admin-container').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-container').style.display = 'block';
}

// Handle login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      showAdminPanel();
      loadAdminProducts();
      errorEl.textContent = '';
    } else {
      errorEl.textContent = 'Invalid username or password';
    }
  } catch (error) {
    errorEl.textContent = 'Login failed. Please try again.';
  }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    showLoginForm();
    document.getElementById('login-form').reset();
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Image preview
document.getElementById('image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('image-preview');

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
});

// Handle product upload
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageEl = document.getElementById('upload-message');
  const formData = new FormData(e.target);

  try {
    messageEl.className = 'message';
    messageEl.textContent = 'Uploading...';

    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.className = 'message success';
      messageEl.textContent = 'Product uploaded successfully!';

      // Reset form
      e.target.reset();
      document.getElementById('image-preview').innerHTML = '';

      // Reload products
      loadAdminProducts();

      // Clear message after 3 seconds
      setTimeout(() => {
        messageEl.textContent = '';
      }, 3000);
    } else {
      messageEl.className = 'message error';
      messageEl.textContent = data.error || 'Upload failed';
    }
  } catch (error) {
    messageEl.className = 'message error';
    messageEl.textContent = 'Upload failed. Please try again.';
  }
});

// Load products for admin view
async function loadAdminProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();

    const container = document.getElementById('admin-products-grid');

    if (products.length === 0) {
      container.innerHTML = '<p class="no-products">No products yet. Upload your first product above!</p>';
      return;
    }

    container.innerHTML = products.map(product => createAdminProductCard(product)).join('');

    // Add delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this product?')) {
          deleteProduct(btn.dataset.productId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Create admin product card
function createAdminProductCard(product) {
  return `
    <div class="product-card admin-product-card">
      <button class="btn btn-danger delete-btn" data-product-id="${product.id}">Delete</button>
      <img src="${product.image_path}" alt="${product.title}" class="product-image">
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
          <div class="like-btn">
            <span class="heart">❤️</span>
            <span>${product.likes_count || 0} likes</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Delete product
async function deleteProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadAdminProducts();
    } else {
      alert('Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAdminStatus();
});
