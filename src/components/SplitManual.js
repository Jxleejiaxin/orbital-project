import {useState} from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function SplitManual() {
  const [amount, setAmount] = useState(0.0);
  const navigate = useNavigate();

  return (
    <>
        <Card className="text-center" bg="light">
            <Card.Header as="h5">Split The Bill (Manually)</Card.Header>
            <Card.Body>
                <Form>
                    <Form.Label>
                        Name:
                        <Form.Control
                            type="text"
                            name="name"
                        />
                    </Form.Label>
                    <Form.Label>
                    Amount:
                    <Form.Control
                        type="number"
                        name="price"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    </Form.Label>
                </Form>
                <Button style={{width:150}} className="mt-3">Add</Button>
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

