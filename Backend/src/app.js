const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth.js')
const eventRoutes = require('./routes/events.js')
const bookingRoutes = require('./routes/bookings.js')



const app = express();
app.use(express.json());
app.use(cors({
    origin: ["https://eventora-eight-rho.vercel.app/"],
    credentials: true
}))

//Routes
app.use("/api/auth",authRoutes);
app.use("/api/events",eventRoutes);
app.use("/api/bookings",bookingRoutes);

module.exports = app