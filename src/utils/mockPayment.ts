
interface MockPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  razorpay_order_id: string;
  razorpay_payment_id: string;
}

export const createMockPayment = async (amount: number): Promise<MockPaymentResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success with 90% probability
  const isSuccess = Math.random() < 0.9;
  
  if (!isSuccess) {
    throw new Error("Payment failed. Please try again.");
  }

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
