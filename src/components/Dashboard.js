import React, { useState } from "react"
import { Card, Button, Alert, Container} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext.js"
import { useNavigate } from "react-router-dom"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import app from "../firebase.js"
import classes from './Dashboard.module.css'
import bg from './Image/bg-pattern-card.jpg'

export default function Dashboard() {
  const [error, setError] = useState("")
  const [user, setUser] = useState("")
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const db = getFirestore(app);

  async function handleLogout() {
    setError("")

    try {
      await logout()
      navigate("/login")
    } catch {
      setError("Failed to log out")
    }
  }

  const teleHandle = async () => {
    const userRef = doc(db, "user email", currentUser.email);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUser(userSnap.data().handle);
    }
  }

  teleHandle();
  


  return (
    <div>
      <Container className="py-4" >
          <Card className={classes.ProfileCard + " mx-auto"} >
              {error && <Alert variant="danger">{error}</Alert>}
              <Card.Img className={classes.ProfileCardBackgroundImage} alt="Background Image" variant="top" src={bg} />
              <Card.Img className={classes.ProfileCardImage} alt="User Image" src="/logo.png"/>
              <Card.Body className={"text-center " + classes.ProfileCardBody}>
                  <Card.Text className={classes.TextBold + " mb-0"}>
                      @{user}
                  </Card.Text>
                  <Card.Text className={classes.TextMuted}>
                      {currentUser.email} 
                  </Card.Text>
              </Card.Body>
              <Card.Footer className={classes.CardFooter}>
                <div className="text-center">
                  <Button variant="outline-dark" onClick={(e) => navigate("/menu")} style={{width: 280, fontFamily:"Trebuchet MS"}}>Join Group Order</Button>
                </div>
                <div className="text-center mt-2">
                  <Button variant="outline-dark" onClick={(e) => navigate("/split")} style={{width: 280, fontFamily:"Trebuchet MS"}}>Split The Bill</Button>
                </div>
              </Card.Footer>
          </Card>
      </Container>

      <div className="w-100 text-center">
        <Button variant="dark" onClick={(e) => navigate("/history")}>
          History
        </Button>
        <Button variant="light" onClick={handleLogout}>
          Log Out
        </Button>
        
      </div>
    </div>
  )
}