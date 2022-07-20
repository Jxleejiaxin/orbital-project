import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert, Image, Modal } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext.js'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const navigate = useNavigate()

    const handleClose = () => setShowPopup(false);
    const handleShow = () => setShowPopup(true);

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            setError("")
            setLoading(true)
            await login(emailRef.current.value, passwordRef.current.value)
            navigate("/")
        } catch {
            setError("Failed to sign in")
        }
      
          setLoading(false)
    }

    async function guestLogin(e) {
      e.preventDefault()

      try {
          setError("")
          setLoading(true)
          await login("guest@gmail.com", "password")
          navigate("/")
      } catch {
          setError("Failed to sign in")
      }
    
        setLoading(false)
  }


    return (
        <>
          <p>
            <Image src="/logo.png" alt="" width="150" className="rounded mx-auto d-block"/>
          </p>
          <Card bg="light">
            <Card.Header as="h2" className="text-center mb-4">Log In</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" ref={emailRef} required placeholder="Enter your email"/>
                </Form.Group>
                <Form.Group id="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" ref={passwordRef} required placeholder="Enter your password"/>
                </Form.Group>
                <div className="w-100 text-center mt-3">
                  <Button disabled={loading} type="submit">
                    Log In
                  </Button>
                </div>
              </Form>
              <div className='w-100 text-center mt-2'>
                <Link to='/forgot-password'>Forgot Password?</Link>
              </div>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            Need an account? <Link to="/signup">Sign Up</Link>
          </div>
          <div className="w-100 text-center">
            Feeling lazy? <Link to="#" onClick = {handleShow}>Guest Account</Link>
          </div>

          <Modal show={showPopup} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Guest Account</Modal.Title>
            </Modal.Header>
            <Modal.Body>All transactions made using guest account will not be saved!</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button variant="success" onClick={guestLogin}>
                Proceed
              </Button>
            </Modal.Footer>
          </Modal>
        </>
    )
}

