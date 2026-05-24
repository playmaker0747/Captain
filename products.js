function renderProducts() {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const productGrid = document.getElementById("productGrid");
  
  productGrid.innerHTML = "";
  
  db.collection("products").get().then(function(snapshot) {
    snapshot.forEach(function(doc) {
      const p = doc.data();
      
      // Filter based on search input
      if (p.name.toLowerCase().includes(searchInput)) {
        productGrid.innerHTML += `
          <div class="product-card">
            <img 
              src="${p.image}" 
              onerror="this.src='images/default.jpg'"
              alt="${p.name}"
            >
            <h3>${p.name}</h3>
            <p class="price">₦${p.price}</p>
            <p class="stock">Stock: ${p.stock}</p>
            <div class="product-actions">
              <input 
                type="number" 
                id="q${doc.id}" 
                min="1" 
                max="${p.stock}" 
                value="1"
                class="qty-input"
              >
              <button 
                onclick="addToCart('${doc.id}', ${p.stock})"
                class="add-btn"
              >
                Add to Cart
              </button>
            </div>
          </div>
        `;
      }
    });
  });
}
