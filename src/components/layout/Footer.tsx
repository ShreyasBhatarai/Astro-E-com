"use client"
import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin, Linkedin, Youtube } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-astro-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Grid layout for footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <Image src="/logo.webp" alt="Astronova" width={40} height={40} className="rounded" />
            <div className="flex text-xl font-medium text-white">
              ASTRO <span className="text-primary text-xl font-bold ml-1">E-Com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-astro-gray-300">
            <Link href="/products" className="hover:text-white transition-colors">Shop All</Link>
            <Link href="/products?sort=createdAt&order=desc" className="hover:text-white transition-colors">New Arrivals</Link>
            <Link href="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link>
            <Link href="/orders" className="hover:text-white transition-colors">My Orders</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Refunds</Link>
          </div>

          {/* Contact Info - Interactive */}
          <div className="flex flex-col gap-3 text-sm text-astro-gray-300">
            <a href="tel:+9855027369" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-4 w-4 text-astro-primary" />
              <span>+985-5027369</span>
            </a>
            <a href="mailto:astroinf369@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4 text-astro-primary" />
              <span>astroinf369@gmail.com</span>
            </a>
            <a href="https://maps.google.com/?q=Lattinath+marg,+Hetauda,+Nepal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <MapPin className="h-4 w-4 text-astro-primary" />
              <span>Hetauda, Nepal</span>
            </a>
          </div>

          {/* Social Media Links */}
          <div className="flex gap-3">
            <Link href="https://www.facebook.com/astroinf369" className="w-10 h-10 rounded-full border border-astro-gray-700 hover:border-astro-primary flex items-center justify-center transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-white" />
            </Link>
            <Link href="https://www.instagram.com/astroinf369/" className="w-10 h-10 rounded-full border border-astro-gray-700 hover:border-astro-primary flex items-center justify-center transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-white" />
            </Link>
            <Link href="https://www.youtube.com/@AstronovasLearniverse" className="w-10 h-10 rounded-full border border-astro-gray-700 hover:border-astro-primary flex items-center justify-center transition-colors" aria-label="Youtube">
              <Youtube className="h-5 w-5 text-white" />
            </Link>
            <Link href="https://www.linkedin.com/company/astro369" className="w-10 h-10 rounded-full border border-astro-gray-700 hover:border-astro-primary flex items-center justify-center transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 text-white" />
            </Link>
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