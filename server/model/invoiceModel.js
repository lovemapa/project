const mongoose = require('mongoose')
const Schema = mongoose.Schema
const invoiceSchema = new Schema({
    issuedate: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    duedate: { type: String },
    name: { type: String },
    address: { type: String },
    mobile: { type: Number },
    entries: [{
        description: Array,
        quantity: Array,
        price: Array,
        subtotal: { type: Number }
    }],
    status: { type: String, enum: ['draft', 'final'], default: 'draft' },
    gst: { type: Number },
    totalamount: { type: Number },
    invoiceno: { type: String },
    gstnumber: { type: Number, default: 0 },
    currency: { type: String },
    createdAt: { type: Number }
})

const Invoice = mongoose.model('invoice', invoiceSchema)
module.exports = Invoice







