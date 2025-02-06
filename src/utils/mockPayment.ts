// Mock payment processing utility
export const createMockPayment = async (amount: number) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock payment response
  return {
    id: `mock_pay_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    currency: 'INR',
    status: 'completed',
    razorpay_order_id: `mock_order_${Math.random().toString(36).substr(2, 9)}`,
    razorpay_payment_id: `mock_payment_${Math.random().toString(36).substr(2, 9)}`
  };
};