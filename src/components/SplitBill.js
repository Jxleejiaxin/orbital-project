import React from 'react'
import { Card, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';

export default function SplitBill() {
    const navigate = useNavigate();

    return (
        <>
            <Card className="text-center" bg="light">
                <Card.Header as="h5">Split The Bill</Card.Header>
                <Card.Body>
                    <div className="text-center">
                        <Button onClick={(e) => navigate("/split/equal")} style={{width: 300}}>Split Equally</Button>
                    </div>
                    
                    <div className="text-center mt-2">
                        <Button onClick={(e) => navigate("/split/manual")} style={{width: 300}}>Split Manually</Button>
                    </div>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2">
                <Button variant="secondary" onClick={(e) => navigate("/")}>
                    Home
                </Button>
            </div>
        </>
    )
}

