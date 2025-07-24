import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://kpspglomfamxnhhopecp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc3BnbG9tZmFteG5oaG9wZWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjgyMDgsImV4cCI6MjA2ODk0NDIwOH0.3gwysVcLzH8iV1i_IY6PhbkDHU5Mf_Tp-T-Dq26ZHAE';  // truncated for brevity
const supabase = createClient(supabaseUrl, supabaseKey);

// UI Navigation
const pageTitle = document.getElementById('page-title');
document.getElementById('show-dashboard').onclick = () => showSection('dashboard');
document.getElementById('show-categories').onclick = () => showSection('categories');
document.getElementById('show-products').onclick = () => showSection('products');

function showSection(section) {
    pageTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
    ['dashboard', 'categories', 'products'].forEach(id =>
        document.getElementById(`${id}-section`).classList.toggle('hidden', id !== section)
    );
}

// Category CRUD
document.getElementById('add-category').onclick = () => toggleModal('category', true);
document.getElementById('cancel-category').onclick = () => toggleModal('category', false);
document.getElementById('category-form').onsubmit = saveCategory;

async function loadCategories() {
    const { data } = await supabase.from('categories').select('*');
    const table = document.getElementById('categories-table');
    table.innerHTML = '';
    data.forEach(c => {
        table.innerHTML += `<tr>
      <td>${c.name}</td><td>${c.status}</td>
      <td><button onclick="editCategory(${c.id})" class="text-blue-600">Edit</button>
      <button onclick="deleteCategory(${c.id})" class="text-red-600 ml-2">Delete</button></td></tr>`;
    });
}
window.editCategory = async (id) => {
    const { data } = await supabase.from('categories').select('*').eq('id', id).single();
    document.getElementById('category-id').value = data.id;
    document.getElementById('category-name').value = data.name;
    document.getElementById('category-status').value = data.status;
    toggleModal('category', true);
};
window.deleteCategory = async (id) => {
    if (confirm('Delete category?')) {
        await supabase.from('categories').delete().eq('id', id);
        loadCategories();
    }
};
async function saveCategory(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-category-btn');
    const spinner = document.getElementById('category-spinner');

    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    const status = document.getElementById('category-status').value;

    try {
        if (id) {
            await supabase.from('categories').update({ name, status }).eq('id', id);
        } else {
            await supabase.from('categories').insert([{ name, status }]);
        }

        toggleModal('category', false);
        loadCategories();
        loadCategoryOptions();
    } finally {
        saveBtn.disabled = false;
        spinner.classList.add('hidden');
    }
}

// Product CRUD
document.getElementById('add-product').onclick = () => toggleModal('product', true);
document.getElementById('cancel-product').onclick = () => toggleModal('product', false);
document.getElementById('product-form').onsubmit = saveProduct;
async function loadCategoryOptions() {
    const { data } = await supabase.from('categories').select('*');
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Select Category</option>';
    data.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

async function loadProducts() {
    const { data } = await supabase
        .from('products')
        .select('*, categories(name)');  // join category

    const table = document.getElementById('products-table');
    table.innerHTML = '';
    data.forEach(p => {
        const imageUrl = p.image_url;
        const categoryName = p.categories ? p.categories.name : 'Uncategorized';
        table.innerHTML += `<tr>
            <td><img src="${imageUrl}" class="w-16 h-16 mx-auto"/></td>
            <td>${p.name}</td>
            <td>${categoryName}</td>
            <td>$${p.price}</td>
            <td><button onclick="deleteProduct(${p.id})" class="text-red-600">Delete</button></td></tr>`;
    });
}


window.deleteProduct = async (id) => {
    if (confirm('Delete product?')) {
        await supabase.from('products').delete().eq('id', id);
        loadProducts();
    }
};

async function saveProduct(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-product-btn');
    const spinner = document.getElementById('product-spinner');

    saveBtn.disabled = true;
    spinner.classList.remove('hidden');

    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const categoryId = parseInt(document.getElementById('product-category').value);
    const file = document.getElementById('product-image').files[0];

    let imageUrl = '';
    if (file) {
        const filePath = `images/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (!uploadError) {
            const { data: publicData } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
            imageUrl = publicData.publicUrl;
        } else {
            console.error("Upload error:", uploadError.message);
        }
    }

    await supabase.from('products').insert([{
        name, price, image_url: imageUrl, category_id: categoryId
    }]);

    toggleModal('product', false);
    loadProducts();
    loadCategoryOptions();

    saveBtn.disabled = false;
    spinner.classList.add('hidden');
}



// Modal toggle
function toggleModal(id, show) {
    document.getElementById(`${id}-modal`).classList.toggle('hidden', !show);
}

// Init
loadCategories();
loadProducts();
loadCategoryOptions();