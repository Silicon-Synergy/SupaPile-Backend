SupaPile

📌 Project Description

SupaPile is a platform designed to help users save, organize, and manage links into categorized "piles." It allows users to keep track of important web content, share their piles, and control privacy settings for better organization and accessibility.

🚀 Features

Create, Read, Update, and Delete (CRUD) Piles

Metadata Extraction - Automatically fetches Open Graph metadata for saved links.

Pagination - Efficiently loads and navigates large lists of links.

Soft Delete & Archive - Recover deleted piles when needed.

Privacy & Sharing - Control who can view your piles (Coming soon).
User Authentication - Secure login system.


🛠️ Tech Stack

Backend: Node.js, Express.js, MongoDB

Authentication: JWT

Hosting: Railway

Frontend React.js


⚡ Getting Started

Prerequisites

Install Node.js & MongoDB

Set up environment variables (.env file)

Installation

# Clone the repository
git clone https://github.com/yourusername/supapile.git
cd supapile

# Install dependencies
npm install

# Start the development server
npm run dev

📡 API Endpoints

Authentication

POST /api/auth/register - Register a new user

POST /api/auth/login - Login user

Piles

POST /api/piles - Create a new pile

GET /api/piles - Get all piles

DELETE /api/piles/****:id - Soft delete a pile
