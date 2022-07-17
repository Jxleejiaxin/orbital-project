import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert, Image } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext.js'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
    const emailRef = useRef()
    const { resetPassword } = useAuth()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            setMessage('')
            setError("")
            setLoading(true)
            await resetPassword(emailRef.current.value)
            setMessage('Check your inbox for further instructions')
        } catch {
            setError("Failed to reset password")
        }
      
          setLoading(false)
    }

    return (
        <>
          <p>
            <Image src="/logo.png" alt="" width="150" className="rounded mx-auto d-block"/>
          </p>
          <Card bg="light">
            <Card.Header as="h2" className="text-center mb-4">Password Reset</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {message && <Alert variant="success">{message}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" ref={emailRef} required placeholder="Enter your email"/>
                </Form.Group>
                <div className="w-100 text-center mt-3">
                  <Button disabled={loading} type="submit" style={{width:200}}>
                    Reset Password
                  </Button>
                </div>
              </Form>
              <div className='w-100 text-center mt-3'>
                <Link to='/login'>Login</Link>
              </div>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            Need an account? <Link to="/signup">Sign Up</Link>
          </div>
        </>
    )
}

