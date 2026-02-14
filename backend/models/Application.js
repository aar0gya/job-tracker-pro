/**
 * Application Model
 */

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    salary: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['applied', 'interview', 'offer', 'rejected', 'withdrawn'],
        default: 'applied'
    },
    appliedDate: {
        type: Date,
        required: [true, 'Applied date is required']
    },
    jobUrl: {
        type: String,
        trim: true,
        default: ''
    },
    contactPerson: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Static method to get statistics
applicationSchema.statics.getStatistics = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {
        total: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
    };

    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    return result;
};

module.exports = mongoose.model('Application', applicationSchema);