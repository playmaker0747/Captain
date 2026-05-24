// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTQ7huAouwc5-rSaHh8wjSv-R36RlSKLw",
  authDomain: "textiles-shop-bb09a.firebaseapp.com",
  databaseURL: "https://textiles-shop-bb09a-default-rtdb.firebaseio.com",
  projectId: "textiles-shop-bb09a",
  storageBucket: "textiles-shop-bb09a.firebasestorage.app",
  messagingSenderId: "339276479471",
  appId: "1:339276479471:web:7832082783e5dcd5e2941a",
  measurementId: "G-K4TLHHRH0L"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();