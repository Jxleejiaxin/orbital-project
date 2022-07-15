import React from 'react'
import { Card } from "react-bootstrap";
import { Link } from 'react-router-dom';

export default function SplitBill() {
    return (
        <Card className="text-center" bg="light">
            <Card.Header as="h5">Split The Bill</Card.Header>
            <Card.Body>
                <Link to="/split/equal" className='btn btn-primary w-100 mt-3'>
                    Split Equally
                </Link>
                <Link to="/split/manual" className='btn btn-primary w-100 mt-3'>
                    Split Manually
                </Link>
            </Card.Body>
        </Card>
    )
}

