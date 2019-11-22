const mongoose = require('mongoose')
mongoose.connect("mongodb://localhost:27017/users", { useCreateIndex: true, useNewUrlParser: true }, (err) => {
    if (err) {
        console.log('Error')
    }
    else {
        console.log('Connected Successfully')
    }
})
module.exports = mongoose 