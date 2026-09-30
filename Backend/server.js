require('dotenv').config()
const dns = require("dns");

// Keep the local DNS workaround used during development. In production, use
// the host's resolver so MongoDB SRV records resolve in Render's network.
if (process.env.NODE_ENV !== 'production') {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
}
const app = require('./src/app.js')
const connectToDB = require('./src/config/db')

connectToDB()

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
