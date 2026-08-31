# 🏨 Stayora - Hotel Booking Backend

Stayora Backend is a RESTful API built with Node.js and Express.js for managing users, authentication, hotels, hotel images, amenities, bookings, and payments.

The backend provides secure authentication, Google OAuth, hotel management, booking management, Razorpay payment integration, Cloudinary image uploads, and MySQL database integration.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User Registration & Login
- JWT Authentication
- Google OAuth Login
- Protected Routes
- Role-Based Access Control
- Email OTP Verification
- Forgot Password
- Reset Password with OTP
- Change Password
- Secure HTTP-only Cookies
- User Profile Management

### 🏨 Hotel Management
- Create Hotels
- Update Hotels
- Delete Hotels
- Get All Hotels
- Get Hotel by ID
- Search Hotels by Location
- Hotel Amenities Management
- Hotel Availability Management

### 🖼️ Image Management
- Cloudinary Integration
- Hotel Image Upload
- Multiple Hotel Images
- Image Delete
- Public ID Management

### 📅 Booking Management
- Create Hotel Bookings
- Check-in & Check-out
- Adults & Children
- Multiple Room Booking
- Automatic Total Price Calculation
- Get User Bookings
- Get Booking Details
- Booking Status Management
- Payment Status Management

### 💳 Payment
- Razorpay Integration
- Create Payment Orders
- Payment Verification
- Payment Status Tracking
- Webhook Event Handling
- Refund Support

### 🛡️ API Security
- JWT Authentication
- Protected API Routes
- Role-Based Authorization
- Request Validation
- Authentication Middleware
- Rate Limiting
- Environment Variables for Secrets

---

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- JavaScript (ES6+)
- RESTful APIs
- MVC Architecture

### Database
- MySQL
- MySQL2

### Authentication
- JWT
- Passport.js
- Google OAuth
- bcrypt

### Validation & Security
- Express Validator
- CORS
- Cookie Parser
- Rate Limiting

### File & Image Management
- Cloudinary
- Multer

### Payment
- Razorpay

### Email
- SMTP
- OTP Verification

### Deployment
- Render

### Database Hosting
- Railway MySQL

### Development Tools
- Git
- GitHub
- Postman
- VS Code
- npm

---

## 📂 Project Structure

```text
server/
│
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── google.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── booking.controller.js
│   └── hotel.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── auth.validation.js
│   ├── validation.middleware.js
│   └── ...
│
├── models/
│   ├── auth.model.js
│   ├── booking.model.js
│   ├── hotel.model.js
│   └── ...
│
├── routes/
│   ├── auth.routes.js
│   ├── booking.routes.js
│   ├── hotel.routes.js
│   └── ...
│
├── utils/
│   └── ...
│
├── .env
├── package.json
└── server.js
🗄️ Database

The backend uses MySQL for persistent data storage.

Main Tables
users
hotels
hotel_images
hotel_amenities
bookings
webhook_events
Relationships
users
  │
  └── bookings
          │
          └── hotels
                │
                ├── hotel_images
                │
                └── hotel_amenities
🔑 API Modules
Authentication
POST   /api/auth/register
POST   /api/auth/verify-otp
POST   /api/auth/resend-otp
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/forgot-password
POST   /api/auth/verify-reset-otp
POST   /api/auth/reset-password
Hotels
GET    /api/hotels
GET    /api/hotels/:id
POST   /api/hotels
PUT    /api/hotels/:id
DELETE /api/hotels/:id
Bookings
POST   /api/bookings
GET    /api/bookings/my-bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id

API routes may vary depending on the current backend route configuration.

🔐 Environment Variables

Create a .env file in the backend root directory.

PORT=5000

DB_HOST=your_mysql_host
DB_PORT=your_mysql_port
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_mysql_database

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razORPAY_key_secret

Never commit .env files, passwords, API keys, or secret credentials to GitHub.

▶️ Installation
1. Clone Repository
git clone YOUR_GITHUB_REPOSITORY_URL
cd server
2. Install Dependencies
npm install
3. Configure Environment Variables

Create a .env file and add the required credentials.

4. Start Development Server
npm run dev

The backend will run on:

http://localhost:5000
🌐 Deployment
Backend

The backend is deployed using:

Render

Database

The MySQL database is hosted using:

Railway

Production Backend
https://hotel-system-backend-8fyx.onrender.com
🧪 API Testing

API endpoints can be tested using:

Postman
Browser
Frontend Application

Authentication-protected endpoints require a valid JWT authentication token/cookie.

🔒 Security

The backend implements:

JWT-based authentication
HTTP-only cookies
Password hashing
OTP verification
Google OAuth authentication
Role-based authorization
Request validation
Rate limiting
CORS configuration
Secure environment variables
Razorpay payment verification
👨‍💻 Author

Girish Posture

GitHub:
https://github.com/girishposture1623

LinkedIn:
http://www.linkedin.com/in/girish-posture-148409374

📄 License

This project is developed for educational and portfolio purposes.
