const jwt = require('jsonwebtoken')
const prisma = require('../config/db')

const protect = async (req, res, next) => {
  try {
    let token

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authorized. No token provided.' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ============================================
    // HANDLE SUPER ADMIN (from .env, not database)
    // ============================================
    if (decoded.role === 'SUPER_ADMIN') {
      req.user = {
        id: decoded.id,
        role: 'SUPER_ADMIN',
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@appvibe.com',
        name: 'Super Admin',
        username: process.env.SUPER_ADMIN_USERNAME || 'appVibe'
      }
      return next()
    }

    // ============================================
    // HANDLE REGULAR USERS (from database)
    // ============================================
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        isActive: true,
        clinicName: true,
        location: true,
        subsValidity: true
      }
    })

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account is inactive. Contact support.' 
      })
    }

    // Check subscription validity for ADMIN role
    if (user.role === 'ADMIN' && user.subsValidity) {
      if (new Date() > user.subsValidity) {
        return res.status(403).json({ 
          success: false, 
          error: 'Subscription expired. Please renew to continue.' 
        })
      }
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired. Please login again.' 
      })
    }
    console.error('Auth middleware error:', error)
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    })
  }
}

module.exports = { protect }