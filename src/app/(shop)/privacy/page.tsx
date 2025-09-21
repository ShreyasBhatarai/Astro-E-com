import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, make a purchase, 
              or contact us for support. This may include:
            </p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Purchase history and preferences</li>
              <li>Communications with our customer service team</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your account and orders</li>
              <li>Provide customer support</li>
              <li>Send you promotional emails (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
            </p>
            <ul>
              <li>With service providers who assist us in operating our website and conducting business</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
              <li>With your explicit consent</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, 
              and understand where our visitors are coming from. You can control cookies through your browser settings.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Correct any inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability (receive a copy of your data)</li>
            </ul>

            <h2>7. Third-Party Services</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices 
              of these external sites. We encourage you to read their privacy policies.
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If we become aware that we have collected such information, 
              we will take steps to delete it.
            </p>

            <h2>9. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information.
            </p>

            <h2>10. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, 
              unless a longer retention period is required by law.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              policy on our website and updating the &apos;Last updated&apos; date.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@Astro E-com.com</li>
              <li>Phone: +977-1-4567890</li>
              <li>Address: Kathmandu, Nepal</li>
            </ul>

            <h2>13. Cookie Policy</h2>
            <p>
              We use the following types of cookies:
            </p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site</li>
              <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}