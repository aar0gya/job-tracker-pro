/**
 * Application Routes
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    getStatistics,
    bulkDelete
} = require('../controllers/applicationController');

// Routes
router.get('/stats', getStatistics);
router.delete('/bulk', bulkDelete);

router.route('/')
    .get(getAllApplications)
    .post(createApplication);

router.route('/:id')
    .get(getApplication)
    .put(updateApplication)
    .delete(deleteApplication);

// Export router
module.exports = router;