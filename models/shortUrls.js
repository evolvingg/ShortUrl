
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortId = require('shortid');

//Create Schema
const ShortUrlsSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    urlCode: {
        type: String,
        required: true,
        default: shortId.generate 
    },
    hits: {
        type: Number,
        required: true,
        default: 0
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    custom: {
        type: String,
        required: false
    },
    expiryDate: {
        type: Date,
        required: true
    }
});
module.exports = mongoose.model('ShortUrl', ShortUrlsSchema);