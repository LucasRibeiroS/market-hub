export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export const OrderStatusEnum: { [key in OrderStatus]: key } = {
	pending: 'pending',
	paid: 'paid',
	shipped: 'shipped',
	delivered: 'delivered',
	cancelled: 'cancelled',
	refunded: 'refunded'
}