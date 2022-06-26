import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert, Image } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext.js'
import { Link, useNavigate } from 'react-router-dom'
import app from "../firebase.js";
import {getFirestore, doc} from "firebase/firestore";

export default function Signup() {
    const db = getFirestore(app);
    const emailRef = useRef()
    const passwordRef = useRef()
    const passwordConfirmRef = useRef()
    const { signup } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match")
        }

        try {
            setError("")
            setLoading(true)
            await signup(emailRef.current.value, passwordRef.current.value)
            const userRef = doc(db, "user email", emailRef.current.value);
            navigate("/", {email: emailRef.current.value})
        } catch {
            setError("Failed to create an account")
        }
      
          setLoading(false)
    }

    return (
      <>
        <p>
          <Image src="/logo.png" alt="" width="150" className="rounded mx-auto d-block"/>
        </p>
        <Card bg="light">
          <Card.Header as="h2" className="text-center mb-4">Sign Up</Card.Header>
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
              <Form.Group id="password-confirm">
                <Form.Label>Password Confirmation</Form.Label>
                <Form.Control type="password" ref={passwordConfirmRef} required placeholder="Confirm password"/>
              </Form.Group>
              <div className="w-100 text-center mt-2">
                <Button disabled={loading} type="submit">
                  Sign Up
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Already have an account? <Link to="/login">Log In </Link>
        </div>
      </>
    )
}

