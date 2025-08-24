import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Clock, MapPin, Package, Shield, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Shipping Information - SilverPalace',
  description: 'Learn about SilverPalace shipping policies, delivery times, and shipping costs.',
}

export default function ShippingInfo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Truck className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-600">
            Fast, secure, and reliable delivery for your precious jewelry
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Delivery Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Standard Delivery</h3>
                  <p className="text-green-700 text-sm mb-2">5-7 business days</p>
                  <p className="text-gray-700 text-sm">Available across India</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Express Delivery</h3>
                  <p className="text-blue-700 text-sm mb-2">2-3 business days</p>
                  <p className="text-gray-700 text-sm">Major cities only</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                * Delivery times may vary during festive seasons or due to unforeseen circumstances
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Shipping Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-700">Order Value</th>
                      <th className="text-left py-2 text-gray-700">Standard Shipping</th>
                      <th className="text-left py-2 text-gray-700">Express Shipping</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Under ₹2,000</td>
                      <td className="py-2 text-gray-600">₹99</td>
                      <td className="py-2 text-gray-600">₹199</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">₹2,000 - ₹5,000</td>
                      <td className="py-2 text-gray-600">₹49</td>
                      <td className="py-2 text-gray-600">₹149</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Above ₹5,000</td>
                      <td className="py-2 text-green-600 font-semibold">FREE</td>
                      <td className="py-2 text-gray-600">₹99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-600" />
                Delivery Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">We currently deliver to the following locations:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Standard Delivery Available</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>All major cities in India</li>
                    <li>Tier 2 and Tier 3 cities</li>
                    <li>Most rural areas with postal service</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Express Delivery Available</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>Mumbai, Delhi, Bangalore, Chennai</li>
                    <li>Hyderabad, Kolkata, Pune, Ahmedabad</li>
                    <li>Jaipur, Lucknow, Kanpur, Nagpur</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Packaging & Handling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your jewelry is precious to us, and we ensure it reaches you in perfect condition:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Premium jewelry boxes for all items</li>
                <li>Bubble wrap and protective padding</li>
                <li>Tamper-evident packaging</li>
                <li>Discrete packaging without brand labels (on request)</li>
                <li>Gift wrapping available for special occasions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Shipping Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">We take the security of your orders seriously:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All packages are insured up to their full value</li>
                <li>Real-time tracking available for all orders</li>
                <li>Signature required for delivery</li>
                <li>ID verification for high-value orders</li>
                <li>24/7 customer support for shipping queries</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Orders are typically processed within 1-2 business days. During peak seasons 
                (festivals, holidays), processing may take up to 3-4 business days.
              </p>
              <p className="text-gray-700">
                You will receive an email confirmation with tracking information once your order ships.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For any shipping-related questions, please contact our customer service team:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> shipping@silverpalace.com<br />
                  <strong>Phone:</strong> +91 12345 67890<br />
                  <strong>Hours:</strong> Monday - Saturday, 9:00 AM - 8:00 PM IST
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
