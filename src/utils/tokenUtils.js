const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = { generateToken, generateResetToken }