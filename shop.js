import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://kpspglomfamxnhhopecp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc3BnbG9tZmFteG5oaG9wZWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgyMDgsImV4cCI6MjA2ODk0NDIwOH0.3gwysVcLzH8iV1i_IY6PhbkDHU5Mf_Tp-T-Dq26ZHAE'
);

async function loadShopProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('id', { ascending: false });

    const container = document.getElementById('products-wrapper');
    container.innerHTML = '';

    data.forEach(product => {
        const image = product.image_url || 'assets/img/default.jpg';
        const name = product.name || 'No Name';
        const price = product.price ? `£${product.price.toFixed(2)}` : 'N/A';
        const category = product.categories?.name || 'Uncategorized';

        container.innerHTML += `
      <div class="single-product border p-2 rounded shadow bg-white">
        <div class="product-image pos-rel">
          <a href="shop-details.html"><img src="${image}" alt="${name}" class="w-full h-60 object-cover"></a>
          <div class="product-action absolute top-2 right-2 space-x-2">
            <a href="#" class="quick-view-btn"><i class="fal fa-eye"></i></a>
            <a href="#" class="wishlist-btn"><i class="fal fa-heart"></i></a>
            <a href="#" class="compare-btn"><i class="fal fa-exchange"></i></a>
          </div>
          <div class="product-action-bottom mt-2">
            <a href="https://wa.me/6283142436491" target="_blank" class="add-cart-btn inline-flex items-center text-green-600">
  <i class="fab fa-whatsapp mr-1"></i>Order via WhatsApp
</a>

          </div>
        </div>
        <div class="product-desc mt-2">
          <div class="product-name font-semibold text-lg">
            <a href="shop-details.html">${name}</a>
          </div>
          <div class="text-sm text-gray-500 mb-1">${category}</div>
          <div class="product-price text-indigo-700 font-bold">${price}</div>
        </div>
      </div>`;
    });
}

async function loadMenuCategories() {
    const { data: categories, error } = await supabase.from('categories').select('*').eq('status', 'active');
    if (error) {
        console.error('Error loading categories:', error);
        return;
    }

    const menuList = document.getElementById('menu-list');
    const contactItem = menuList.querySelector('li:last-child');

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="product.html?category=${encodeURIComponent(cat.name)}">${cat.name}</a>`;
        menuList.insertBefore(li, contactItem);
    });
}

loadMenuCategories();
loadShopProducts();
