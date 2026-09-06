import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const PRIMARY_ADMIN_EMAIL = process.env.PRIMARY_ADMIN_EMAIL || 'hammedolawumiolawumi@gmail.com';

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Password hashing utilities using Node.js crypto
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash: h, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const h = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}

// In-memory active tokens
const adminSessions = new Set<string>();
const userSessions = new Map<string, string>(); // token -> userId

// Database schema
interface DBData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'student' | 'buyer' | 'business' | 'admin';
    avatarUrl?: string;
    campusLocation: string;
    matricNumber?: string;
    isMatricVerified?: boolean;
    department?: string;
    faculty?: string;
    businessName?: string;
    isBusinessVerified?: boolean;
    isProMember?: boolean;
    isBanned?: boolean;
    createdAt: string;
    passwordHash: string;
    passwordSalt: string;
  }>;
  products: Array<{
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    category: string;
    description: string;
    imageUrl: string;
    additionalImages?: string[];
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
    sellerRole: string;
    sellerMatricVerified?: boolean;
    sellerMatricNumber?: string;
    sellerBusinessName?: string;
    sellerBusinessVerified?: boolean;
    campusLocation: string;
    condition: string;
    isSubscription?: boolean;
    subscriptionDuration?: string;
    isFeatured?: boolean;
    featuredExpiresAt?: string;
    isSold?: boolean;
    isExpired?: boolean;
    isApproved?: boolean;
    viewsCount: number;
    inquiriesCount: number;
    createdAt: string;
    tags?: string[];
  }>;
  complaints: Array<{
    id: string;
    userId?: string;
    userName: string;
    userPhone: string;
    category: string;
    title: string;
    description: string;
    listingId?: string;
    accusedSellerName?: string;
    status: 'Open' | 'Under Investigation' | 'Resolved' | 'Dismissed';
    adminReply?: string;
    adminRepliedAt?: string;
    createdAt: string;
  }>;
  admin: {
    username: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    lastUpdated: string;
  };
  settings: {
    siteName: string;
    officialPhone: string;
    listingModerationEnabled: boolean;
    registrationEnabled: boolean;
  };
}

// Initialize clean database without any fake/demo users, products or demo complaints
function loadDB(): DBData {
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Ensure structure
      if (!parsed.users) parsed.users = [];
      if (!parsed.products) parsed.products = [];
      if (!parsed.complaints) parsed.complaints = [];
      if (!parsed.admin || parsed.admin.email === 'admin@unilorinmini.edu.ng') {
        const { hash, salt } = hashPassword('Admin@UnilorinMini2026!');
        parsed.admin = {
          username: 'cio_admin',
          email: PRIMARY_ADMIN_EMAIL,
          passwordHash: hash,
          passwordSalt: salt,
          lastUpdated: new Date().toISOString(),
        };
      }
      if (!parsed.settings) {
        parsed.settings = {
          siteName: "C'IO — University of Ilorin Mini Campus Marketplace",
          officialPhone: '09076930244',
          listingModerationEnabled: false,
          registrationEnabled: true,
        };
      }
      return parsed;
    } catch (e) {
      console.error('Error reading DB, resetting to clean state', e);
    }
  }

  // Clean initialization
  const { hash, salt } = hashPassword('Admin@UnilorinMini2026!');
  const cleanDB: DBData = {
    users: [],
    products: [],
    complaints: [],
    admin: {
      username: 'cio_admin',
      email: PRIMARY_ADMIN_EMAIL,
      passwordHash: hash,
      passwordSalt: salt,
      lastUpdated: new Date().toISOString(),
    },
    settings: {
      siteName: "C'IO — University of Ilorin Mini Campus Marketplace",
      officialPhone: '09076930244',
      listingModerationEnabled: false,
      registrationEnabled: true,
    },
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(cleanDB, null, 2), 'utf-8');
  return cleanDB;
}

let db: DBData = loadDB();

