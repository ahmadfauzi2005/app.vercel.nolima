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
    loadCategoryOptions();
};
window.deleteCategory = async (id) => {
    if (confirm('Delete category?')) {
        await supabase.from('categories').delete().eq('id', id);
        loadCategories();
        loadCategoryOptions();
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
        const barcodeText = p.barcode || '-';

        const barcodeId = `barcode-${p.id}`;
        const canvasId = `canvas-${p.id}`;

        table.innerHTML += `<tr>
            <td><img src="${imageUrl}" class="w-16 h-16 mx-auto"/></td>
            <td>${p.name}</td>
            <td>${categoryName}</td>
            <td>Rp${p.price.toLocaleString('id-ID')}</td>
            <td>
                ${p.barcode ? `
                    <svg id="${barcodeId}"></svg>
                    <button onclick="downloadBarcode('${barcodeId}', '${p.name}')" class="text-indigo-600 underline text-sm mt-1">Download</button>
                ` : '-'}
            </td>
            <td><button onclick="deleteProduct(${p.id})" class="text-red-600">Delete</button></td>
        </tr>`;

        // Generate barcode image
        if (p.barcode) {
            setTimeout(() => {
                JsBarcode(`#${barcodeId}`, p.barcode, {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: true
                });
            }, 0);
        }
    });
}
function downloadBarcode(svgId, name) {
    const svgElement = document.getElementById(svgId);
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `barcode-${name}.png`;
        downloadLink.click();

        URL.revokeObjectURL(url);
    };
    image.src = url;
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

    // Generate slug for barcode
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const barcode = `/${slug}`;

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
        name,
        price,
        image_url: imageUrl,
        category_id: categoryId,
        barcode // ⬅️ Simpan barcode
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