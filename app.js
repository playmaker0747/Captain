function sendOrder() {

  if (cart.length === 0) {

    alert("Cart is empty");

    return;

  }


  const customerName =
    document.getElementById("customerName").value;

  const customerPhone =
    document.getElementById("customerPhone").value;

  const customerAddress =
    document.getElementById("customerAddress").value;


  const numbers = [

    "2348039220370",
    "2348147453845",
    "2347066465357",
    "2348149941988"

  ];


  const selected =
    document.getElementById("whatsappChoice").value;


  let number;


  if (selected) {

    number = selected;

  }

  else {

    const r =
      Math.floor(Math.random() * numbers.length);

    number = numbers[r];

  }


  let msg =
    "SUA TEXTILES ORDER\n\n";


  msg +=
    "Customer: " +
    customerName +
    "\n";


  msg +=
    "Phone: " +
    customerPhone +
    "\n";


  msg +=
    "Address: " +
    customerAddress +
    "\n\n";


  let total = 0;


  for (let i = 0; i < cart.length; i++) {

    const item = cart[i];


    msg +=
      item.name +
      " x" +
      item.qty +
      "\n";


    total +=
      item.price * item.qty;


    db.collection("sales")
      .add({

        name: item.name,
        qty: item.qty,
        price: item.price,
        date: new Date()

      });


    db.collection("products")
      .doc(item.id)
      .update({

        stock:
          item.stock - item.qty

      });

  }


  msg +=
    "\nTotal: ₦" + total;


  window.open(

    "https://wa.me/" +
    number +
    "?text=" +
    encodeURIComponent(msg)

  );


  cart = [];

  renderCart();

  renderProducts();

}


document.addEventListener(

  "DOMContentLoaded",

  function() {

    renderProducts();

    renderCart();

  }

);