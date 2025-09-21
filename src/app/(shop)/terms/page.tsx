import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Use</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using Astro E-com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on Astro E-com&apos;s website for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on Astro E-com&apos;s website;</li>
              <li>remove any copyright or other proprietary notations from the materials.</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
              You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>

            <h2>4. Product Information</h2>
            <p>
              We attempt to be as accurate as possible. However, we do not warrant that product descriptions or other content 
              is accurate, complete, reliable, current, or error-free. If a product offered by us is not as described, 
              your sole remedy is to return it in unused condition.
            </p>

            <h2>5. Pricing and Payment</h2>
            <p>
              All prices are subject to change without notice. We reserve the right to refuse or cancel any order for any reason. 
              Payment must be received by us before we will ship any products to you.
            </p>

            <h2>6. Shipping and Delivery</h2>
            <p>
              We will arrange for shipment of products to you. You will pay all shipping and handling charges. 
              Risk of loss and title for products pass to you upon delivery to the carrier.
            </p>

            <h2>7. Returns and Refunds</h2>
            <p>
              Our return policy allows returns within 30 days of purchase. Items must be in original condition. 
              Refunds will be processed within 7-10 business days after we receive the returned item.
            </p>

            <h2>8. Privacy Policy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Site, 
              to understand our practices.
            </p>

            <h2>9. Disclaimer</h2>
            <p>
              The materials on Astro E-com&apos;s website are provided on an &apos;as is&apos; basis. Astro E-com makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
              of intellectual property or other violation of rights.
            </p>

            <h2>10. Limitations</h2>
            <p>
              In no event shall Astro E-com or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
              to use the materials on Astro E-com&apos;s website.
            </p>

            <h2>11. Modifications</h2>
            <p>
              Astro E-com may revise these terms of service at any time without notice. By using this website, 
              you are agreeing to be bound by the then current version of these terms of service.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <ul>
              <li>Email: support@Astro E-com.com</li>
              <li>Phone: +977-1-4567890</li>
              <li>Address: Kathmandu, Nepal</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}