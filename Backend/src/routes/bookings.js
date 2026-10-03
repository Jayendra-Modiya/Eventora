const express = require('express');
const router = express.Router();
const { bookEvent, confirmBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController.js');
const { protect, admin } = require('../middlewares/authmiddleware.js');

router.post('/', protect, bookEvent);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.get('/my', protect, getMyBookings);
router.delete('/:id', protect, cancelBooking);

module.exports = router;