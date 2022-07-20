import React from 'react';
import { useState, useEffect } from "react";
import { Card, Button, Table, ListGroup } from 'react-bootstrap';
import { useAuth } from "../contexts/AuthContext.js";
import { getDocs, getFirestore, doc, collection } from 'firebase/firestore';
import app from "../firebase.js";
import { useNavigate } from 'react-router-dom';
import { DotLoader } from 'react-spinners';

export default function History() {
  const db = getFirestore(app);
  const navigate = useNavigate();
  const {currentUser} = useAuth();
  const [orderOwner, setOrderOwner] = useState("");
  const [timeArray, setTimeArray] = useState([]);
  const [cartArray, setCartArray] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    const list = [];
    const data = await getDocs(collection(db, "user email", currentUser.email, "history"));
    data.forEach(item => {
       list.push({key: item.id, cart:item.data().cart, owner:item.data().owner});
    })
    setTimeArray(list.reverse());
    setLoading(false);
    console.log(timeArray);
  }

  useEffect(() => {
    fetchHistory();
  }, [])

  const onClick = (event) => {
    const id = event.target.id;
    const order = timeArray.find(item => item.key === id);
    setCartArray(order.cart)
    setOrderOwner(order.owner)
    console.log(order);
    console.log(orderOwner);
    setShowAllHistory(false);
    setShowTable(true);
  }

  const backToHistory = () => {
    setShowAllHistory(true);
    setShowTable(false);
  }

  const totalPrice = cartArray.reduce((sum,item)=>sum + item.price * item.quantity,0);

  return (
    <div>
      {loading ? <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}><DotLoader/> </div>: 

      <div className='text-center'>
        <Card>
          <Card.Header as ="h1">History</Card.Header>
          {timeArray.length === 0 ? <h3 className='text-muted mt-4' style={{fontFamily:"Trebuchet MS"}}>No History Found</h3> : <h1></h1>} 

          {showAllHistory && (
            <ListGroup as="ol" numbered className='mb-4 mt-4'>
              {timeArray.map(item => {
                return(
                  
                    <ListGroup.Item as="li" key={item.key} id={item.key} action onClick={onClick}>{item.key}</ListGroup.Item>
                  
                )
              })}
            </ListGroup>
          )}
          
          {showTable && (
            <div>
              <h4 className='text-muted mt-2' style={{fontFamily:"Trebuchet MS"}}>Order Creator: {orderOwner}</h4>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cartArray.map( (item,index) =>
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
              <Button onClick={backToHistory} className="mb-2">Back</Button>
            </div>
          )}
        </Card>
        <div className="w-100 text-center mt-2">
                  <Button variant="secondary" onClick={(e) => navigate("/")}>
                      Home
                  </Button>
        </div>
      </div>
    }
    </div>
  )
}