import admin from 'firebase-admin';

// Initialize Firebase Admin — uses Application Default Credentials on App Engine,
// or GOOGLE_APPLICATION_CREDENTIALS env var for local development
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Whitelisted email addresses — only these users can access the app
const ALLOWED_EMAILS = [
  'info@macsoft.ai',
  'omar@macsoft.ai',
  // Add more demo users here
];

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // Whitelist check
    if (!ALLOWED_EMAILS.includes(decoded.email)) {
      return res.status(403).json({ error: 'Access denied. Email not authorized.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
