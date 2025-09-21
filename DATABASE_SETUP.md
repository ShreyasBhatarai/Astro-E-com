# Database Setup Instructions

## 🚨 Important: Database Connection Issue

The application is currently failing to connect to the database. Follow these steps to fix it:

## 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp env.example .env
```

## 2. Database Configuration

You need to set up a PostgreSQL database. You have several options:

### Option A: Using Neon (Recommended for development)

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new database
3. Copy the connection string
4. Update your `.env` file:

```env
DATABASE_URL="postgresql://username:password@your-db-host.neon.tech:5432/dbname?sslmode=require"
```

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
```sql
CREATE DATABASE Astro E-com;
```
3. Update your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/Astro E-com?schema=public"
```

### Option C: Docker PostgreSQL

```bash
docker run --name Astro E-com-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=Astro E-com -p 5432:5432 -d postgres:15
```

Then use:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/Astro E-com?schema=public"
```

## 3. Initialize Database

Run Prisma migrations to set up the database schema:

```bash
# Generate Prisma client
bun run prisma generate

# Run database migrations
bun run prisma db push

# Optional: Seed the database with sample data
bun run prisma db seed
```

## 4. Environment Variables

Make sure your `.env` file has all required variables. Here's a minimal setup:

```env
# Database
DATABASE_URL="your-database-connection-string-here"

# NextAuth.js (generate a random string)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Astro E-com"
```

## 5. Test Database Connection

After setting up, restart the development server:

```bash
bun dev
```

Visit the admin dashboard to see if the database connection is working.

## 6. Create Admin User

Once the database is connected, create an admin user:

```bash
bun run prisma studio
```

Or use the admin creation API endpoint (create this if needed).

## Troubleshooting

### Common Issues:

1. **Database connection timeout**: Check your internet connection and database server status
2. **SSL connection issues**: Add `?sslmode=require` to your connection string
3. **Authentication failed**: Verify username and password in connection string
4. **Database not found**: Ensure the database exists and the name is correct

### Check Database Status

Visit `http://localhost:3000/api/health/database` to check if the database connection is working.

### Need Help?

- Check the console logs for detailed error messages
- Verify your `.env` file is in the root directory
- Make sure you're using the correct database URL format
- Restart the development server after making changes