# PaziaTech

<p align="center">
  <strong>Build your online shop. Share your products. Sell online.</strong>
</p>

<p align="center">
  A multi-tenant SaaS e-commerce platform built for businesses in Kenya.
</p>

<p align="center">
  <a href="https://paziatech.co.ke/">Live Website</a> ·
  <a href="https://yobra.paziatech.co.ke/">Demo Shop</a> ·
  <a href="https://lawrence-taupe.vercel.app/">Portfolio</a>
</p>

---

## Overview

PaziaTech allows businesses to create and manage their own online shops without building an e-commerce system from scratch.

Businesses can manage products, customers, orders and delivery options, while customers can browse products and complete purchases through the storefront.

The platform is built as a **multi-tenant SaaS application**, allowing multiple shops to operate independently on the same platform.

## Features

* 🛍️ Multi-tenant online shops
* 📦 Product and inventory management
* 🧾 Order management
* 💳 M-Pesa-powered checkout
* 🔐 Authentication and role-based access control
* 👤 Customer and shop-owner accounts
* 🚚 Delivery configuration
* 📱 Responsive storefronts
* 🔗 Dedicated shop links

## Tech Stack

| Area           | Technologies                             |
| -------------- | ---------------------------------------- |
| Frontend       | Next.js, React, TypeScript, Tailwind CSS |
| Backend        | Next.js APIs, REST APIs                  |
| Database       | MySQL, SQL                               |
| Authentication | Supabase Auth, Google OAuth, Email OTP   |
| Infrastructure | Docker, Linux / Ubuntu                   |
| Development    | Git, GitHub, pnpm                        |

## Architecture

```text
                    ┌─────────────────┐
                    │     Customer    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Next.js      │
                    │   Application   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐       ┌────────────────┐
        │ Authentication│       │ Tenant / Shop  │
        │    & RBAC     │       │    Access      │
        └───────────────┘       └───────┬────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   Application    │
                              │      APIs        │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │      MySQL       │
                              │     Database     │
                              └──────────────────┘
```

## Key Engineering Work

* Built the application from the ground up using Next.js and TypeScript.
* Implemented multi-tenant access control and role-based permissions.
* Designed database-driven product, shop, customer and order workflows.
* Integrated M-Pesa payments and external services.
* Built responsive customer storefronts and shop management interfaces.
* Containerized applications with Docker.
* Deployed and maintained applications on Linux environments.
* Configured production domains and SSL.
* Maintained and improved the platform through ongoing production development.

## Getting Started

### Requirements

* Node.js
* pnpm
* MySQL
* Git

### Installation

```bash
git clone <repository-url>

cd <project-directory>

pnpm install
```

Create a `.env.local` file with the required database, authentication and API configuration.

Then start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```




## Links

**Website:** https://paziatech.co.ke/
**Demo Shop:** https://yobra.paziatech.co.ke/
**Portfolio:** https://lawrence-taupe.vercel.app/
**GitHub:** https://github.com/Munene001/

---

**Lawrence Munene**
Full-Stack Software Engineer
