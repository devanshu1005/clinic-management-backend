const prisma = require('../config/db')

// =============================================
// SUPER ADMIN DASHBOARD
// =============================================
exports.getSuperAdminDashboard = async (req, res, next) => {
  try {
    // Check if requester is Super Admin
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get all admin counts
    const [
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      expiredSubscriptions,
      expiringSoon
    ] = await Promise.all([
      // Total admins
      prisma.user.count({
        where: { role: 'ADMIN' }
      }),

      // Active admins
      prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true
        }
      }),

      // Inactive admins
      prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: false
        }
      }),

      // Expired subscriptions
      prisma.user.count({
        where: {
          role: 'ADMIN',
          subsValidity: {
            lt: now // Less than current date
          }
        }
      }),

      // Expiring within 1 week
      prisma.user.count({
        where: {
          role: 'ADMIN',
          subsValidity: {
            gte: now, // Greater than or equal to now
            lte: oneWeekFromNow // Less than or equal to 1 week from now
          }
        }
      })
    ])

    // Get list of admins expiring soon (for details)
    const adminsExpiringSoon = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        subsValidity: {
          gte: now,
          lte: oneWeekFromNow
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        isActive: true
      },
      orderBy: {
        subsValidity: 'asc' // Soonest expiring first
      }
    })

    // Get list of expired admins
    const expiredAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        subsValidity: {
          lt: now
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        isActive: true
      },
      orderBy: {
        subsValidity: 'desc' // Most recently expired first
      },
      take: 10 // Limit to 10 for performance
    })

    // Calculate days remaining for expiring admins
    // const adminsExpiringSoonWithDays = adminsExpiringSoon.map(admin => {
    //   const daysRemaining = Math.ceil(
    //     (admin.subsValidity - now) / (1000 * 60 * 60 * 24)
    //   )
    //   return {
    //     ...admin,
    //     daysRemaining
    //   }
    // })

    res.json({
      success: true,
      data: {
          totalAdmins,
          activeAdmins,
          inactiveAdmins,
          expiredSubscriptions,
          expiringSoon
        // summary: {
        //   totalAdmins,
        //   activeAdmins,
        //   inactiveAdmins,
        //   expiredSubscriptions,
        //   expiringSoon
        // },
        // details: {
        //   adminsExpiringSoon: adminsExpiringSoonWithDays,
        //   expiredAdmins
        // }
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// ADMIN DASHBOARD (Individual Clinic Owner)
// =============================================
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Check if requester is Admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      })
    }

    const adminId = req.user.id

    // Get admin's subscription info
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      })
    }

    // Calculate subscription status
    const now = new Date()
    const daysRemaining = admin.subsValidity
      ? Math.ceil((admin.subsValidity - now) / (1000 * 60 * 60 * 24))
      : null

    const subscriptionStatus = !admin.subsValidity
      ? 'NO_SUBSCRIPTION'
      : daysRemaining < 0
      ? 'EXPIRED'
      : daysRemaining <= 7
      ? 'EXPIRING_SOON'
      : 'ACTIVE'

    // Get staff counts (doctors, receptionists, staff)
    const [totalDoctors, totalReceptionists, totalStaff, totalPatients] =
      await Promise.all([
        prisma.user.count({
          where: { role: 'DOCTOR'}
        }),
        prisma.user.count({
          where: { role: 'RECEPTIONIST'}
        }),
        prisma.user.count({
          where: { role: 'STAFF'}
        }),
        prisma.user.count({
          where: { role: 'PATIENT'}
        })
      ])

    res.json({
      success: true,
      data: {
        clinic: {
          ...admin,
          subscriptionStatus,
          daysRemaining
        },
        staff: {
          totalDoctors,
          totalReceptionists,
          totalStaff,
          totalPatients,
          totalEmployees: totalDoctors + totalReceptionists + totalStaff
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// GET ADMIN STATISTICS (Super Admin)
// =============================================
exports.getAdminStatistics = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const now = new Date()

    // Get monthly admin registration stats (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      }
    })

    // Group by month
    const monthlyStats = {}
    admins.forEach(admin => {
      const month = admin.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyStats[month] = (monthlyStats[month] || 0) + 1
    })

    // Get subscription status breakdown
    const [active, expiringSoon, expired] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'ADMIN',
          subsValidity: { gt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.user.count({
        where: {
          role: 'ADMIN',
          subsValidity: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          role: 'ADMIN',
          subsValidity: { lt: now }
        }
      })
    ])

    res.json({
      success: true,
      data: {
        monthlyRegistrations: monthlyStats,
        subscriptionBreakdown: {
          active,
          expiringSoon,
          expired,
          total: active + expiringSoon + expired
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// GET ALL ADMINS WITH FILTERS (Super Admin)
// =============================================
exports.getAllAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const { status, subscription, search, page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Build where clause
    const where = {
      role: 'ADMIN',
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false }),
      ...(subscription === 'expired' && { subsValidity: { lt: now } }),
      ...(subscription === 'expiring' && {
        subsValidity: { gte: now, lte: oneWeekFromNow }
      }),
      ...(subscription === 'active' && { subsValidity: { gt: oneWeekFromNow } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { clinicName: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          clinicName: true,
          location: true,
          subsValidity: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ])

    // Add subscription status to each admin
    const adminsWithStatus = admins.map(admin => {
      const daysRemaining = admin.subsValidity
        ? Math.ceil((admin.subsValidity - now) / (1000 * 60 * 60 * 24))
        : null

      const subscriptionStatus = !admin.subsValidity
        ? 'NO_SUBSCRIPTION'
        : daysRemaining < 0
        ? 'EXPIRED'
        : daysRemaining <= 7
        ? 'EXPIRING_SOON'
        : 'ACTIVE'

      return {
        ...admin,
        daysRemaining,
        subscriptionStatus
      }
    })

    res.json({
      success: true,
      data: {
        admins: adminsWithStatus,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// SEARCH ADMINS (Super Admin Only)
// =============================================
exports.searchAdmins = async (req, res, next) => {
  try {
    // Check if requester is Super Admin
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const {
      query, // General search term
      clinicName,
      email,
      phone,
      status, // active, inactive
      subscription, // active, expiring, expired
      location,
      page = 1,
      limit = 10,
      sortBy = 'createdAt', // createdAt, name, clinicName, subsValidity
      sortOrder = 'desc' // asc, desc
    } = req.query

    // Validate inputs
    if (!query && !clinicName && !email && !phone && !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one search parameter: query, clinicName, email, phone, or location'
      })
    }

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build dynamic WHERE clause
    const where = {
      role: 'ADMIN',
      AND: []
    }

    // General search across multiple fields
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { clinicName: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Specific field searches
    if (clinicName) {
      where.AND.push({
        clinicName: { contains: clinicName, mode: 'insensitive' }
      })
    }

    if (email) {
      where.AND.push({
        email: { contains: email, mode: 'insensitive' }
      })
    }

    if (phone) {
      where.AND.push({
        phone: { contains: phone, mode: 'insensitive' }
      })
    }

    if (location) {
      where.AND.push({
        location: { contains: location, mode: 'insensitive' }
      })
    }

    // Status filter
    if (status === 'active') {
      where.AND.push({ isActive: true })
    } else if (status === 'inactive') {
      where.AND.push({ isActive: false })
    }

    // Subscription filter
    if (subscription === 'expired') {
      where.AND.push({ subsValidity: { lt: now } })
    } else if (subscription === 'expiring') {
      where.AND.push({
        subsValidity: { gte: now, lte: oneWeekFromNow }
      })
    } else if (subscription === 'active') {
      where.AND.push({ subsValidity: { gt: oneWeekFromNow } })
    }

    // Remove empty AND array if no specific filters
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Determine sort field and order
    const orderBy = {}
    const validSortFields = ['createdAt', 'name', 'clinicName', 'subsValidity', 'email']
    const validSortOrders = ['asc', 'desc']

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const order = validSortOrders.includes(sortOrder.toLowerCase()) 
      ? sortOrder.toLowerCase() 
      : 'desc'

    orderBy[sortField] = order

    // Execute search with pagination
    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          clinicName: true,
          location: true,
          subsValidity: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ])

    // Add computed fields
    const adminsWithDetails = admins.map(admin => {
      const daysRemaining = admin.subsValidity
        ? Math.ceil((admin.subsValidity - now) / (1000 * 60 * 60 * 24))
        : null

      const subscriptionStatus = !admin.subsValidity
        ? 'NO_SUBSCRIPTION'
        : daysRemaining < 0
        ? 'EXPIRED'
        : daysRemaining <= 7
        ? 'EXPIRING_SOON'
        : 'ACTIVE'

      return {
        ...admin,
        daysRemaining,
        subscriptionStatus
      }
    })

    res.json({
      success: true,
      message: `Found ${total} admin(s)`,
      data: {
        admins: adminsWithDetails,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          query,
          clinicName,
          email,
          phone,
          location,
          status,
          subscription,
          sortBy: sortField,
          sortOrder: order
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// QUICK SEARCH (Autocomplete/Suggestions)
// =============================================
exports.quickSearchAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const { q, limit = 5 } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters'
      })
    }

    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { clinicName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        clinicName: true,
        phone: true,
        location: true
      },
      take: parseInt(limit)
    })

    res.json({
      success: true,
      data: admins
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// ADVANCED SEARCH WITH MULTIPLE FILTERS
// =============================================
exports.advancedSearchAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      })
    }

    const {
      searchFields = {}, // { clinicName: "Smith", email: "john" }
      dateRange = {}, // { from: "2024-01-01", to: "2024-12-31" }
      subscriptionRange = {}, // { minDays: 0, maxDays: 30 }
      status,
      page = 1,
      limit = 10
    } = req.body

    const now = new Date()
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      role: 'ADMIN',
      AND: []
    }

    // Search by multiple specific fields
    if (searchFields.clinicName) {
      where.AND.push({
        clinicName: { contains: searchFields.clinicName, mode: 'insensitive' }
      })
    }

    if (searchFields.email) {
      where.AND.push({
        email: { contains: searchFields.email, mode: 'insensitive' }
      })
    }

    if (searchFields.phone) {
      where.AND.push({
        phone: { contains: searchFields.phone, mode: 'insensitive' }
      })
    }

    if (searchFields.name) {
      where.AND.push({
        name: { contains: searchFields.name, mode: 'insensitive' }
      })
    }

    if (searchFields.location) {
      where.AND.push({
        location: { contains: searchFields.location, mode: 'insensitive' }
      })
    }

    // Date range filter (registration date)
    if (dateRange.from || dateRange.to) {
      const dateFilter = {}
      if (dateRange.from) dateFilter.gte = new Date(dateRange.from)
      if (dateRange.to) dateFilter.lte = new Date(dateRange.to)
      where.AND.push({ createdAt: dateFilter })
    }

    // Subscription days remaining range
    if (subscriptionRange.minDays !== undefined || subscriptionRange.maxDays !== undefined) {
      const minDate = subscriptionRange.minDays !== undefined
        ? new Date(now.getTime() + subscriptionRange.minDays * 24 * 60 * 60 * 1000)
        : undefined
      const maxDate = subscriptionRange.maxDays !== undefined
        ? new Date(now.getTime() + subscriptionRange.maxDays * 24 * 60 * 60 * 1000)
        : undefined

      const subsFilter = {}
      if (minDate) subsFilter.gte = minDate
      if (maxDate) subsFilter.lte = maxDate
      
      if (Object.keys(subsFilter).length > 0) {
        where.AND.push({ subsValidity: subsFilter })
      }
    }

    // Status filter
    if (status) {
      where.AND.push({ isActive: status === 'active' })
    }

    if (where.AND.length === 0) {
      delete where.AND
    }

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          clinicName: true,
          location: true,
          subsValidity: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ])

    const adminsWithDetails = admins.map(admin => {
      const daysRemaining = admin.subsValidity
        ? Math.ceil((admin.subsValidity - now) / (1000 * 60 * 60 * 24))
        : null

      return {
        ...admin,
        daysRemaining
      }
    })

    res.json({
      success: true,
      data: {
        admins: adminsWithDetails,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    next(error)
  }
}