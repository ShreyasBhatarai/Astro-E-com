'use client'

import { SessionProvider } from "next-auth/react";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" richColors closeButton className="toast-mobile" />
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}