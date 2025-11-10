#!/bin/bash

echo "🚀 Setting up College Event Management System..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update server/.env with your college email domain:"
echo "   COLLEGE_EMAIL_DOMAIN=@yourcollege.edu"
echo ""
echo "2. Start the application:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""

