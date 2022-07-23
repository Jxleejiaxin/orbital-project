import { render, screen, userEvent } from '@testing-library/react';
import React from 'react';
import Menu from '../components/Menu.js';

describe("Failed login", () => {
    it('should return an error', () => {
        const user = userEvent.setup()
        render(<Menu/>);
        const input = screen.getByLabelText(/Input Token/i);
        user.type(input, "wrong")
        expect(screen.getByText('Oh Snap!')).toBeInTheDocument();
    })
})
