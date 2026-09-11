
PaziaTech 🛒
https://paziatech.co.ke/

Your Modern E-Commerce Solution.

PaziaTech is a full-featured e-commerce platform built to deliver a seamless shopping experience for customers and powerful management tools for store owners. From product discovery to checkout, PaziaTech handles it all.

📖 Table of Contents
About The Project

Key Features

Tech Stack

Getting Started

Usage

Project Structure

Roadmap

Contributing

License

Contact

🎯 About The Project
PaziaTech is an e-commerce web application designed to make online selling simple, fast, and scalable. It provides a complete storefront for customers and a robust admin dashboard for managing products, orders, and users.

Whether you're a small business owner or scaling up, PaziaTech gives you the tools to sell online with confidence.

Why PaziaTech?
Fast & Responsive: Optimized for speed and mobile-first shopping.

Secure Checkout: Integrated payment gateway with encrypted transactions.

Easy Management: Intuitive admin panel for products, orders, and inventory.

Scalable: Built to grow with your business.

✨ Key Features
🛍️ Customer Side
User registration & authentication (JWT / OAuth)

Product browsing with search, filters & categories

Product detail pages with images, reviews & ratings

Shopping cart & wishlist

Secure checkout with payment integration (Stripe / PayPal / M-Pesa)

Order tracking & history

Email notifications for orders

🛠️ Admin Side
Admin dashboard with sales analytics

Product management (CRUD)

Order management & status updates

User & role management

Inventory tracking

Discount codes & promotions

🛠 Tech Stack
Frontend:

React.js / Next.js

Tailwind CSS / Bootstrap

Redux Toolkit / Context API

Backend:

Node.js + Express.js

MongoDB / PostgreSQL

JWT Authentication

Stripe / PayPal API

DevOps & Tools:

Docker

Git & GitHub

Vercel / Render / AWS

🚀 Getting Started
Follow these steps to run PaziaTech locally.

Prerequisites
Make sure you have the following installed:

Node.js (v18+)

npm or yarn

MongoDB (local or Atlas)

Git

Installation
Clone the repository:

bash
git clone https://github.com/your-username/paziatech.git
cd paziatech
Install backend dependencies:

bash
cd server
npm install
Install frontend dependencies:

bash
cd ../client
npm install
Set up environment variables:

Create a .env file inside the server folder:

env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
CLIENT_URL=http://localhost:3000
Create a .env file inside the client folder:

env
REACT_APP_API_URL=http://localhost:5000/api
Run the backend:

bash
cd server
npm run dev
Run the frontend:

bash
cd client
npm start
Open your browser at http://localhost:3000
