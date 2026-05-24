let selectedImageFile = null;
let compressedImageBlob = null;
let bulkProducts = [];

// Compress image before upload
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function(e) {
    const img = new Image();
    img.src = URL.createObjectURL(new Blob([e.target.result], { type: file.type }));
    img.onload = function() {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      // Resize if image is too large
      const maxSize = 1200;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression (70% quality)
      canvas.toBlob(callback, "image/jpeg", 0.7);
      URL.revokeObjectURL(img.src);
    };
  };
}

// Switch between tabs
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tab + '-tab').classList.add('active');
  event.target.classList.add('active');
}

// Preview image when file is selected
document.addEventListener("DOMContentLoaded", function() {
  const fileInput = document.getElementById("adminImage");
  
  fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    
    if (file) {
      selectedImageFile = file;
      
      // Compress immediately and store
      compressImage(file, function(compressedBlob) {
        compressedImageBlob = compressedBlob;
        
        // Show preview from compressed blob
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewDiv = document.getElementById("imagePreview");
          previewDiv.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <p>✓ Image compressed and ready</p>
          `;
        };
        reader.readAsDataURL(compressedBlob);
      });
    }
  });

  // Bulk upload drag and drop
  const uploadArea = document.getElementById("uploadArea");
  const csvFile = document.getElementById("csvFile");

  uploadArea.addEventListener('click', () => csvFile.click());
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#f0f0f0';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = 'transparent';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files[0]) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  });

  csvFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      handleCSVFile(e.target.files[0]);
    }
  });
  
  renderAdminProducts();
});

function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csv = e.target.result;
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    bulkProducts = [];
    const tbody = document.getElementById('previewBody');
    tbody.innerHTML = '';

    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      
      // Parse based on headers
      const nameIdx = headers.indexOf('name') >= 0 ? headers.indexOf('name') : 0;
      const priceIdx = headers.indexOf('price') >= 0 ? headers.indexOf('price') : 1;
      const stockIdx = headers.indexOf('stock') >= 0 ? headers.indexOf('stock') : 2;
      const imageIdx = headers.indexOf('imageurl') >= 0 ? headers.indexOf('imageurl') : 3;

      const product = {
        name: values[nameIdx]?.trim(),
        price: Number(values[priceIdx]),
        stock: Number(values[stockIdx]),
        image: values[imageIdx]?.trim() || ''
      };

      if (product.name && product.price && product.stock) {
        bulkProducts.push(product);
        tbody.innerHTML += `
          <tr>
            <td>${product.name}</td>
            <td>₦${product.price.toLocaleString()}</td>
            <td>${product.stock}</td>
            <td>${product.image ? '✓ URL provided' : '⚠ No URL'}</td>
            <td style="color: green;">Ready</td>
          </tr>
        `;
      }
    }

    const totalLines = lines.length - 1; // Exclude header
    document.getElementById('preview-container').style.display = 'block';
    document.getElementById('uploadBtn').textContent = `Upload ${bulkProducts.length} of ${totalLines} Products`;
  };
  reader.readAsText(file);
}

function addProduct() {
  const name = document.getElementById("adminName").value;
  const price = Number(document.getElementById("adminPrice").value);
  const stock = Number(document.getElementById("adminStock").value);

  if (!name || !price || !compressedImageBlob || !stock) {
    alert("Please fill all fields including selecting an image");
    return;
  }

  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "Uploading... 0%";
  button.disabled = true;

  // Use pre-compressed blob - skip recompression
  const fileName = Date.now() + "_compressed.jpg";
  const storageRef = storage.ref("products/" + fileName);

  // Upload with progress tracking
  const uploadTask = storageRef.put(compressedImageBlob);

  uploadTask.on(
    "state_changed",
    function(snapshot) {
      // Progress tracking
      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      button.textContent = "Uploading... " + progress + "%";
    },
    function(error) {
      alert("Error uploading: " + error.message);
      button.textContent = originalText;
      button.disabled = false;
    },
    function() {
      // Upload complete
      uploadTask.snapshot.ref.getDownloadURL().then(function(imageUrl) {
        return db.collection("products").add({
          name: name,
          price: price,
          image: imageUrl,
          stock: stock,
          createdAt: new Date()
        });
      })
      .then(function() {
        alert("Product added successfully!");
        
        // Clear form
        document.getElementById("adminName").value = "";
        document.getElementById("adminPrice").value = "";
        document.getElementById("adminStock").value = "";
        document.getElementById("adminImage").value = "";
        document.getElementById("imagePreview").innerHTML = "";
        selectedImageFile = null;
        compressedImageBlob = null;
        
        // Refresh product list
        renderAdminProducts();
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
      })
      .catch(function(error) {
        alert("Error saving product: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
    }
  );
}

function uploadBulkProducts() {
  if (bulkProducts.length === 0) {
    alert("No products to upload");
    return;
  }

  const button = document.getElementById("uploadBtn");
  const originalText = button.textContent;
  button.textContent = "Processing...";
  button.disabled = true;

  // Upload all products quickly
  const batch = db.batch();
  let uploadedCount = 0;

  bulkProducts.forEach((product) => {
    const docRef = db.collection("products").doc();
    batch.set(docRef, {
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.image,
      createdAt: new Date()
    });
  });

  // Commit batch in one operation
  batch.commit()
    .then(function() {
      alert(`✓ Successfully uploaded ${bulkProducts.length} products!`);
      
      // Clear
      bulkProducts = [];
      document.getElementById("csvFile").value = "";
      document.getElementById('preview-container').style.display = 'none';
      button.textContent = originalText;
      button.disabled = false;
      
      // Refresh product list
      renderAdminProducts();
    })
    .catch(function(error) {
      alert("Error uploading products: " + error.message);
      button.textContent = originalText;
      button.disabled = false;
    });
}

function renderAdminProducts() {
  const box = document.getElementById("adminProducts");
  
  db.collection("products")
    .orderBy("createdAt", "desc")
    .get()
    .then(function(snapshot) {
      let html = "";
      
      if (snapshot.empty) {
        html = '<div class="loading">No products yet. Add your first product above!</div>';
      } else {
        html = '<div class="products-grid">';
        snapshot.forEach(function(doc) {
          const p = doc.data();
          
          html += `
            <div class="admin-product">
              <img
                src="${p.image}"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'"
                alt="${p.name}"
              >
              <div class="admin-product-info">
                <h3>${p.name}</h3>
                <p class="price">₦${p.price.toLocaleString()}</p>
                <p class="stock-info">Stock: ${p.stock} units</p>
                <button onclick="deleteProduct('${doc.id}')" class="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          `;
        });
        html += '</div>';
      }
      
      box.innerHTML = html;
    })
    .catch(function(error) {
      console.error("Error fetching products:", error);
      box.innerHTML = '<div class="loading">Error loading products</div>';
    });
}

function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  
  if (confirmDelete) {
    // First get the image URL to delete it from storage
    db.collection("products")
      .doc(id)
      .get()
      .then(function(doc) {
        if (doc.exists) {
          const imageUrl = doc.data().image;
          
          // Delete from Firestore
          db.collection("products").doc(id).delete();
          
          // Try to delete image from Storage (if it's from our storage)
          if (imageUrl && imageUrl.includes("firebasestorage")) {
            const imageRef = storage.refFromURL(imageUrl);
            imageRef
              .delete()
              .then(function() {
                console.log("Image deleted from storage");
                renderAdminProducts();
              })
              .catch(function(error) {
                console.log("Could not delete image:", error);
                renderAdminProducts();
              });
          } else {
            renderAdminProducts();
          }
        }
      })
      .catch(function(error) {
        alert("Error deleting product: " + error.message);
      });
  }
}
