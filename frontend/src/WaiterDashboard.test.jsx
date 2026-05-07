import { describe, it, expect } from 'vitest';

const calculateTicketTotal = (ticketItems) => {
    return ticketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

describe('WaiterDashboard Logic', () => {
    
    it('calculates the correct total for a ticket (Test Case 2)', () => {
        // Step A: Setup the mock data
        const mockTicketItems = [
            { id: 1, name: "Cola", price: 2.50, quantity: 2 },        // $5.00
            { id: 2, name: "Classic Burger", price: 12.00, quantity: 1 } // $12.00
        ];
        
        // Step B: Execute the function
        const total = calculateTicketTotal(mockTicketItems);
        
        // Step C: Assert the result
        expect(total).toBe(17.00);
    });
    
});