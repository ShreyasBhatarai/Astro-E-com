
import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin, Linkedin, Youtube } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-astro-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Image src="/logo.webp" alt="Astronova" width={250} height={250} />
          {/* Brand Section */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex justify-start">
              <div className="flex text-5xl lg:text-7xl font-medium text-white">
                ASTRO <span className="text-primary text-5xl lg:text-7xl font-extrabold ml-2">E-Com</span>
              </div>
            </div>
            <p className="text-astro-gray-300 text-sm text-wrap leading-relaxed  line-clamp-3">
              Your trusted e-commerce destination for quality products and exceptional service.<br/>
              We bring you the best selection at unbeatable prices.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/astroinf369"
                className="w-10 h-10 bg-astro-primary rounded-full flex items-center justify-center hover:bg-astro-primary-hover transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-white" />
              </Link>
              <Link
                href="https://www.instagram.com/astroinf369/"
                className="w-10 h-10 bg-astro-primary rounded-full flex items-center justify-center hover:bg-astro-primary-hover transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-white" />
              </Link>
              <Link
                href="https://www.youtube.com/@AstronovasLearniverse"
                className="w-10 h-10 bg-astro-primary rounded-full flex items-center justify-center hover:bg-astro-primary-hover transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="h-5 w-5 text-white" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/astro369"
                className="w-10 h-10 bg-astro-primary rounded-full flex items-center justify-center hover:bg-astro-primary-hover transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>





          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-astro-primary flex-shrink-0" />
                <span className="text-astro-gray-300 text-sm">+985-5027369</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-astro-primary flex-shrink-0" />
                <span className="text-astro-gray-300 text-sm">astroinf369@gmail.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-astro-primary flex-shrink-0 mt-0.5" />
                <span className="text-astro-gray-300 text-sm leading-relaxed">

                  Lattinath marg, Hetauda, Nepal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-astro-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-astro-gray-400 text-sm">
              © {new Date().getFullYear()} Astronova Foundation. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-astro-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-astro-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
  
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}