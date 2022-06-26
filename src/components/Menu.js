import { useState } from "react";
import {
  Image,
  Card,
  Form,
  Button,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import Cards from "./Cards/Cards.jsx";
import Cart from "./Cart/Cart.jsx";
import app from "../firebase.js";
import { useAuth } from "../contexts/AuthContext.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion
} from "firebase/firestore";

export default function Menu() {
  const [cartItems, setCartItems] = useState([]);
  const [foods, setFoods] = useState([]);
  const [user, setUser] = useState("");
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState(0.0);
  const [OTP, setOTP] = useState("");
  const [menuIsShown, setMenuIsShown] = useState(false);
  const { currentUser, logout } = useAuth();

  const db = getFirestore(app);

  setUser(getDoc(doc(db, "user email", currentUser.email)).data().handle);

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
    if (foodName === "") {
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
        cart: arrayUnion({ title: foodName, price: foodPrice }),
      });
      console.log(foods);
    }
  };

  //initiates listener (unsubscribe() doesnt work in onCheckout if unsubscribe is simply set to null)
  var unsubscribe = onSnapshot(doc(db, "tokens", "1"));
  unsubscribe();

  const onClick = async (event) => {
    event.preventDefault();
    const orderRef = doc(db, "tokens", OTP);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      //listener populates food array
      unsubscribe = onSnapshot(orderRef, (doc) => {
        console.log("Full data:", doc.data());
        setFoods(doc.data().cart);
      });
      setMenuIsShown(true);
    } else {

    }
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
      setDoc(userRef, { cart: cartItems });
      setOTP("");
      unsubscribe();
      setCartItems([]);
      setFoods([]);
    }
    setMenuIsShown(false);
  };

  return (
    <>
      <p>
        <Image
          src="/logo.png"
          alt=""
          width="150"
          className="rounded mx-auto d-block"
        />
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
        <Button
          variant="outline-secondary"
          id="button-addon2"
          type="submit"
          onClick={onClick}
        >
          Join
        </Button>
      </InputGroup>

      {menuIsShown && (
        <Card className="text-center" bg="light">
          <Card.Header as="h5">PayLeh! Order</Card.Header>
          <h8>
            You have joined: <strong>{OTP}</strong>
          </h8>
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
                min="0.01"
                step="0.01"
                value={foodPrice}
                onChange={(e) => setFoodPrice(e.target.value)}
              />
            </Form.Label>
            <div>
              <Button type="submit" size="sm" className="mt-2 mb-2">
                {" "}
                Select
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </>
  );
}
