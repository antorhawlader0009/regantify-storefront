// Customer-facing copy for order statuses — plainer language than the
// vendor dashboard's internal labels (see client/src/pages/vendor/order/
// orderStatus.tsx), since a shopper doesn't need to know internal
// pipeline states like STOCK_OUT or PARTIAL_PAYMENT_PENDING in those
// exact terms.
const LABELS: Record<string, string> = {
  PENDING: 'Order received',
  PROCESSING: 'Being prepared',
  SHIPPING: 'On the way',
  COMPLETED: 'Delivered',
  ON_HOLD: 'On hold',
  PAYMENT_INITIATED: 'Payment started',
  PARTIAL_PAYMENT_PENDING: 'Partial payment pending',
  PAYMENT_FAILED: 'Payment failed',
  CANCELLED: 'Cancelled',
  RETURN: 'Returned',
  REFUNDED: 'Refunded',
  STOCK_OUT: 'Item unavailable',
};

export function customerOrderStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}

// A simple 4-step progress track for the common happy path. Any status
// outside this set (cancelled, refunded, etc) is shown as its own
// standalone state rather than forced onto the track.
export const HAPPY_PATH = ['PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED'];
