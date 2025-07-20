import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Gavel, AlertTriangle, Mail, ShoppingBag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - SilverPalace',
  description: 'Read the terms and conditions for using SilverPalace jewelry store services.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using SilverPalace services
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: January 20, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                By accessing and using the SilverPalace website and services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from 
                using or accessing this site.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                Products and Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">Product information and policies:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All product descriptions, images, and prices are subject to change without notice</li>
                <li>We reserve the right to limit quantities of any products or services</li>
                <li>We reserve the right to refuse any order for any reason</li>
                <li>Prices are subject to change without prior notice</li>
                <li>All orders are subject to availability and confirmation</li>
                <li>We may require additional verification of information prior to order acceptance</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-amber-600" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">As a user of our services, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Maintain the security of your password and identification</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not use our services to transmit harmful or illegal content</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Disclaimers and Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                The information on this website is provided on an &ldquo;as is&rdquo; basis. To the fullest extent permitted by law, 
                SilverPalace excludes all representations, warranties, conditions, and other terms.
              </p>
              <p className="text-gray-700">
                SilverPalace shall not be liable for any damages including, without limitation, indirect or consequential 
                damages, or any damages whatsoever arising from use or loss of use, data, or profits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                The content, organization, graphics, design, and other matters related to the SilverPalace website are 
                protected under applicable copyrights and other proprietary laws. Copying, redistribution, use or 
                publication of any such matters or any part of the website is strictly prohibited.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                These terms and conditions are governed by and construed in accordance with the laws of India, 
                and you irrevocably submit to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@silverpalace.com<br />
                  <strong>Phone:</strong> +91 12345 67890<br />
                  <strong>Address:</strong> 123 Jewelry District, Mumbai, Maharashtra 400001, India
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
