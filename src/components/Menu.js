import { useState } from "react";
import Cards from "./Cards/Cards.jsx";
import Cart from "./Cart/Cart.jsx";
import app from "../firebase.js";
import {getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion} from "firebase/firestore";

export default function Menu() {
  const [cartItems, setCartItems] = useState([]);
  const [foods, setFoods] = useState([]);
  const [user, setUser] = useState("");
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState(0.0);
  const [OTP, setOTP] = useState("");

  const db = getFirestore(app);

  //adds food to personal cart, does not read to firestore yet
  const onAdd = (food) => {
    const exist = cartItems.find((x) => x.title === food.title);
    if (exist) {
      setCartItems(
        cartItems.map((x) =>
          x.title === food.title
            ? { ...exist, quantity: exist.quantity + 1 }
            : x
        )
      );
    } else {
      setCartItems([...cartItems, { ...food, quantity: 1 }]);
    }
  };

  //removes food from personal cart, does not read to firestore yet
  const onRemove = (food) => {
    const exist = cartItems.find((x) => x.title === food.title);
    if (exist.quantity === 1) {
      setCartItems(cartItems.filter((x) => x.title !== food.title));
    } else {
      setCartItems(
        cartItems.map((x) =>
          x.title === food.title
            ? { ...exist, quantity: exist.quantity - 1 }
            : x
        )
      );
    }
  };

  //method to add food into shared menu(saved on firestore)
  const AddtoMenu = async (event) => {
    if (foodName === "" || foodPrice) {
      return;
    }
    event.preventDefault();
    const orderRef = doc(db, "tokens", OTP);
    const orderSnap = await getDoc(orderRef);
    const exist = foods.find((x) => x.title === foodName);
    //order has not been created or is closed or food is already in menu
    if (!orderSnap.exists() || exist || orderSnap.data().status === "closed") {
      return;
    } else {
      await updateDoc(orderRef, {
        cart: arrayUnion({title:foodName,price:foodPrice})
      });
      console.log(foods);
    }
  };

  //initiates listener (unsubscribe() doesnt work in onCheckout if unsubscribe is simply set to null)
  var unsubscribe = onSnapshot(doc(db,"tokens","1"));
  unsubscribe(); 

  const onClick = (event) => {
    event.preventDefault();
    //listener populates food array
    unsubscribe = onSnapshot(doc(db,"tokens",OTP), (doc) => {
      console.log("Full data:", doc.data());
      setFoods(doc.data().cart);
    });
    console.log({ OTP });
  };

  //finalizes the order, writing to firestore
  //if previous order exists, will overwrite that order
  //unsubscribes listener
  const onCheckout = async () => {
    const orderRef = doc(db, "tokens", OTP);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.data().status === "closed") {
      return;
    } else {
      const userRef = doc(db, "tokens", OTP, "users", user);
      setDoc(userRef, {cart:cartItems});
      setOTP("");
      unsubscribe();
    }
  };

  return (
    <>
      <label>
        Token:
        <input
          type="text"
          name="otp"
          value={OTP}
          onChange={(e) => setOTP(e.target.value)}
          placeholder="Input Token"
        />
        <h1>{OTP}</h1>
        <button onClick={onClick}>Click</button>
      </label>
      <h1 className="heading">PayLeh! order</h1>
      <Cart cartItems={cartItems} onCheckout={onCheckout} />
      <div className="cards__container">
        {foods.map((food) => {
          return (
            <Cards
              food={food}
              key={food.title}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          );
        })}
      </div>

      <form onSubmit={AddtoMenu}>
        <label>
          Telegram handle:
          <input
            type="text"
            name="title"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </label>
        <label>
          Name of food:
          <input
            type="text"
            name="title"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
        </label>
        <label>
          Price:
          <input
            type="number"
            name="price"
            min="0.01"
            step="0.01"
            value={foodPrice}
            onChange={(e) => setFoodPrice(e.target.value)}
          />
        </label>
        <input type="submit" />
      </form>
    </>
  );
}
