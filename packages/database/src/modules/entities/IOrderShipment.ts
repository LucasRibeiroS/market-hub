import { ShipmentStatus } from '@entities/enums'

export type IOrderShipment = {
	id: string
	order_id: string
	external_shipment_id: string
	status: ShipmentStatus
	carrier: string | null
	tracking_number: string | null
	tracking_url: string | null
	shipping_street: string | null
	shipping_number: string | null
	shipping_complement: string | null
	shipping_district: string | null
	shipping_city: string | null
	shipping_state: string | null
	shipping_zip_code: string | null
	shipped_at: Date | null
	estimated_delivery_at: Date | null
	delivered_at: Date | null
	metadata: Record<string, unknown>
	created_at: Date
	updated_at: Date
}