function saveDB(dataToSave?: DBData) {
  if (dataToSave) db = dataToSave;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Ensure uploads directory exists and is statically served
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '7d',
    immutable: true,
  }));

  // ==========================================
  // FAST IMAGE UPLOAD API
  // ==========================================
  app.post('/api/upload', (req, res) => {
    try {
      const { imageBase64, filename, sizeKb } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'No image data provided' });
      }

      let mimeType = 'image/jpeg';
      let base64Content = imageBase64;

      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([A-Za-z0-9\/+-]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({ error: 'Invalid data URI format' });
        }
        mimeType = matches[1].toLowerCase();
        base64Content = matches[2];
      }

      // Strict JPG/JPEG validation
      if (!mimeType.includes('jpeg') && !mimeType.includes('jpg')) {
        return res.status(400).json({ error: 'Only JPG or JPEG images are permitted.' });
      }

      const buffer = Buffer.from(base64Content, 'base64');
      const calculatedKb = Math.round(buffer.length / 1024);

      // Strict 300 KB limit validation
      if (buffer.length > 300 * 1024) {
        return res.status(400).json({
          error: `Image exceeds the 300 KB limit (currently ${calculatedKb} KB). Please compress or resize the photo.`,
        });
      }

      const sanitizedName = (filename || 'item')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const uniqueName = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${sanitizedName}.jpg`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      return res.json({
        success: true,
        url: publicUrl,
        filename: uniqueName,
        sizeKb: calculatedKb,
      });
    } catch (err: any) {
      console.error('Upload processing error:', err);
      return res.status(500).json({ error: err.message || 'Failed to save uploaded image' });
    }
  });

  // Middleware to authenticate admin
  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (!token || !adminSessions.has(token)) {
      return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
    }
    next();
  }

  // Middleware to authenticate user
  function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = (req.headers['x-user-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (!token || !userSessions.has(token)) {
      return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
    const userId = userSessions.get(token);
    const user = db.users.find((u) => u.id === userId);
    if (!user || user.isBanned) {
      return res.status(403).json({ error: 'Account suspended or not found.' });
    }
    (req as any).currentUser = user;
    next();
  }

  // Optional user authentication
  function optionalUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = (req.headers['x-user-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (token && userSessions.has(token)) {
      const userId = userSessions.get(token);
      const user = db.users.find((u) => u.id === userId);
      if (user && !user.isBanned) {
        (req as any).currentUser = user;
      }
    }
    next();
  }

  // ==========================================
  // PUBLIC SETTINGS
  // ==========================================
  app.get('/api/settings', (req, res) => {
    res.json(db.settings);
  });

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  app.post('/api/admin/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Admin username/email and password are required.' });
    }

    const trimmedIdentifier = usernameOrEmail.trim().toLowerCase();
    const isMatch =
      (trimmedIdentifier === db.admin.username.toLowerCase() ||
        trimmedIdentifier === db.admin.email.toLowerCase() ||
        trimmedIdentifier === PRIMARY_ADMIN_EMAIL.toLowerCase()) &&
      verifyPassword(password, db.admin.passwordHash, db.admin.passwordSalt);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = 'adm_' + crypto.randomBytes(32).toString('hex');
    adminSessions.add(token);

    res.json({
      success: true,
      token,
      admin: {
        username: db.admin.username,
        email: db.admin.email,
        role: 'admin',
      },
    });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const token = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (token) adminSessions.delete(token);
    res.json({ success: true });
  });

  app.get('/api/admin/verify', (req, res) => {
    const token = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (token && adminSessions.has(token)) {
      return res.json({
        valid: true,
        admin: {
          username: db.admin.username,
          email: db.admin.email,
          role: 'admin',
        },
      });
    }
    res.status(401).json({ valid: false });
  });

  // Change admin password securely
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (!verifyPassword(currentPassword, db.admin.passwordHash, db.admin.passwordSalt)) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    db.admin.passwordHash = hash;
    db.admin.passwordSalt = salt;
    db.admin.lastUpdated = new Date().toISOString();
    saveDB();

    res.json({ success: true, message: 'Admin password updated successfully.' });
  });

  // Update website settings
  app.patch('/api/admin/settings', requireAdmin, (req, res) => {
    const { listingModerationEnabled, siteName, officialPhone, registrationEnabled } = req.body;
    if (typeof listingModerationEnabled === 'boolean') {
      db.settings.listingModerationEnabled = listingModerationEnabled;
    }
    if (typeof registrationEnabled === 'boolean') {
      db.settings.registrationEnabled = registrationEnabled;
    }
    if (siteName) db.settings.siteName = siteName;
    if (officialPhone) db.settings.officialPhone = officialPhone;
    saveDB();
    res.json({ success: true, settings: db.settings });
  });

  // ==========================================
  // USER AUTHENTICATION & MANAGEMENT
  // ==========================================
  app.post('/api/auth/register', (req, res) => {
    if (!db.settings.registrationEnabled) {
      return res.status(403).json({ error: 'User registration is temporarily paused by administration.' });
    }

    const {
      name,
      email,
      phone,
      password,
      role = 'student',
      campusLocation,
      matricNumber,
      faculty,
      department,
      businessName,
      avatarUrl,
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone number (WhatsApp), and password are required.' });
    }

    // Check if phone or email already registered
    const trimmedPhone = phone.replace(/[^0-9]/g, '');
    const existing = db.users.find(
      (u) =>
        u.phone.replace(/[^0-9]/g, '') === trimmedPhone ||
        (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase())
    );
    if (existing) {
      return res.status(400).json({ error: 'An account with this phone number or email is already registered.' });
    }

    const { hash, salt } = hashPassword(password);
    const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone.trim(),
      role: (role === 'business' || role === 'buyer' ? role : 'student') as 'student' | 'buyer' | 'business',
      avatarUrl:
        avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      campusLocation: campusLocation || 'Mini Campus Main Gate',
      matricNumber: matricNumber ? matricNumber.trim().toUpperCase() : undefined,
      isMatricVerified: false,
      department: department ? department.trim() : undefined,
      faculty: faculty ? faculty.trim() : undefined,
      businessName: businessName ? businessName.trim() : undefined,
      isBusinessVerified: false,
      isProMember: false,
      isBanned: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
      passwordHash: hash,
      passwordSalt: salt,
    };

    db.users.push(newUser);
    saveDB();

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userSessions.set(token, newUser.id);

    // Return sanitized user
    const { passwordHash, passwordSalt, ...safeUser } = newUser;
    res.json({ success: true, token, user: safeUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide your email/phone and password.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (cleanDigits && u.phone.replace(/[^0-9]/g, '').includes(cleanDigits)) ||
        (u.matricNumber && u.matricNumber.toLowerCase() === cleanId)
    );

    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please check your credentials or register.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended by the campus administrator.' });
    }

    if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userSessions.set(token, user.id);

    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = (req.headers['x-user-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    if (token) userSessions.delete(token);
    res.json({ success: true });
  });

  app.get('/api/auth/me', requireUser, (req, res) => {
    const user = (req as any).currentUser;
    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.patch('/api/auth/profile', requireUser, (req, res) => {
    const user = (req as any).currentUser;
    const { name, phone, email, avatarUrl, campusLocation, matricNumber, faculty, department, businessName } = req.body;

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (email !== undefined) user.email = email.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (campusLocation) user.campusLocation = campusLocation;
    if (matricNumber !== undefined) {
      user.matricNumber = matricNumber.trim().toUpperCase();
      user.isMatricVerified = false; // re-verify on matric edit
    }
    if (faculty !== undefined) user.faculty = faculty.trim();
    if (department !== undefined) user.department = department.trim();
    if (businessName !== undefined) user.businessName = businessName.trim();

    // Also update sellerName / sellerPhone in this user's active products
    db.products.forEach((p) => {
      if (p.sellerId === user.id) {
        if (name) p.sellerName = user.name;
        if (phone) p.sellerPhone = user.phone;
        if (campusLocation) p.campusLocation = user.campusLocation;
      }
    });

    saveDB();
    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // ADMIN USER MANAGEMENT
  // ==========================================
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const safeUsers = db.users.map(({ passwordHash, passwordSalt, ...u }) => u);
    res.json(safeUsers);
  });

  app.patch('/api/admin/users/:id/suspend', requireAdmin, (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isBanned = !user.isBanned;
    saveDB();
    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    // Also remove their products
    db.products = db.products.filter((p) => p.sellerId !== req.params.id);
    db.users.splice(idx, 1);
    saveDB();

    res.json({ success: true, message: 'User and all their listings removed permanently.' });
  });

  app.patch('/api/admin/users/:id/verify-matric', requireAdmin, (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isMatricVerified = req.body.isVerified !== undefined ? req.body.isVerified : !user.isMatricVerified;
    // update their active products
    db.products.forEach((p) => {
      if (p.sellerId === user.id) {
        p.sellerMatricVerified = user.isMatricVerified;
      }
    });
    saveDB();

    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // PRODUCTS & LISTINGS
  // ==========================================
  app.get('/api/products', optionalUser, (req, res) => {
    const user = (req as any).currentUser;
    const isAdmin = Boolean((req.headers['x-admin-token'] as string) && adminSessions.has(req.headers['x-admin-token'] as string));

    if (isAdmin) {
      return res.json(db.products);
    }

    // Public only sees active, unexpired, non-banned-seller products (and approved if moderation is enabled)
    const bannedUserIds = new Set(db.users.filter((u) => u.isBanned).map((u) => u.id));
    const visibleProducts = db.products.filter((p) => {
      if (bannedUserIds.has(p.sellerId)) return false;
      if (db.settings.listingModerationEnabled && p.isApproved === false) {
        // Seller can always see their own pending products
        return user && user.id === p.sellerId;
      }
      return true;
    });

    res.json(visibleProducts);
  });

  app.post('/api/products', requireUser, (req, res) => {
    const user = (req as any).currentUser;
    const {
      title,
      price,
      originalPrice,
      category,
      description,
      imageUrl,
      additionalImages,
      campusLocation,
      condition,
      isSubscription,
      subscriptionDuration,
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ error: 'Title, price, and category are required.' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Valid price is required.' });
    }

    const productId = 'prod_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newProduct = {
      id: productId,
      title: title.trim(),
      price: numPrice,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      category: category.trim(),
      description: description ? description.trim() : 'Available on University of Ilorin Mini Campus. Contact on WhatsApp.',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      additionalImages: additionalImages || [],
      sellerId: user.id,
      sellerName: user.name,
      sellerPhone: user.phone,
      sellerRole: user.role,
      sellerMatricVerified: user.isMatricVerified,
      sellerMatricNumber: user.matricNumber,
      sellerBusinessName: user.businessName,
      sellerBusinessVerified: user.isBusinessVerified,
      campusLocation: campusLocation || user.campusLocation || 'University of Ilorin Mini Campus',
      condition: condition || 'Like New',
      isSubscription: Boolean(isSubscription),
      subscriptionDuration: isSubscription ? subscriptionDuration || 'Monthly' : undefined,
      isFeatured: false,
      isSold: false,
      isExpired: false,
      isApproved: !db.settings.listingModerationEnabled,
      viewsCount: 1,
      inquiriesCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
    };

    db.products.unshift(newProduct);
    saveDB();

    res.json({ success: true, product: newProduct });
  });

  // Edit product (Owner or Admin)
  app.put('/api/products/:id', (req, res) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    const isAdmin = Boolean(adminToken && adminSessions.has(adminToken));

    const userToken = (req.headers['x-user-token'] as string);
    const userId = userToken ? userSessions.get(userToken) : null;

    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (!isAdmin && (!userId || product.sellerId !== userId)) {
      return res.status(403).json({ error: 'You do not have permission to edit this product.' });
    }

    const {
      title,
      price,
      originalPrice,
      category,
      description,
      imageUrl,
      additionalImages,
      campusLocation,
      condition,
      isSubscription,
      subscriptionDuration,
      isSold,
      isExpired,
      isFeatured,
      isApproved,
    } = req.body;

    if (title) product.title = title.trim();
    if (price !== undefined) {
      const p = parseFloat(price);
      if (!isNaN(p)) product.price = p;
    }
    if (originalPrice !== undefined) product.originalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    if (category) product.category = category;
    if (description !== undefined) product.description = description.trim();
    if (imageUrl) product.imageUrl = imageUrl;
    if (additionalImages) product.additionalImages = additionalImages;
    if (campusLocation) product.campusLocation = campusLocation;
    if (condition) product.condition = condition;
    if (isSubscription !== undefined) product.isSubscription = Boolean(isSubscription);
    if (subscriptionDuration) product.subscriptionDuration = subscriptionDuration;
    if (isSold !== undefined) product.isSold = Boolean(isSold);
    if (isExpired !== undefined) product.isExpired = Boolean(isExpired);
    if (isAdmin && isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isAdmin && isApproved !== undefined) product.isApproved = Boolean(isApproved);

    saveDB();
    res.json({ success: true, product });
  });

  // Delete product (Owner or Admin)
  app.delete('/api/products/:id', (req, res) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    const isAdmin = Boolean(adminToken && adminSessions.has(adminToken));

    const userToken = (req.headers['x-user-token'] as string);
    const userId = userToken ? userSessions.get(userToken) : null;

    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found.' });

    const product = db.products[idx];
    if (!isAdmin && (!userId || product.sellerId !== userId)) {
      return res.status(403).json({ error: 'You do not have permission to delete this product.' });
    }

    db.products.splice(idx, 1);
    saveDB();

    res.json({ success: true, message: 'Product removed permanently.' });
  });

  // Toggle expire/sold/featured
  app.patch('/api/products/:id/status', (req, res) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    const isAdmin = Boolean(adminToken && adminSessions.has(adminToken));

    const userToken = (req.headers['x-user-token'] as string);
    const userId = userToken ? userSessions.get(userToken) : null;

    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (!isAdmin && (!userId || product.sellerId !== userId)) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const { isExpired, isSold, isFeatured, isApproved } = req.body;
    if (isExpired !== undefined) product.isExpired = Boolean(isExpired);
    if (isSold !== undefined) product.isSold = Boolean(isSold);
    if (isAdmin && isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isAdmin && isApproved !== undefined) product.isApproved = Boolean(isApproved);

    saveDB();
    res.json({ success: true, product });
  });

  // Increment views / inquiries
  app.post('/api/products/:id/inquiry', (req, res) => {
    const product = db.products.find((p) => p.id === req.params.id);
    if (product) {
      product.inquiriesCount = (product.inquiriesCount || 0) + 1;
      saveDB();
    }
    res.json({ success: true });
  });

  app.post('/api/products/:id/view', (req, res) => {
    const product = db.products.find((p) => p.id === req.params.id);
    if (product) {
      product.viewsCount = (product.viewsCount || 0) + 1;
      saveDB();
    }
    res.json({ success: true });
  });

  // ==========================================
  // COMPLAINTS & REPORTS
  // ==========================================
  app.get('/api/reports', (req, res) => {
    const adminToken = (req.headers['x-admin-token'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string);
    const isAdmin = Boolean(adminToken && adminSessions.has(adminToken));

    const userToken = (req.headers['x-user-token'] as string);
    const userId = userToken ? userSessions.get(userToken) : null;

    if (isAdmin) {
      return res.json(db.complaints);
    }

    if (userId) {
      const user = db.users.find((u) => u.id === userId);
      const userComplaints = db.complaints.filter(
        (c) => c.userId === userId || (user && c.userPhone === user.phone)
      );
      return res.json(userComplaints);
    }

    res.json([]);
  });

  app.post('/api/reports', optionalUser, (req, res) => {
    const user = (req as any).currentUser;
    const { userName, userPhone, category, title, description, listingId, accusedSellerName } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and issue details are required.' });
    }

    const ticketId = 'tkt_' + Math.floor(1000 + Math.random() * 9000);
    const newTicket = {
      id: ticketId,
      userId: user ? user.id : undefined,
      userName: userName ? userName.trim() : (user ? user.name : 'Anonymous Student'),
      userPhone: userPhone ? userPhone.trim() : (user ? user.phone : '09076930244'),
      category: category || 'Other Complaints',
      title: title.trim(),
      description: description.trim(),
      listingId: listingId || undefined,
      accusedSellerName: accusedSellerName ? accusedSellerName.trim() : undefined,
      status: 'Open' as const,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    db.complaints.unshift(newTicket);
    saveDB();

    res.json({ success: true, ticket: newTicket });
  });

  app.patch('/api/admin/reports/:id/resolve', requireAdmin, (req, res) => {
    const ticket = db.complaints.find((c) => c.id === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Report not found.' });

    const { reply, status } = req.body;
    if (reply !== undefined) ticket.adminReply = reply.trim();
    if (status) ticket.status = status;
    ticket.adminRepliedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    saveDB();
    res.json({ success: true, ticket });
  });

  app.delete('/api/admin/reports/:id', requireAdmin, (req, res) => {
    const idx = db.complaints.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Report not found.' });

    db.complaints.splice(idx, 1);
    saveDB();
    res.json({ success: true });
  });

  // ==========================================
  // VITE MIDDLEWARE / PRODUCTION STATIC
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`C'IO University of Ilorin Mini Campus Marketplace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
