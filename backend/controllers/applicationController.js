/**
 * Application Controller
 * Handles all business logic for job applications
 */

const Application = require('../models/Application');

/**
 * @desc    Get all applications
 * @route   GET /api/applications
 * @access  Public
 */
exports.getAllApplications = async (req, res) => {
    try {
        const { status, search, sortBy } = req.query;

        // Build query
        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { company: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        let sort = {};
        switch (sortBy) {
            case 'dateAsc':
                sort = { appliedDate: 1 };
                break;
            case 'dateDesc':
                sort = { appliedDate: -1 };
                break;
            case 'company':
                sort = { company: 1 };
                break;
            case 'position':
                sort = { position: 1 };
                break;
            default:
                sort = { appliedDate: -1 };
        }

        const applications = await Application.find(query).sort(sort);

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Get single application
 * @route   GET /api/applications/:id
 * @access  Public
 */
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Create new application
 * @route   POST /api/applications
 * @access  Public
 */
exports.createApplication = async (req, res) => {
    try {
        console.log('Received data:', req.body); // DEBUG

        const application = await Application.create(req.body);

        console.log('Created application:', application); // DEBUG

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Error creating application:', error); // DEBUG

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Update application
 * @route   PUT /api/applications/:id
 * @access  Public
 */
exports.updateApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,              // Return updated document
                runValidators: true     // Run schema validators
            }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        // Validation error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Delete application
 * @route   DELETE /api/applications/:id
 * @access  Public
 */
exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Application deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Get statistics
 * @route   GET /api/applications/stats
 * @access  Public
 */
exports.getStatistics = async (req, res) => {
    try {
        const stats = await Application.getStatistics();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

/**
 * @desc    Bulk delete applications
 * @route   DELETE /api/applications/bulk
 * @access  Public
 */
exports.bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of IDs'
            });
        }

        const result = await Application.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            data: {
                deletedCount: result.deletedCount
            },
            message: `${result.deletedCount} application(s) deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};