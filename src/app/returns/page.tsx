import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw, Calendar, Package, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Returns Policy - SilverPalace',
  description: 'Learn about SilverPalace return and exchange policies for jewelry purchases.',
}

export default function ReturnsPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <RotateCcw className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Exchange Policy</h1>
          <p className="text-xl text-gray-600">
            Easy returns and exchanges for your peace of mind
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Return Window
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-semibold text-lg">30-Day Return Policy</p>
                <p className="text-green-700">
                  You have 30 days from the date of delivery to return your jewelry for a full refund 
                  or exchange, provided it meets our return conditions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                Return Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">To be eligible for return, items must meet the following conditions:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Item must be in original condition and packaging</li>
                <li>All tags and certificates must be attached</li>
                <li>Jewelry must be unworn and undamaged</li>
                <li>Original receipt or proof of purchase required</li>
                <li>Items must not show signs of wear, scratches, or damage</li>
                <li>Custom or personalized items cannot be returned</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Non-Returnable Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">The following items cannot be returned:</p>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <ul className="list-disc list-inside space-y-2 text-red-700 ml-4">
                  <li>Custom or personalized jewelry</li>
                  <li>Engraved items</li>
                  <li>Earrings (for hygiene reasons)</li>
                  <li>Items damaged by customer</li>
                  <li>Items purchased with special discounts over 50%</li>
                  <li>Gift cards</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                How to Return
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">Follow these simple steps to return your item:</p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Contact Us</h4>
                    <p className="text-gray-600 text-sm">Email returns@silverpalace.com or call +91 12345 67890 to initiate the return process.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Get Return Authorization</h4>
                    <p className="text-gray-600 text-sm">We&apos;ll provide you with a Return Merchandise Authorization (RMA) number and return instructions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Package & Ship</h4>
                    <p className="text-gray-600 text-sm">Securely package the item in its original packaging and ship using our prepaid return label.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Receive Refund</h4>
                    <p className="text-gray-600 text-sm">Once we receive and inspect your return, we&apos;ll process your refund within 5-7 business days.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Refund Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Refund Timeline</h3>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Credit/Debit Cards: 5-7 business days</li>
                    <li>• Net Banking: 5-7 business days</li>
                    <li>• UPI: 1-3 business days</li>
                    <li>• Wallet: 1-3 business days</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Refund Policy</h3>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Full refund for unused items</li>
                    <li>• Original payment method only</li>
                    <li>• Shipping charges non-refundable</li>
                    <li>• Processing fees may apply</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We offer exchanges for size or style within 30 days of delivery. Exchange shipping costs 
                may apply depending on the reason for exchange.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Free Exchanges</h4>
                <p className="text-blue-700 text-sm">
                  Free exchanges are available for manufacturing defects or if we sent the wrong item.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Guarantee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                All SilverPalace jewelry comes with a quality guarantee. If you discover any manufacturing 
                defects within 6 months of purchase, we will repair or replace the item free of charge.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Returns Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For any questions about returns or exchanges, contact our dedicated returns team:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> returns@silverpalace.com<br />
                  <strong>Phone:</strong> +91 12345 67890<br />
                  <strong>Hours:</strong> Monday - Saturday, 9:00 AM - 8:00 PM IST<br />
                  <strong>WhatsApp:</strong> +91 12345 67890
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
