import { useState, useEffect } from "react";
import { Image, Card, Form, Button, Container, Row, Col, InputGroup, FormControl} from "react-bootstrap";
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
    event.preventDefault();
    const orderRef = doc(db, "tokens", OTP);
    const orderSnap = await getDoc(orderRef);
    const exist = foods.find((x) => x.title === foodName);
    //order has not been created or food is already in menu
    if (OTP.length !== 4 || !orderSnap.exists() || exist) {
      return;
    } else {
      await updateDoc(orderRef, {
        cart: arrayUnion({title:foodName,price:foodPrice})
      });
      console.log(foods);
    }
  };

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
  const onCheckout = () => {
    const userRef = doc(db, "tokens", OTP, "users", user);
    setDoc(userRef, {cart:cartItems});
    setOTP("");
    unsubscribe();
  };

  return (
    <>

      <p>
        <Image src="/logo.png" alt="" width="200" className="rounded mx-auto d-block"/>
      </p>
      
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          className="form-control"
          name="otp"
          value={OTP}
          onChange={(e) => setOTP(e.target.value)}
          placeholder="Input Token"
        />
        <Button variant="outline-secondary" id="button-addon2" type="submit" onClick={onClick}>
          Join 
        </Button>
      </InputGroup>
      
      <Card className="text-center" bg="light">
        <Card.Header as="h5">PayLeh! Order</Card.Header>
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

        <Form onSubmit={AddtoMenu}>
          <Form.Label>
            Telegram handle:
            <InputGroup className="mb-2">
              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
              <FormControl
                size="sm"
                type="text"
                name="title"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </InputGroup>
          </Form.Label>
          <Form.Label>
            Name of food:
            <Form.Control
              type="text"
              name="title"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </Form.Label>
          <Form.Label>
            Price:
            <Form.Control
              type="number"
              name="price"
              min="0"
              step="0.1"
              value={foodPrice}
              onChange={(e) => setFoodPrice(e.target.value)}
            />
          </Form.Label>
          <div className="w-100 text-center mt-2"> 
            <Button type="submit"> Select Food </Button>
          </div>
        </Form>
      </Card>

      
    </>
  );
}
