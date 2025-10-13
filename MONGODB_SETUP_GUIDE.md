# MongoDB Setup Guide for NISMSTUDY.COM

This guide will help you set up MongoDB for your NISM Study website. You have two options: **Local MongoDB** or **MongoDB Atlas (Cloud)**.

## 📋 Table of Contents
1. [Option 1: Local MongoDB Installation](#option-1-local-mongodb-installation-windows)
2. [Option 2: MongoDB Atlas (Cloud - Recommended for Beginners)](#option-2-mongodb-atlas-cloud---recommended)
3. [Connecting to MongoDB](#connecting-to-mongodb)
4. [Initialize Database with Admin User](#initialize-database-with-admin-user)
5. [Troubleshooting](#troubleshooting)

---

## Option 1: Local MongoDB Installation (Windows)

### Step 1: Download MongoDB

1. Visit: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0 or higher)
   - Platform: Windows
   - Package: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. **Install MongoDB as a Service**: ✅ Check this option
4. Install **MongoDB Compass** (GUI tool): ✅ Check this option
5. Click **Install**

### Step 3: Verify Installation

Open Command Prompt or PowerShell and run:

```bash
mongod --version
```

You should see the MongoDB version information.

### Step 4: Start MongoDB Service

MongoDB should start automatically as a service. To verify:

```bash
# Check if MongoDB service is running
net start MongoDB

# If not running, start it:
net start MongoDB
```

### Step 5: Configure Environment Variables (Optional)

Add MongoDB to your system PATH:

1. Search for "Environment Variables" in Windows
2. Click "Environment Variables"
3. Under "System Variables", find and select "Path"
4. Click "Edit"
5. Add: `C:\Program Files\MongoDB\Server\7.0\bin`
6. Click OK

### Step 6: Update .env File

In your project's `.env` file, use:

```env
MONGODB_URI=mongodb://localhost:27017/nismstudy
```

---

## Option 2: MongoDB Atlas (Cloud - Recommended)

### Why MongoDB Atlas?
- ✅ Free tier (512 MB storage)
- ✅ No installation required
- ✅ Automatic backups
- ✅ Access from anywhere
- ✅ Perfect for production

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email or Google account
3. Verify your email

### Step 2: Create a Free Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"Shared"** (Free tier)
3. Select:
   - Provider: **AWS** or **Google Cloud**
   - Region: Choose closest to you (e.g., Mumbai for India)
   - Cluster Name: `nismstudy-cluster` (or any name)
4. Click **"Create"** (will take 3-5 minutes)

### Step 3: Create Database User

1. On the Security page, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `nismadmin`
5. Click **"Autogenerate Secure Password"** and SAVE THIS PASSWORD
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Whitelist Your IP Address

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Either:
   - Click **"Allow Access from Anywhere"** (easier for development)
   - Or click **"Add Current IP Address"** (more secure)
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Choose:
   - Driver: **Node.js**
   - Version: **4.1 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://nismadmin:<password>@cluster0.xxxxx.mongodb.net/
   ```

### Step 6: Update .env File

Replace `<password>` with your actual database user password:

```env
MONGODB_URI=mongodb+srv://nismadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nismstudy?retryWrites=true&w=majority
```

**Important:** Replace:
- `YOUR_PASSWORD` with the password you saved
- `cluster0.xxxxx` with your actual cluster URL

---

## Connecting to MongoDB

### Test Your Connection

1. Open Command Prompt or PowerShell
2. Navigate to your project folder:
   ```bash
   cd c:\Users\croma\nismstudy-website
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Look for these messages:
   ```
   ✅ MongoDB Connected: localhost (or Atlas cluster)
   📊 Database Name: nismstudy
   🚀 Server running on port 5000
   ```

If you see these messages, your MongoDB is connected successfully! ✅

---

## Initialize Database with Admin User

Once connected, you need to create an admin user to access the admin panel.

### Method 1: Using the Initialization Script

Run this command:

```bash
npm run init-db
```

This will create:
- Admin user (admin@nismstudy.com / Admin@123456)
- Sample course
- Sample study materials

### Method 2: Manual Creation via MongoDB Compass

1. Open **MongoDB Compass**
2. Connect to your database:
   - Local: `mongodb://localhost:27017`
   - Atlas: Use your connection string
3. Create a new database: `nismstudy`
4. Create a collection: `users`
5. Insert a document:

```json
{
  "name": "Admin",
  "email": "admin@nismstudy.com",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "admin",
  "isActive": true,
  "purchasedCourses": [],
  "createdAt": {"$date": "2025-01-01T00:00:00.000Z"}
}
```

**Note:** For password hashing, use the init-db script (Method 1).

---

## Verification Checklist

Before using the application, verify:

- [ ] MongoDB is running (check service or Atlas dashboard)
- [ ] Connection string in `.env` is correct
- [ ] Server starts without errors
- [ ] You see "✅ MongoDB Connected" message
- [ ] Admin user is created
- [ ] You can login at: http://localhost:5000/login.html

---

## Troubleshooting

### Error: "MongoServerError: bad auth"

**Solution:** Check your MongoDB Atlas username and password in the connection string.

### Error: "MongooseServerSelectionError"

**Solutions:**
1. **For Local MongoDB:**
   - Verify MongoDB service is running: `net start MongoDB`
   - Check if port 27017 is not blocked by firewall

2. **For MongoDB Atlas:**
   - Verify your IP address is whitelisted
   - Check internet connection
   - Ensure connection string is correct

### Error: "ECONNREFUSED"

**Solution:** MongoDB is not running.
- **Local:** Start MongoDB service: `net start MongoDB`
- **Atlas:** Check if cluster is active (not paused)

### Can't Login to Admin Panel

**Solution:**
1. Run the initialization script: `npm run init-db`
2. Verify admin user exists in database:
   - Email: admin@nismstudy.com
   - Password: Admin@123456

### Connection String Format Issues

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/nismstudy
```

**MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nismstudy
```

⚠️ **Common mistakes:**
- Missing database name at the end
- Special characters in password not URL-encoded
- Wrong cluster URL

---

## Using MongoDB Compass (GUI)

MongoDB Compass is a visual tool to manage your database:

### Connect to Database:

**Local:**
```
mongodb://localhost:27017
```

**Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/
```

### Useful Features:
- View all collections (users, courses, quizzes, etc.)
- Browse and edit documents
- Run queries
- Import/Export data
- Performance monitoring

---

## Production Recommendations

For production deployment:

1. ✅ Use MongoDB Atlas (not local MongoDB)
2. ✅ Enable backup in Atlas settings
3. ✅ Use strong passwords
4. ✅ Restrict IP access (don't use "Allow from Anywhere")
5. ✅ Enable MongoDB encryption
6. ✅ Monitor database performance
7. ✅ Set up alerts in Atlas

---

## Next Steps

After setting up MongoDB:

1. ✅ Start the server: `npm start`
2. ✅ Initialize database: `npm run init-db`
3. ✅ Login as admin: http://localhost:5000/login.html
4. ✅ Upload your study materials
5. ✅ Create courses and quizzes
6. ✅ Test student registration and login

---

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com/
- MongoDB Atlas Help: https://www.mongodb.com/docs/atlas/
- Community Forums: https://www.mongodb.com/community/forums/

---

## Quick Reference

### Useful Commands

```bash
# Start MongoDB (Windows)
net start MongoDB

# Stop MongoDB (Windows)
net stop MongoDB

# Check MongoDB status
mongo --eval "db.adminCommand('ping')"

# Initialize database
npm run init-db

# Start development server
npm start

# Start with auto-reload
npm run dev
```

### Default Ports

- MongoDB: 27017
- Application Server: 5000

### Default Admin Credentials

- Email: admin@nismstudy.com
- Password: Admin@123456

⚠️ **Change these in production!**

---

**Good luck with your NISM Study platform! 🚀**



