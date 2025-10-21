# 🎣 Ocean Track 360 (Fisheries Management System)

A **Full-Stack MERN Web Application** designed to modernize and automate fisheries operations.  
The system helps administrators, fishermen, and customers manage boats, trips, equipment, stock, sales, payments, and real-time environmental conditions — all from one centralized digital platform.

By combining a dynamic React interface, a powerful Node.js backend, and integrations like **Stripe payments**, **Google OAuth**, and **Gemini AI assistance**, the FMS bridges the gap between traditional fishery practices and digital transformation.

---

## 🌟 Brief Introduction

The **Fisheries Management System (FMS)** is a digital solution aimed at improving efficiency and transparency in fisheries.  
It allows stakeholders to:

- Register fishermen and manage fleets  
- Record fishing trips and catches  
- Sell and purchase fish products online  
- Handle financial records and payments securely  
- Monitor environmental conditions for safe fishing  
- Receive real-time notifications and AI-based assistance  

This project demonstrates how technology can empower sustainable fisheries and streamline day-to-day administrative work.

---

## ✨ Key Features

### 👥 Authentication & Users
- Secure login and registration using **JWT**
- **Google OAuth** integration
- Role-based access (Admin / Fisherman / Customer)
- User profile and session management

### 🛥️ Boat & Equipment Management
- Register and maintain boats and equipment
- Edit, delete, and view detailed records
- Assign resources to fishermen

### 🎣 Trip, Landing & Fish Stock
- Record and manage fishing trips and landings
- Maintain live fish stock and availability
- Fisherman and admin-level dashboards
- **Depth Sensor** data capture and visualization

### 🛒 Product Catalog & Sales
- Browse fish products with images and filters
- Add to **Cart**, proceed to **Checkout**
- Customer order history and invoice viewing
- **Review & Rating** system
- **Wishlist** functionality

### 💳 Payment Integration (Stripe)
- Secure online payments with **Stripe**
- Webhook integration for real-time updates
- Automated notifications upon successful payment
- Income records linked to sales transactions

### 📊 Finance & Reporting
- Manage **Income** and **Expenses**
- Generate **Sales Reports** with date filters
- Export **PDF** and **CSV** reports
- Real-time analytics on the dashboard

### 🔔 Communication & AI Support
- Real-time **Notifications**
- **Chatbot Widget** powered by **Gemini AI**
- AI assistant helps customers inquire about stock, orders, or services

### 🌦️ Weather Forecast & Depth Sensor
- **Open-Meteo API** integration for forecasts
- Display of wind, temperature, and precipitation data
- Helps fishermen plan safer trips

### 🧰 Utilities
- PDF export for invoices and reports
- Media uploads (images, documents)
- Protected routing and role-based access
- Clean, responsive UI built with **Tailwind CSS**

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite), Tailwind CSS, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT + Google OAuth |
| **Payments** | Stripe API |
| **AI Assistant** | Gemini (Google Generative AI) |
| **Weather Data** | Open-Meteo API |
| **Tooling** | ESLint, Prettier, Nodemon, PDF Exporter |

---

## ⚙️ Installation
<ol>
  <li><strong>Backend Setup</strong>
    <ul>
      <pre><code>cd Backend</code></pre>
      <pre><code>npm install</code></pre>
      <pre><code>npm start</code></pre>
    </ul>
  </li>

  <li><strong>Frontend Setup</strong>
    <ul>
      <pre><code>cd Frontend</code></pre>
      <pre><code>npm install</code></pre>
      <pre><code>npm run dev</code></pre>
    </ul>
  </li>
</ol>


### 1️⃣ Clone the Repo
```bash
git clone https://github.com/Charith-01/Fisheries-Management-System.git
cd Fisheries-Management-System

