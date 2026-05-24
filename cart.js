var cart = [];


function addToCart(id, stock) {

  const qty =
    Number(
      document.getElementById("q" + id).value
    );


  if (qty > stock) {

    alert("Stock too low");

    return;

  }


  db.collection("products")
    .doc(id)
    .get()

    .then(function(doc) {

      const p = doc.data();


      cart.push({

        id: id,
        name: p.name,
        price: p.price,
        qty: qty,
        stock: p.stock

      });


      renderCart();

    });

}


function renderCart() {

  let total = 0;

  const cartItems =
    document.getElementById("cartItems");


  cartItems.innerHTML = "";


  for (let i = 0; i < cart.length; i++) {

    const item = cart[i];

    const sub =
      item.price * item.qty;

    total += sub;


    cartItems.innerHTML += `

      <div class="cart-item">

        ${item.name}
        x${item.qty}
        =
        ₦${sub}

        <button
          onclick="removeCart(${i})"
        >
          X
        </button>

      </div>

    `;
  }


  document.getElementById("cartTotal")
    .innerHTML = "₦" + total;

}


function removeCart(i) {

  cart.splice(i, 1);

  renderCart();

}