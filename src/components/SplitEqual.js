import {useState} from 'react';
import { Card, Form } from 'react-bootstrap';

export default function SplitEqual() {
  const [totalPrice, setTotalPrice] = useState(0.0);

  return (
    <Card className="text-center" bg="light">
        <Card.Header as="h5">Split The Bill (Equally)</Card.Header>
        <Card.Body>
            <Form>
                <Form.Label>
                Total Price:
                <Form.Control
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                />
                </Form.Label>
            </Form>
        </Card.Body>
    </Card>
  )
}

