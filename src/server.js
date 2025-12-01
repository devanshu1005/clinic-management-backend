require('dotenv').config()
const express = require('express')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})