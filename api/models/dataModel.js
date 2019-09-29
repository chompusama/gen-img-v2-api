var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var countingSchema = new Schema({
    week_by_date: {type: Number},
    week: { type: String },
    day: { type: String },
    _did: { type: String },
    date: {type: Date},
    time: {type: String},
    timestamp: {type: Number},
    end_time: {type: String},
    count_type: { type: String },
    ctt_amount: { type: Number },
    sdk_first_meal: { type: Number },
    sdk_second_meal: { type: Number },
    sdk_third_meal: { type: Number },
    status: { type: String },
    result: {type: String}
});

/////////  Main schema //////////
var dataSchema = new Schema({
    _id: {
        type: String
    },
    line_id: {
        type: String
    },
    mom_age: {
        type: String
    },
    ges_age_week: {
        type: Number
    },
    timer_status: {
        type: String
    },
    sdk_status: {
        type: String
    },
    week_current: {
        type: Number
    },
    extra: {
        type: String
    },
    counting: [countingSchema],
});

module.exports = mongoose.model('Data', dataSchema);