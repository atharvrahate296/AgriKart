// Load environment variables from backend/.env before any test runs
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') })
