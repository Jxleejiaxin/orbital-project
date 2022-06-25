import React, { useState } from "react"
import { Card, Button, Alert, Image } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext.js"
import { Link, useNavigate } from "react-router-dom"

export default function Dashboard() {
  const [error, setError] = useState("")
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setError("")

    try {
      await logout()
      navigate("/login")
    } catch {
      setError("Failed to log out")
    }
  }


  return (
    <>
      <p>
        <Image src="/logo.png" alt="" width="150" className="rounded mx-auto d-block"/>
      </p>
      <Card bg="light">
        <Card.Header as="h2" className="text-center mb-4">User Profile</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <strong>Email:</strong> {currentUser.email} 
          <Link to="/menu" className="btn btn-primary w-100 mt-3">
            Join Group Order
          </Link>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </>
  )
}