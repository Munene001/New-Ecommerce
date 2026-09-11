PaziaTech

Multi-tenant SaaS e-commerce platform for Kenyan businesses.

PaziaTech allows businesses to create their own online shops, manage products and orders, and accept M-Pesa-powered payments without needing to build an e-commerce website from scratch.

Live: https://paziatech.co.ke/
Demo Shop: https://yobra.paziatech.co.ke/

Features
Multi-tenant online shops
Product and inventory management
Order management
M-Pesa-powered checkout
Authentication and role-based access control
Shop owner dashboard
Customer storefronts
Delivery configuration
Responsive UI
Tech Stack
Frontend: Next.js, React, TypeScript, Tailwind CSS
Backend: Next.js APIs, REST APIs
Database: MySQL, SQL
Authentication: Supabase Auth, Google OAuth, Email OTP
Infrastructure: Docker, Linux/Ubuntu
Tools: Git, GitHub, Vercel
Architecture

PaziaTech uses a multi-tenant architecture where multiple businesses operate on the same platform while their data and access remain separated.

User
  ↓
Next.js Application
  ↓
Authentication & RBAC
  ↓
Tenant / Shop Access
  ↓
Application APIs
  ↓
MySQL Database
Key Engineering Work
Built the platform from the ground up using Next.js and TypeScript.
Implemented multi-tenant access control and role-based permissions.
Designed database-driven product, shop, customer, and order workflows.
Integrated M-Pesa-powered payments and third-party services.
Containerized and deployed applications using Docker and Linux.
Configured production environments, domains, and SSL.
Continuously maintain and improve the platform in production.
Development
git clone <repository-url>
cd <project-directory>
pnpm install
pnpm dev

Create a .env.local file with the required database, authentication, and API credentials.

Never commit secrets or production credentials to the repository.

Links
Website: https://paziatech.co.ke/
Demo Shop: https://yobra.paziatech.co.ke/
Portfolio: https://lawrence-taupe.vercel.app/
GitHub: https://github.com/Munene001
Author

Lawrence Munene
Full-Stack Software Engineer
