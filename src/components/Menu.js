import { useState, useRef } from "react";
import {
  Image,
  Card,
  Form,
  Button,
  InputGroup,
  FormControl,
  Alert,
  Table,
  Toast,
  ToastContainer,
  Modal,
  Overlay,
  Tooltip
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom"
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
  const [originalUser, setOriginalUser] = useState("");
  const [user, setUser] = useState("");
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState(0.0);
  const [OTP, setOTP] = useState("");
  const [currentOTP, setCurrentOTP] = useState("");
  const [menuIsShown, setMenuIsShown] = useState(false);
  const { currentUser} = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showToken, setShowToken] = useState(true);
  const [orderStatus, setOrderStatus] = useState("open");
  const [showToast, setShowToast] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showHandleError, setShowHandleError] = useState(false);

  const navigate = useNavigate();
  const target = useRef(null);

  const totalPrice = cartItems.reduce((sum,item)=>sum + item.price * item.quantity,0);

  const db = getFirestore(app);
  
  const userRef = doc(db, "user email", currentUser.email);
  const userSnap = getDoc(userRef).then(snap => {
    setOriginalUser(snap.data().handle);
  });

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
    const orderRef = doc(db, "tokens", currentOTP);
    const orderSnap = await getDoc(orderRef);
    const exist = foods.find((x) => x.title === foodName);
    //order has not been created or is closed or food is already in menu
    if (!orderSnap.exists() || exist || orderSnap.data().status === "closed") {
      return;
    } else {
      const food = {title:foodName, price:foodPrice}
      await updateDoc(orderRef, {
        cart: arrayUnion(food),
      });
      console.log(food);
    }
  };

  //initiates listener (unsubscribe() doesnt work in onCheckout if unsubscribe is simply set to null)
  var unsubscribe = onSnapshot(doc(db, "tokens", "1"));
  unsubscribe();

  const onClick = async (event) => {
    event.preventDefault();
    unsubscribe();
    setCartItems([]);
    const orderRef = doc(db, "tokens", OTP);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      setCurrentOTP(OTP);
      //listener populates food array
      unsubscribe = onSnapshot(orderRef, (doc) => {
        console.log("Full data:", doc.data());
        setFoods(doc.data().cart);
        setOrderStatus(doc.data().status);
        
        if (doc.data().status === "closed") {
          setShowToast(true);
          console.log("toast is" + showToast)
        }
      });
      
      console.log(orderStatus);
      setUser(originalUser);
      setMenuIsShown(true);
      setShowAlert(false);
      setShowToken(false);
    } else {
      setShowAlert(true);
      unsubscribe();
    }
    console.log({ OTP });
  };

  //finalizes the order, writing to firestore
  //if previous order exists, will overwrite that order
  //unsubscribes listener
  const onCheckout = async () => {
    const orderRef = doc(db, "tokens", currentOTP);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.data().status === "closed") {
      return;
    } else {
      const userRef = doc(db, "tokens", currentOTP, "users", user);
      const isOriginalUser = (user === originalUser);
      console.log(isOriginalUser);
      setDoc(userRef, { save: isOriginalUser, email: currentUser.email, cart: cartItems });
      setOTP("");
      unsubscribe();
      console.log(cartItems);
      setFoods([]);
    }
    setMenuIsShown(false);
    setShowSummary(true);
    setShowToken(false);
    setShowPopup(false);
  };

  const handleCloseSummary = () => {
    setShowToken(true);
    setShowSummary(false);
  }

  const handleClose = () => setShowPopup(false);
  const handleShow = () => {
    if (user === "") {
      setShowHandleError(true);
    } else {
      setShowHandleError(false);
      setShowPopup(true);
    }
    
  }
    
  

  return (
    <>
      {/*message shown when order has been closed*/}
      <ToastContainer position="top-end" style={{zIndex:'1'}}>
        <Toast bg="danger" onClose={() => setShowToast(false)} show={showToast} delay={5000}  autohide>
          <Toast.Header>
            <strong className="me-auto">PayLeh!</strong>
          </Toast.Header>
          <Toast.Body className='text-white'>Order has been closed!</Toast.Body>
        </Toast>
      </ToastContainer> 

      {/*error message tooltip shown when order confirmed without a telegram handle*/}
      <Overlay target={target.current} show={showHandleError} placement="bottom">
        {(props) => (
          <Tooltip id="overlay-example" {...props}>
            *Telegram Handle is required
          </Tooltip>
        )}
      </Overlay>

      <p>
        <Link to="/">
          <Image
            src="/logo.png"
            alt=""
            width="150"
            className="rounded mx-auto d-block"
          />
        </Link>
      </p>
      {showToken && (
        <div>
          
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
              variant="outline-dark"
              id="button-addon2"
              type="submit"
              onClick={onClick}
            >
              Join
            </Button>
          </InputGroup>
        </div>
      )}
      

      {menuIsShown && (
        <Card className="text-center" bg="light">
          <Card.Header as="h5">PayLeh! Order</Card.Header>
          <p>
            You have joined: <strong>{currentOTP}</strong>
          </p>
          
          <p>
            Order status: <strong>{orderStatus === "open" ? <h4 style={{color:"green"}}>Open</h4>: <h4 style={{color:"red"}}>Closed</h4>}</strong>
          </p>
          <Cart cartItems={cartItems} onCheckout={handleShow}/>
          <div className="cart__container">
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
                  ref ={target}
                />
              </InputGroup>
            </Form.Label>
            <Form.Label>
              Name of item:
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
              <Button type="submit" size="sm" className="mt-2 mb-3" style={{width:130}}>
                {" "}
                Add to Menu
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {showAlert && (
        <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
          <Alert.Heading>Oh snap! Wrong token!</Alert.Heading>
          <p>
            Ensure that you have keyed in the right token!
          </p>
        </Alert>
      )}
      
      {showSummary && (
        <Card className="text-center" bg="light">
          <Card.Header as="h5">Order Summary</Card.Header>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map( (item,index) =>
                (
                  <tr key={index}>
                    <td>{item.title}</td>
                    <td>x{item.quantity}</td>
                    <td>${parseFloat(item.price).toFixed(2)}</td>
                  </tr>
                )
                )}
              </tbody>
            </Table>
            
            Total Price: <h3><strong>${totalPrice.toFixed(2)}</strong></h3>
            <div>
              <Button onClick={handleCloseSummary} className="mb-2 mt-2">Back</Button>
            </div>
        </Card>
      )}
      <div className="text-center">
        <Button variant="secondary" onClick={() => navigate("/")} className="mb-2 mt-2">Home</Button>
      </div>


      <Modal show={showPopup} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>You will not be able to change your order after confirming. Click Proceed to confirm. </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="success" onClick={onCheckout}>
            Proceed
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
