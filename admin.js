let selectedImageFile = null;

// Preview image when file is selected
document.addEventListener("DOMContentLoaded", function() {
  const fileInput = document.getElementById("adminImage");
  
  fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    
    if (file) {
      selectedImageFile = file;
      
      // Show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        const previewDiv = document.getElementById("imagePreview");
        previewDiv.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <p>Image ready to upload</p>
        `;
      };
      reader.readAsDataURL(file);
    }
  });
  
  renderAdminProducts();
});

function addProduct() {
  const name = document.getElementById("adminName").value;
  const price = Number(document.getElementById("adminPrice").value);
  const stock = Number(document.getElementById("adminStock").value);

  if (!name || !price || !selectedImageFile || !stock) {
    alert("Please fill all fields including selecting an image");
    return;
  }

  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "Uploading...";
  button.disabled = true;

  // Upload image to Firebase Storage
  const fileName = Date.now() + "_" + selectedImageFile.name;
  const storageRef = storage.ref("products/" + fileName);

  storageRef
    .put(selectedImageFile)
    .then(function(snapshot) {
      return snapshot.ref.getDownloadURL();
    })
    .then(function(imageUrl) {
      // Add product to Firestore with image URL
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
      
      // Refresh product list
      renderAdminProducts();
      
      // Reset button
      button.textContent = originalText;
      button.disabled = false;
    })
    .catch(function(error) {
      alert("Error uploading product: " + error.message);
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
        snapshot.forEach(function(doc) {
          const p = doc.data();
          
          html += `
            <div class="admin-product">
              <img
                src="${p.image}"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-family=%22system-ui%22%3ENo Image%3C/text%3E%3C/svg%3E'"
              >
              <div class="admin-product-info">
                <h3>${p.name}</h3>
                <p class="price">₦${p.price.toLocaleString()}</p>
                <p class="stock-info">Stock: ${p.stock} units</p>
                <button onclick="deleteProduct('${doc.id}')">
                  Delete Product
                </button>
              </div>
            </div>
          `;
        });
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