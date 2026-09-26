import { InspectionResult } from '@/types';

export interface RepoPreset {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  framework: string;
  stars: string;
  category: string;
  inspectionData: InspectionResult;
}

export const REPO_PRESETS: RepoPreset[] = [
  {
    id: 'nextjs-clerk-saas',
    name: 'Next.js 14 + Clerk Auth SaaS',
    description: 'Next.js App Router with Clerk authentication, UserButton, sign-in/up modal flows, and protected dashboard routes.',
    repoUrl: 'https://github.com/clerk/clerk-nextjs-starter',
    framework: 'Next.js 14 (App Router) + Clerk',
    stars: '9.2k',
    category: 'Clerk Auth & SaaS',
    inspectionData: {
      metadata: {
        owner: 'clerk',
        repo: 'clerk-nextjs-starter',
        branch: 'main',
        stars: 9200,
        language: 'TypeScript',
        framework: 'Next.js 14 App Router',
        routerType: 'app-router',
        authType: 'clerk',
        totalRawFiles: 110,
        totalFilteredFiles: 11,
      },
      tokenBudget: {
        rawRepoTokensEstimated: 260000,
        targetedTokensUsed: 3100,
        tokensSavedPercentage: 98.8,
        filesScanned: 110,
        targetedFilesCount: 11,
      },
      files: [
        { path: 'src/app/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 380 },
        { path: 'src/app/sign-in/[[...sign-in]]/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 320 },
        { path: 'src/app/sign-up/[[...sign-up]]/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 340 },
        { path: 'src/app/dashboard/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 450 },
        { path: 'src/middleware.ts', name: 'middleware.ts', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 210 },
      ],
      detectedRoutes: [
        { path: '/', type: 'page', fileSource: 'src/app/page.tsx', description: 'Public landing page with Clerk Sign In / Sign Up triggers' },
        { path: '/sign-in', type: 'auth-route', fileSource: 'src/app/sign-in/[[...sign-in]]/page.tsx', description: 'Clerk hosted / embedded sign-in view with OAuth & passkeys' },
        { path: '/sign-up', type: 'auth-route', fileSource: 'src/app/sign-up/[[...sign-up]]/page.tsx', description: 'Clerk multi-factor registration and email verification' },
        { path: '/dashboard', type: 'protected', fileSource: 'src/app/dashboard/page.tsx', description: 'Clerk protected user profile & management dashboard' },
      ],
      sampleCodeSnippets: {
        'src/middleware.ts': `import { clerkMiddleware } from "@clerk/nextjs/server";\nexport default clerkMiddleware();\nexport const config = { matcher: ["/((?!.*\\\\..*|_next).*)", "/", "/(api|trpc)(.*)"] };`,
        'src/app/sign-in/[[...sign-in]]/page.tsx': `import { SignIn } from "@clerk/nextjs";\nexport default function Page() {\n  return <SignIn />;\n}`
      }
    }
  },
  {
    id: 'nextjs-saas-dashboard',
    name: 'SaaS Platform & Billing Portal',
    description: 'Next.js 14 App Router, NextAuth v5, Stripe checkout, invoices, protected dashboard, and analytics API.',
    repoUrl: 'https://github.com/shadcn-ui/taxonomy',
    framework: 'Next.js 14 (App Router)',
    stars: '18.4k',
    category: 'Full-Stack SaaS',
    inspectionData: {
      metadata: {
        owner: 'shadcn-ui',
        repo: 'taxonomy',
        branch: 'main',
        stars: 18420,
        language: 'TypeScript',
        framework: 'Next.js 14 App Router',
        routerType: 'app-router',
        authType: 'next-auth',
        totalRawFiles: 148,
        totalFilteredFiles: 14,
      },
      tokenBudget: {
        rawRepoTokensEstimated: 345000,
        targetedTokensUsed: 3820,
        tokensSavedPercentage: 98.9,
        filesScanned: 148,
        targetedFilesCount: 14,
      },
      files: [
        { path: 'src/app/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 450 },
        { path: 'src/app/login/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 380 },
        { path: 'src/app/register/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 420 },
        { path: 'src/app/dashboard/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 510 },
        { path: 'src/app/dashboard/billing/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 490 },
        { path: 'src/app/dashboard/settings/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 380 },
        { path: 'src/app/api/auth/[...nextauth]/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 290 },
        { path: 'src/app/api/user/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'api', tokenEstimate: 310 },
        { path: 'src/app/api/billing/stripe/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'api', tokenEstimate: 440 },
        { path: 'src/middleware.ts', name: 'middleware.ts', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 150 },
        { path: 'package.json', name: 'package.json', type: 'file', isRelevant: true, category: 'config', tokenEstimate: 220 },
      ],
      detectedRoutes: [
        { path: '/', type: 'page', fileSource: 'src/app/page.tsx', description: 'Landing hero, feature showcase, pricing plans CTA' },
        { path: '/login', type: 'auth-route', fileSource: 'src/app/login/page.tsx', description: 'User login page with email magic link & GitHub OAuth' },
        { path: '/register', type: 'auth-route', fileSource: 'src/app/register/page.tsx', description: 'Account registration with terms agreement checkbox' },
        { path: '/dashboard', type: 'protected', fileSource: 'src/app/dashboard/page.tsx', description: 'Protected overview, active projects, metric summaries' },
        { path: '/dashboard/billing', type: 'protected', fileSource: 'src/app/dashboard/billing/page.tsx', description: 'Stripe subscription tiers, upgrade buttons, billing portal' },
        { path: '/dashboard/settings', type: 'protected', fileSource: 'src/app/dashboard/settings/page.tsx', description: 'Profile form, user display name change, notification toggles' },
        { path: '/api/user', type: 'api', method: 'GET / PATCH', fileSource: 'src/app/api/user/route.ts', description: 'Fetch authenticated session profile, update username' },
        { path: '/api/billing/stripe', type: 'api', method: 'POST', fileSource: 'src/app/api/billing/stripe/route.ts', description: 'Initialize Stripe checkout session or customer portal redirect' },
      ],
      sampleCodeSnippets: {
        'src/app/login/page.tsx': `export default function LoginPage() {\n  return (\n    <div className="container flex h-screen w-screen flex-col items-center justify-center">\n      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>\n      <UserAuthForm />\n      <Link href="/register" className="text-sm underline">Don't have an account? Sign Up</Link>\n    </div>\n  );\n}`,
        'src/middleware.ts': `import { withAuth } from "next-auth/middleware";\nexport default withAuth({\n  callbacks: { authorized: ({ token }) => !!token },\n  pages: { signIn: "/login" },\n});\nexport const config = { matcher: ["/dashboard/:path*"] };`,
        'src/app/api/billing/stripe/route.ts': `export async function POST(req: Request) {\n  const session = await getServerSession(authOptions);\n  if (!session?.user) return new Response("Unauthorized", { status: 401 });\n  const stripeSession = await stripe.checkout.sessions.create({ ... });\n  return Response.json({ url: stripeSession.url });\n}`
      }
    }
  },
  {
    id: 'ecommerce-storefront',
    name: 'Modern E-Commerce Storefront',
    description: 'High-performance online store with product catalog, cart drawer, checkout flow, search filters, and inventory API.',
    repoUrl: 'https://github.com/vercel/commerce',
    framework: 'Next.js 14 App Router',
    stars: '12.8k',
    category: 'E-Commerce',
    inspectionData: {
      metadata: {
        owner: 'vercel',
        repo: 'commerce',
        branch: 'main',
        stars: 12850,
        language: 'TypeScript',
        framework: 'Next.js 14 App Router',
        routerType: 'app-router',
        authType: 'custom',
        totalRawFiles: 210,
        totalFilteredFiles: 16,
      },
      tokenBudget: {
        rawRepoTokensEstimated: 480000,
        targetedTokensUsed: 4100,
        tokensSavedPercentage: 99.1,
        filesScanned: 210,
        targetedFilesCount: 16,
      },
      files: [
        { path: 'app/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 420 },
        { path: 'app/search/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 510 },
        { path: 'app/product/[handle]/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 620 },
        { path: 'app/cart/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 430 },
        { path: 'app/api/cart/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'api', tokenEstimate: 390 },
        { path: 'app/api/revalidate/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'api', tokenEstimate: 210 },
      ],
      detectedRoutes: [
        { path: '/', type: 'page', fileSource: 'app/page.tsx', description: 'Featured collections carousel, promo banners, top products' },
        { path: '/search', type: 'page', fileSource: 'app/search/page.tsx', description: 'Product search with price range filters and sorting dropdown' },
        { path: '/product/[handle]', type: 'page', fileSource: 'app/product/[handle]/page.tsx', description: 'Product detail page with size/color options & Add to Cart button' },
        { path: '/cart', type: 'page', fileSource: 'app/cart/page.tsx', description: 'Cart drawer / checkout summary with item quantity increments' },
        { path: '/api/cart', type: 'api', method: 'POST / GET / DELETE', fileSource: 'app/api/cart/route.ts', description: 'Cart management API with session cookie persistence' },
      ],
      sampleCodeSnippets: {
        'app/product/[handle]/page.tsx': `export default async function ProductPage({ params }: { params: { handle: string } }) {\n  const product = await getProduct(params.handle);\n  return <AddToCartForm product={product} />;\n}`,
        'app/api/cart/route.ts': `export async function POST(req: Request) {\n  const { variantId, quantity } = await req.json();\n  const cart = await addToCart(variantId, quantity);\n  return Response.json(cart);\n}`
      }
    }
  },
  {
    id: 'healthcare-portal',
    name: 'Healthcare Patient Portal & Telehealth',
    description: 'HIPAA-compliant patient booking portal, appointment scheduling wizard, document upload, and doctor messaging.',
    repoUrl: 'https://github.com/acme/patient-care',
    framework: 'Next.js 14 (App Router)',
    stars: '4.2k',
    category: 'Healthcare & Enterprise',
    inspectionData: {
      metadata: {
        owner: 'acme',
        repo: 'patient-care',
        branch: 'main',
        stars: 4200,
        language: 'TypeScript',
        framework: 'Next.js 14 App Router',
        routerType: 'app-router',
        authType: 'supabase',
        totalRawFiles: 180,
        totalFilteredFiles: 12,
      },
      tokenBudget: {
        rawRepoTokensEstimated: 390000,
        targetedTokensUsed: 3600,
        tokensSavedPercentage: 99.0,
        filesScanned: 180,
        targetedFilesCount: 12,
      },
      files: [
        { path: 'app/portal/login/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'auth', tokenEstimate: 390 },
        { path: 'app/portal/dashboard/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 510 },
        { path: 'app/portal/book-appointment/page.tsx', name: 'page.tsx', type: 'file', isRelevant: true, category: 'route', tokenEstimate: 620 },
        { path: 'app/api/appointments/route.ts', name: 'route.ts', type: 'file', isRelevant: true, category: 'api', tokenEstimate: 410 },
      ],
      detectedRoutes: [
        { path: '/portal/login', type: 'auth-route', fileSource: 'app/portal/login/page.tsx', description: 'Patient 2FA authentication & OTP verification' },
        { path: '/portal/dashboard', type: 'protected', fileSource: 'app/portal/dashboard/page.tsx', description: 'Upcoming appointments, lab results, prescriptions' },
        { path: '/portal/book-appointment', type: 'protected', fileSource: 'app/portal/book-appointment/page.tsx', description: 'Multi-step doctor selection, date/time slot picker, reason for visit' },
        { path: '/api/appointments', type: 'api', method: 'GET / POST', fileSource: 'app/api/appointments/route.ts', description: 'Query available doctor slots, book confirmed appointment' },
      ],
      sampleCodeSnippets: {
        'app/portal/book-appointment/page.tsx': `export default function BookAppointmentPage() {\n  return <BookingWizard steps={['Specialty', 'Doctor', 'TimeSlot', 'Confirm']} />;\n}`
      }
    }
  }
];
