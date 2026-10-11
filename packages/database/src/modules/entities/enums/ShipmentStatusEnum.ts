export type ShipmentStatus = 'pending' | 'invoiced' | 'shipped' | 'delivered' | 'returned' | 'cancelled'

export const ShipmentStatusEnum: { [key in ShipmentStatus]: key } = {
	pending: 'pending',
	invoiced: 'invoiced',
	shipped: 'shipped',
	delivered: 'delivered',
	returned: 'returned',
	cancelled: 'cancelled'
}