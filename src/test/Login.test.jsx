import { render, screen } from '@testing-library/react';
import React from 'react';
import Login from '../components/Login.js';

describe("Guest Account", () => {
    it('should go to dashboard', () => {
        render(<Login/>);
        const heading = screen.getByText(/Guest Account/i);
        expect(heading).toBeInTheDocument();
    })
})