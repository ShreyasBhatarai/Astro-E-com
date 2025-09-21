# Astro E-commerce

A modern, mobile-first e-commerce platform built with Next.js 15, TypeScript, and PostgreSQL. Optimized for the Nepalese market with Cash on Delivery support.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile shopping experience
- **Cash on Delivery**: Pay when you receive your order
- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Prisma
- **AI-Driven Testing**: TestSprite integration for automated testing
- **Responsive UI**: shadcn/ui components with mobile optimization
- **Real-time Updates**: Live order tracking and status updates
- **Cloud Image Storage**: Cloudinary integration for optimized image uploads
- **Smart Stock Management**: Automatic stock reservation and restoration
- **Secure**: Industry-standard security practices

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Testing**: TestSprite (AI-driven testing)
- **Package Manager**: Bun
- **Deployment**: Vercel-ready

## 📱 Mobile-First Features

- Touch-optimized interactions
- Swipe gestures for product browsing
- Mobile-friendly checkout flow
- Responsive design for all screen sizes
- PWA capabilities
- Offline support (coming soon)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout with mobile optimization
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components (Header, Footer)
├── lib/                  # Utility functions
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Astro E-com
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/astro_ecommerce"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   bun run db:push
   bun run db:generate
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Customer and admin accounts
- **Product**: Product catalog with images and pricing
- **Order**: Order management with COD support
- **OrderItem**: Individual items in orders
- **Review**: Product reviews and ratings
- **Wishlist**: Customer wishlist functionality
- **Banner**: Advertisement management
- **Category**: Product categorization

## 🧪 Testing with TestSprite

TestSprite provides AI-driven testing for the e-commerce platform:

```bash
# Generate test plans
bun run test:generate

# Run tests
bun run test
```

TestSprite is configured to test:
- Mobile-first UI components
- E-commerce workflows (browse, add to cart, checkout)
- Cash on Delivery flow
- Responsive design
- Accessibility features

## 📱 Mobile Development

### Best Practices

1. **Touch Targets**: Minimum 44px touch targets
2. **Responsive Design**: Mobile-first approach with Tailwind CSS
3. **Performance**: Optimized images and lazy loading
4. **Accessibility**: ARIA labels and keyboard navigation
5. **PWA**: Service worker for offline functionality

### Mobile-Specific Features

- Swipe gestures for product carousels
- Touch-friendly navigation
- Mobile-optimized checkout flow
- Responsive product grids
- Mobile search with autocomplete

## 💰 Cash on Delivery (COD)

The platform supports Cash on Delivery for the Nepalese market:

1. **Order Placement**: Customers can place orders without payment
2. **Order Tracking**: Real-time order status updates
3. **Delivery Confirmation**: Payment collection on delivery
4. **Order Management**: Admin panel for order processing

## 🎨 UI Components

Built with shadcn/ui components optimized for mobile:

- **Button**: Touch-friendly buttons with proper sizing
- **Input**: Mobile-optimized form inputs
- **Card**: Product cards with mobile layouts
- **Sheet**: Mobile navigation drawers
- **Dialog**: Mobile-friendly modals

## 🔧 Development Scripts

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run start            # Start production server

# Database
bun run db:generate      # Generate Prisma client
bun run db:push          # Push schema to database
bun run db:migrate       # Run database migrations
bun run db:studio        # Open Prisma Studio

# Code Quality
bun run lint             # Run ESLint
bun run type-check       # TypeScript type checking
bun run format           # Format code with Prettier

# Testing
bun run test             # Run TestSprite tests
bun run test:generate    # Generate test plans
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** automatically on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
TESTSPRITE_API_KEY="your-testsprite-key"
```

## 📊 Performance

- **Lighthouse Score**: 90+ on mobile
- **Core Web Vitals**: Optimized for mobile performance
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Optimized caching strategies

## 🔒 Security

- **Authentication**: NextAuth.js with secure sessions
- **Data Validation**: Zod schemas for form validation
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: NextAuth.js CSRF tokens

## 📦 Stock Management

The platform implements a comprehensive stock management system:

### Stock Reservation Policy
1. **Order Creation**: Stock is decremented immediately when an order is created (PENDING status)
2. **Processing Transition**: When an order moves from PENDING to PROCESSING, stock reservation is validated
3. **Cancellation/Failure**: Stock is automatically restored when orders are cancelled or failed
4. **Idempotent Operations**: Restocking operations are idempotent to prevent double-restock

### Implementation Details
- Stock decrements happen within Prisma transactions for data consistency
- Restocking is tracked via status history to prevent duplicate operations
- Concurrent order handling with proper validation
- Automatic stock restoration for cancelled/failed orders

## 🖼️ Image Management

The platform uses Cloudinary for optimized image storage and delivery:

### Features
- **Automatic Optimization**: Images are automatically compressed and optimized
- **Cloud Storage**: Images are stored in Cloudinary's CDN for fast delivery
- **Format Conversion**: Automatic WebP/AVIF conversion for better performance
- **Responsive Images**: Multiple sizes generated automatically
- **Secure Upload**: Upload presets with proper security configurations

### Setup
1. Create a Cloudinary account
2. Configure environment variables:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
   ```
3. Create an unsigned upload preset in Cloudinary dashboard
4. Images will be automatically uploaded and optimized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@astroecommerce.com or join our Discord community.

## 🗺️ Roadmap

- [ ] PWA implementation
- [ ] Offline support
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Social login integration
- [ ] Inventory management
- [ ] Vendor dashboard

---

Built with ❤️ for the Nepalese e-commerce market