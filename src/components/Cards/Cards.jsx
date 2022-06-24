import React, { useState } from "react";
import Button from "../Button/Button";
import './CardStyle.css'

function Cards({food,onAdd,onRemove}) {
  const [count, setCount] = useState(0);
  const {title,price} = food;
  
  const handleIncrement = ()=>{
      setCount(count + 1)
      onAdd(food);
  }
  const handleDecrement = ()=>{
      setCount(count - 1);
      onRemove(food);
  }

  return (
    <div className="cardd">
      <span
        className={`${count !== 0 ? "card__badge" : "card__badge--hidden"}`}
      >{count}
      </span>
      <h4 className="card__title">
          {title} -> <span className="card__price">${price}</span>
      </h4>

      <div className="btn_container">
          <Button title={'+'} type={'add'} onClick={handleIncrement}/>
          {count!==0 ? (
              <Button title={'-'} type={'remove'} onClick={handleDecrement}/>
          ) : (
              ""
          )}
      </div>
    </div>
  );
}

export default Cards;
