import React from 'react'
import Button from '../Button/Button';
require('./Cart.css')

function Cart({cartItems, onCheckout}) {
    const totalPrice = cartItems.reduce((sum,item)=>sum + item.price * item.quantity,0);
  return (
  <div className="cart__container">
      {cartItems.length === 0 ? "No items ordered " : ""} {"   "}
      <br/> <span className="">Total Price: ${totalPrice.toFixed(2)}</span>
      <Button
        title={`${cartItems.length === 0 ? "Order" : "Confirm order"} `}
        type={"checkout"}
        disable={cartItems.length === 0 ? true : false}
        onClick={onCheckout}
      />
    </div>
  );
}


export default Cart