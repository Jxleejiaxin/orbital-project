import { useState, useEffect } from "react";
import Cards from "./Cards/Cards";
import Cart from "./Cart/Cart";

require("./MenuStyle.css");


export default function Menu() {
  const [cartItems, setCartItems] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState(0.00);

  const tele = window.Telegram.WebApp;

  useEffect(() => {
    tele.ready();
  });

  const onAdd = (food) => {
    const exist = cartItems.find((x) => x.id === food.id);
    if (exist) {
      setCartItems(
        cartItems.map((x) =>
          x.id === food.id ? { ...exist, quantity: exist.quantity + 1 } : x
        )
      );
    } else {
      setCartItems([...cartItems, { ...food, quantity: 1 }]);
    }
  };

  const onRemove = (food) => {
    const exist = cartItems.find((x) => x.id === food.id);
    if (exist.quantity === 1) {
      setCartItems(cartItems.filter((x) => x.id !== food.id));
    } else {
      setCartItems(
        cartItems.map((x) =>
          x.id === food.id ? { ...exist, quantity: exist.quantity - 1 } : x
        )
      );
    }
  };

  const onCheckout = () => {
    tele.MainButton.text = "Confirm Order";
    tele.MainButton.show();
  };

  const AddtoMenu = (event) => {
    event.preventDefault();
    setFoods([...foods,{title:foodName,price:foodPrice}]);
    console.log(foods);
  }

  return (
    <>
      <h1 className="heading">PayLeh! order</h1>
      <Cart cartItems={cartItems} onCheckout={onCheckout} />
      <div className="cards__container">
        {foods.map((food) => {
          return (
            <Cards food={food} key={food.id} onAdd={onAdd} onRemove={onRemove} />
          );
        })}
      </div>

      <form onSubmit={AddtoMenu}>
        <label>Name of food:
          <input
          type="text"
          name="title"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          />
        </label>
        <label>Price:
          <input
          type="number"
          name="price"
          value={foodPrice}
          onChange={(e) => setFoodPrice(e.target.value)}
          />
        </label>
        <input type="submit" />
      </form>
    </>
  );
}


