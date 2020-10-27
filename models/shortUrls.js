
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortId = require('shortid');

//Create Schema
const ShortUrlsSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    hits: {
        type: Number,
        required: true,
        default: 0
    },
    customUrl: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        default: Date.now ,
        index: { expires: 0 },
    },
    searched: {
        type: Number,
        required: true,
        default: 1
    }
});

module.exports = mongoose.model('ShortUrl', ShortUrlsSchema);