# Pizza Shop Dashboard 🍕

A modern, production-ready Next.js 15 dashboard for pizza shop owners to manage orders received through Retell AI voice calls. Built with the App Router, Supabase, and real-time updates.

## Features

- **🔐 Secure Authentication** - Supabase email/password and magic link login
- **📊 Real-time Dashboard** - Live stats for today's orders and revenue
- **📋 Order Management** - Complete order tracking with status updates
- **🔄 Real-time Updates** - Orders appear instantly via Supabase subscriptions
- **🎨 Modern UI** - Clean, pizza-themed design with dark mode support
- **📱 Mobile Responsive** - Works perfectly on all devices
- **🚀 Production Ready** - Optimized for deployment on Railway, Vercel, or Netlify

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Real-time:** Supabase Realtime

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- Retell AI account (for voice ordering integration)

## Setup Instructions

### 1. Clone and Install

```bash
cd /Users/dyl/CascadeProjects/pizza-shop
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public Key

### 3. Create the Orders Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('pickup', 'delivery')),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_kitchen', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shop_id TEXT
);

-- Create index for faster queries
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_shop_id ON orders(shop_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all orders
CREATE POLICY "Allow authenticated users to read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update orders
CREATE POLICY "Allow authenticated users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy to allow insert (for Retell webhook)
CREATE POLICY "Allow service role to insert orders"
  ON orders FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

### 4. Create a User Account

In Supabase Dashboard → **Authentication** → **Users**, click "Add User" and create your login credentials.

### 5. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_SHOP_NAME=Tony's Pizza Palace
NEXT_PUBLIC_SHOP_ID=shop_001
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Supabase credentials.

## Retell AI Integration

### Setting Up the Webhook

1. Deploy your app (see deployment section below)
2. In Retell AI dashboard, create a webhook endpoint:
   - **URL:** `https://your-domain.com/api/retell/webhook`
   - **Events:** `call_ended`
3. Use the Retell AI webhook to POST order data to your Supabase database

### Example Webhook Handler

Create `app/api/retell/webhook/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for inserts
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Parse order data from Retell AI call
  const orderData = {
    call_id: body.call_id,
    customer_name: body.customer_name,
    phone: body.phone,
    email: body.email,
    address: body.address,
    order_type: body.order_type,
    items: body.items,
    subtotal: body.subtotal,
    total: body.total,
    status: 'pending',
    notes: body.notes,
  }

  const { error } = await supabase
    .from('orders')
    .insert([orderData])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

## Deployment

### Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard.

### Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

## Project Structure

```
pizza-shop/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with nav
│   │   ├── page.tsx             # Home dashboard with stats
│   │   ├── orders/
│   │   │   └── page.tsx         # Orders table with filters
│   │   └── settings/
│   │       └── page.tsx         # Settings page
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard-nav.tsx        # Navigation component
│   ├── order-details-modal.tsx # Order details modal
│   ├── theme-provider.tsx       # Dark mode provider
│   └── theme-toggle.tsx         # Dark mode toggle
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
├── middleware.ts                # Auth middleware
└── package.json
```

## Usage

### Managing Orders

1. **View Orders:** Navigate to the Orders page to see all orders
2. **Filter Orders:** Use the filters to search by name, phone, status, type, or time period
3. **Update Status:** Click action buttons to move orders through the workflow:
   - Pending → Confirmed → In Kitchen → Completed
4. **View Details:** Click any order row to see full details in a modal
5. **Export Data:** Click "Export CSV" to download orders for reporting

### Dashboard Stats

The home dashboard shows:
- Today's order count and revenue
- This week's order count and revenue
- Live status indicator
- 5 most recent orders

## Customization

### Change Shop Name

Edit `.env.local`:
```env
NEXT_PUBLIC_SHOP_NAME=Your Pizza Shop Name
```

### Customize Colors

Edit `tailwind.config.ts` to change the pizza theme colors:
```typescript
pizza: {
  red: "#DC2626",    // Primary red
  green: "#16A34A",  // Success green
  gold: "#F59E0B",   // Warning gold
}
```

### Add More Order Statuses

1. Update the database CHECK constraint
2. Update the `OrderStatus` type in `lib/types.ts`
3. Add badge variants in components

## Support

For issues or questions:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Check the [Next.js Documentation](https://nextjs.org/docs)
- Review the [Retell AI Documentation](https://docs.retellai.com)

## License

MIT License - feel free to use this for your pizza shop!

---

Built with ❤️ for pizza shop owners everywhere 🍕
