import React from "react"
import { Container } from "react-bootstrap"
import { AuthProvider } from "../contexts/AuthContext.js"
import Signup from "./Signup.js"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from "./Dashboard.js"
import Login from "./Login.js"
import PrivateRoute from "./PrivateRoute.js"
import Menu from "./Menu.js"
import ForgotPassword from "./ForgotPassword.js"
import History from "./History.js"

function App() {
  return (
      <div style={{backgroundColor:'bisque'}}>
        <Container 
          className="d-flex align-items-center justify-content-center"
          style={{ minHeight: "100vh"}}
        >
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <Router>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={ <PrivateRoute> <Dashboard /> </PrivateRoute>}></Route>
                  <Route path="/signup" element={<Signup/>}/>
                  <Route path="/login" element={<Login/>}/>
                  <Route path="/forgot-password" element={<ForgotPassword/>}/>
                  <Route path="/menu" element={<PrivateRoute> <Menu/> </PrivateRoute>}/>
                  <Route path="/history" element={<PrivateRoute> <History/> </PrivateRoute>}/>
                </Routes>
              </AuthProvider>
            </Router>
          </div>
        </Container>
      </div>
  ) 
}

export default App
