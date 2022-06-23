import React, { useState } from "react"
import { Card } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext.js"
import { Link, useNavigate } from "react-router-dom"
import OTPInput, { ResendOTP } from 'otp-input-react'

export default function Token() {
  const [OTP, setOTP] = useState("")


  return (
    <>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Enter Token</h2>
          <>
            <OTPInput value={OTP} onChange={setOTP} autoFocus OTPLength={4} otpType="alphanumeric" disabled={false} secure />
          </>
          <h1>{OTP}</h1>
          <Link to="/menu" className="btn btn-primary w-100 mt-3">
            Join Order
          </Link>
        </Card.Body>
      </Card>
    </>
  );
}

