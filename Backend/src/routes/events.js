const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authmiddleware.js');
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController.js');

//get all events
router.get('/', getEvents);

//get event by id
router.get('/:id', getEventById);

//create event by admin only
router.post('/', protect, admin, createEvent);

//update event by admin only
router.put('/:id', protect, admin, updateEvent);

//delete event by admin only
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;