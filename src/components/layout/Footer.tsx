"use client"
import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin, Linkedin, Youtube, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-astro-gray-900 via-astro-gray-900 to-astro-gray-800 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:60px_60px]"></div>
      
      <div className="  py-12 relative">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row px-6 justify-center md:justify-around gap-4 lg:gap-12">
          
          {/* Brand Section - Takes more space */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image 
                  src="/logo.webp" 
                  alt="Astronova logo" 
                  width={48} 
                  height={48} 
                  className="rounded-lg shadow-lg" 
                />
            </div>
              <div className="flex text-2xl font-bold text-white">
                ASTRO <span className="text-astro-primary ml-1 bg-gradient-to-r from-astro-primary to-blue-400 bg-clip-text ">E-Com</span>
              </div>
            </div>
            <p className="text-astro-gray-300 text-base leading-relaxed max-w-sm">
              Your trusted mobile-first shopping destination with lightning-fast delivery and exceptional customer support across Nepal.
            </p>
  
          </div>

   

          {/* Support Links */}
          <div className="lg:col-span-2">
            <h4 className="mb-6 text-base font-semibold text-white relative">
              Support
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-astro-primary rounded-full"></div>
            </h4>
            <nav className="space-y-3">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms & Refunds" },

              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="block text-astro-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm group"
                >
                  <span className="flex items-center gap-2">
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-base font-semibold text-white relative">
              Get In Touch
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-astro-primary rounded-full"></div>
            </h4>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <a 
                href="tel:+9855027369" 
                className="flex items-center gap-3 text-astro-gray-300 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 bg-astro-gray-800 rounded-lg flex items-center justify-center group-hover:bg-astro-primary/10 transition-colors">
                  <Phone className="h-4 w-4 text-astro-primary" />
                </div>
                <div>
                  <div className="text-xs text-astro-gray-400">Call us</div>
                  <div className="text-sm font-medium">+985-5027369</div>
                </div>
              </a>
              
              <a 
                href="mailto:astroinf369@gmail.com" 
                className="flex items-center gap-3 text-astro-gray-300 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 bg-astro-gray-800 rounded-lg flex items-center justify-center group-hover:bg-astro-primary/10 transition-colors">
                  <Mail className="h-4 w-4 text-astro-primary" />
                </div>
                <div>
                  <div className="text-xs text-astro-gray-400">Email us</div>
                  <div className="text-sm font-medium">astroinf369@gmail.com</div>
                </div>
              </a>
              
              <a 
                href="https://maps.google.com/?q=Lattinath+marg,+Hetauda,+Nepal" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-astro-gray-300 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 bg-astro-gray-800 rounded-lg flex items-center justify-center group-hover:bg-astro-primary/10 transition-colors">
                  <MapPin className="h-4 w-4 text-astro-primary" />
                </div>
                <div>
                  <div className="text-xs text-astro-gray-400">Visit us</div>
                  <div className="text-sm font-medium">Hetauda, Nepal</div>
                </div>
              </a>
            </div>

          </div>
            {/* Social Media */}
            <div className="lg:col-span-2">
              <h5 className="mb-4 text-sm font-semibold text-white">Follow Us</h5>
              <div className="flex gap-3">
                {[
                  { href: "https://www.facebook.com/astroinf369", icon: Facebook, label: "Facebook" },
                  { href: "https://www.instagram.com/astroinf369/", icon: Instagram, label: "Instagram" },
                  { href: "https://www.youtube.com/@AstronovasLearniverse", icon: Youtube, label: "Youtube" },
                  { href: "https://www.linkedin.com/company/astro369", icon: Linkedin, label: "LinkedIn" },
                ].map((social) => (
                  <Link
                    key={social.href}
                    href={social.href}
                    className="w-12 h-12 bg-astro-gray-800 hover:bg-astro-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-5 w-5 text-astro-gray-300 group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-astro-gray-800 mt-8">
          <div className="flex flex-col lg:flex-row justify-center items-center space-y-4 lg:space-y-0 mt-6">
            <div className="text-astro-gray-400 text-sm text-center lg:text-left">
              © {new Date().getFullYear()} Astronova Foundation. All rights reserved.
            </div>
     
          </div>
        </div>
      </div>
    </footer>
  )
}