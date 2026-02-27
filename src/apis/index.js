const fs = require('fs')
const path = require('path')
const express = require('express')

const router = express.Router()
const apisPath = __dirname

// Read all folders inside apis
fs.readdirSync(apisPath).forEach((folder) => {
  const folderPath = path.join(apisPath, folder)

  // Skip index.js itself
  if (folder === 'index.js') return

  // Check if it's a folder
  if (fs.lstatSync(folderPath).isDirectory()) {

    const routeFile = path.join(folderPath, 'routes.js')

    // Check if routes.js exists
    if (fs.existsSync(routeFile)) {
      const route = require(routeFile)

      router.use(`/${folder.toLowerCase()}`, route)

      console.log(`✅ API Loaded: /api/${folder.toLowerCase()}`)
    }
  }
})

module.exports = router