const userModel = require('../../model/userModel')
const invoiceModel = require('../../model/invoiceModel')
const mongoose = require('../../config')
const bcrypt = require('bcryptjs')
const nodeMailer = require('nodemailer')
const moment = require('moment');

const sgTransport = require('nodemailer-sendgrid-transport')
var converter = require('number-to-words');
class userController {
    register(body, isadmin) {

        return new Promise((resolve, reject) => {
            var salt = bcrypt.genSaltSync(4)
            var hash = bcrypt.hashSync(body.password, salt)
            let user = new userModel({
                name: body.name,
                role: body.role,
                email: body.email,
                password: hash,
            })
            if (!isadmin)
                reject({ code: 2 })
            else {
                user.save({}).then(result => {

                    result.password = body.password
                    resolve(result)

                }).catch(err => {

                    if (err) {
                        reject({ code: 1 })
                    }


                })
            }


        })
    }
    login(body) {
        return new Promise((resolve, reject) => {
            userModel.findOne({ email: body.email }, (err, user) => {
                if (!user) return reject('Incorrect Email')
                if (bcrypt.compareSync(body.password, user.password)) {
                    resolve(user)
                }
                else {
                    reject("Incorrect password")
                }
            })
        })
    }



    removeInvoice(invoiceId) {
        return new Promise((resolve, reject) => {
            invoiceModel.findByIdAndRemove(invoiceId, (err, result) => {
                if (err) {
                    return reject(err)
                }
                else {
                    resolve(result)
                }
            })
        })
    }
    createinvoice(body, userid) {


        return new Promise((resolve, reject) => {
            var query;
            if (body.final == 'final') {
                query = 'final'
            }
            else
                query = 'draft'
            invoiceModel.countDocuments().then((count) => {
                count = count + 1
                let invoiceno = "MO/" + "19-20/688/" + count;

                let entries = []


                for (var j = 0; j < body.price.length; j++) {
                    entries.push({
                        description: body.description[j],
                        quantity: body.quantity[j],
                        price: body.price[j],
                        subtotal: body.subtotal[j]
                    })
                }

                let invoice = new invoiceModel({
                    issuedate: body.issuedate,
                    duedate: body.duedate,
                    entries: entries,
                    gst: body.gst,
                    name: body.name,
                    address: body.address,
                    mobile: body.mobile,
                    totalamount: body.totalamount,
                    invoiceno: invoiceno,
                    gstnumber: body.gstnumber,
                    userId: userid,
                    currency: body.currency,
                    status: query,
                    createdAt: moment().valueOf()
                })

                invoice.save((err, result) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(result)
                    }
                })
            })
        })
    }
    viewdetail(invoiceId) {
        return new Promise((resolve, reject) => {
            invoiceModel.findById(invoiceId).then((invoices) => {
                invoices.set('words', converter.toWords(invoices.totalamount), { strict: false })
                resolve(JSON.stringify(invoices))
            }).catch((err) => {
                reject("Some Error Occured")
            })
        })
    }
    getInvoiceById(invoiceId) {
        return new Promise((resolve, reject) => {
            invoiceModel.findById({ _id: invoiceId }, (err, result) => {
                if (err) {
                    return reject(err)
                }
                else {
                    resolve(result)
                }
            })
        });
    }

    updateInvoice(id, data) {
        return new Promise((resolve, reject) => {
            var query;
            if (data.final == 'final' || data.submitValue == 'final') {
                query = 'final'
            }
            else
                query = 'draft'
            if (data) {


                let entries = []
                for (var j = 0; j < data.price.length; j++) {
                    entries.push({
                        description: data.description[j],
                        quantity: data.quantity[j],
                        price: data.price[j],
                        subtotal: data.subtotal[j]
                    })
                }
                invoiceModel.findOneAndUpdate({ _id: id }, {
                    issuedate: data.issuedate,
                    duedate: data.duedate,
                    entries: entries,
                    gst: data.gst,
                    name: data.name,
                    address: data.address,
                    mobile: data.mobile,
                    totalamount: data.totalamount,
                    gstnumber: data.gstnumber,
                    currency: data.currency,
                    status: query
                }).then((result) => {

                    let query = {}
                    var perPage = 8
                    var page = 1;
                    // var page = current || 1
                    if (!Number(data.isadmin)) {
                        query.userId = data.currentUser
                        query.$or = [
                            { status: "draft" }, { status: "final" }
                        ]
                    }
                    else {

                        query.$or =
                            [
                                {
                                    $and: [
                                        { userId: data.currentUser },
                                        { status: 'draft' }
                                    ]
                                },
                                { status: 'final' }
                            ]
                    }

                    invoiceModel.find(query).populate({ path: 'userId' }).sort({ "_id": -1 }).skip((perPage * page) - perPage).limit(perPage).then((result) => {
                        invoiceModel.countDocuments().then((count) => {
                            resolve({
                                Invoices: result,
                                current: page,
                                pages: Math.ceil(count / perPage)
                            })
                        },
                            (err) => {
                                reject(err)
                            })
                    }, (err) => {
                        reject(err)
                    })


                }).catch(err => {
                    console.log(err);

                })
            }
        })
    }

    getInvoicesData(userId, isadmin, current, start, end) {
        let query = {}
        if (!isadmin) {
            query.userId = userId
            query.status = 'final'
        }
        else { query.status = 'final' }
        var data1 = '';
        if (
            typeof end !== 'undefined' && end !== 'NaN' && Number.isInteger(end) &&
            typeof start !== 'undefined' && start !== 'NaN' && Number.isInteger(start)) {
            {
                if (start == end) {
                    query.createdAt = { $gte: Number(start), $lte: Number(end + 86400000) }
                    query.status = 'final'
                }
                else {
                    query.createdAt = { $gte: Number(start), $lte: Number(end + 86400000) }
                    query.status = 'final'
                }
            }
        }
        return new Promise((resolve, reject) => {
            invoiceModel.find(query).populate('userId').then((result) => {
                resolve({
                    Invoices: result
                }),
                    (err) => {
                        reject(err)
                    }
            }, (err) => {
                reject(err)
            })
        })
    }


    // invoiceModel.find().then((result)=>{},(err)=>{})          //for future use
    getInvoices(userId, isadmin, current) {

        // console.log("userIduserIduserIduserId", userId);
        let query = {}
        var perPage = 8
        var page = current || 1
        if (!isadmin) {
            query.userId = userId
            query.$or = [
                { status: "draft" }, { status: "final" }
            ]
        }
        else {
            // query.$or = [{ status: 'draft' }, { userId: userId }, { status: 'final' }]
            // query.status = "final"
            query.$or =
                [
                    {
                        $and: [
                            { userId: userId },
                            { status: 'draft' }
                        ]
                    },
                    { status: 'final' }
                ]
        }
        return new Promise((resolve, reject) => {
            invoiceModel.find(query).populate({ path: 'userId' }).sort({ "_id": -1 }).skip((perPage * page) - perPage).limit(perPage).then((result) => {
                invoiceModel.countDocuments().then((count) => {

                    resolve({
                        Invoices: result,
                        current: page,
                        pages: Math.ceil(count / perPage)
                    })
                },
                    (err) => {
                        reject(err)
                    })
            }, (err) => {
                reject(err)
            })
        })
    }


    getUsers(current) {
        var perPage = 8
        var page = current || 1
        return new Promise((resolve, reject) => {
            userModel.find({ isadmin: { $eq: 0 } }).sort({ "_id": -1 }).skip((perPage * page) - perPage)
                .limit(perPage).then((result) => {
                    userModel.countDocuments().then((count) => {
                        resolve({
                            users: result,
                            current: page,
                            pages: Math.ceil(count / perPage)
                        })
                    },
                        (err) => {
                            reject(err)
                        })
                }, (err) => {
                    reject(err)
                })
        })
    }



    removeUser(userId) {
        return new Promise((resolve, reject) => {
            userModel.findByIdAndRemove(userId, (err, result) => {
                if (err) {
                    return reject(err)
                }
                else {
                    resolve(result)
                }
            })
        })
    }


    getuserProfile(userId) {
        return new Promise((resolve, reject) => {
            userModel.findById({ _id: userId }, (err, result) => {
                if (err) {
                    return reject(err)
                }
                else {
                    resolve(result)
                }
            })
        });
    }


    updateUser(data) {
        return new Promise((resolve, reject) => {
            userModel.findByIdAndUpdate(data.userId, { name: data.name, email: data.email, role: data.role }, (err, result) => {
                if (err) {
                    return reject(err)
                }
                else {
                    resolve(result)
                }
            })
        })
    }


    getProfile(_id) {
        return new Promise((resolve, reject) => {
            userModel.findById(_id).then(result => {
                resolve(result)
            })
        })
    }


    forgetPassword(email) {
        return new Promise((resolve, reject) => {
            userModel.findOne({ email: email }).then(user => {
                if (!user) reject('email is not registered with us')
                let token = Math.floor(Math.random() * 10000)
                //generating token to make link that we will send on mail for confirmation
                var transporter = nodeMailer.createTransport(
                    sgTransport({
                        auth: {
                            api_user: 'hal.elrod@talenenergy.com',
                            api_key: 'rmgD5PxoiYR9hyVaX',
                        },
                    })
                )
                transporter.sendMail(
                    {
                        from: '<Someone>RetailApp@talenenergy.com',
                        to: email,
                        subject: 'Change password :',
                        text: 'Click on confirmation link to change password',
                        html: `<p style='font-size:17px'><a href='/forgetpassword/?token=${token}&user=${
                            user._id
                            }'>Click here to change your password</a></p>`,
                    },
                    function (err, info) {
                        if (err) {
                            console.log(err)
                        } else {
                            userModel.findByIdAndUpdate(user._id, { token: token }).then(
                                () => {
                                    resolve('Please check your email for confirmation link.')
                                },
                                err => {
                                    reject(err)
                                }
                            )
                        }
                    }
                )
            })
        })
    }

    forgetPasswordVerify(body, query) {
        return new Promise((resolve, reject) => {
            if (body.confirmpassword != body.password)
                return reject('Password and confirm password not matched.')
            if (body.password.length < 8)
                return reject('Password must contain atleast 8 characters.')
            userModel.findById(query.user).then(
                result => {
                    var salt = bcrypt.genSaltSync(4)
                    var hash = bcrypt.hashSync(body.password, salt)
                    if (result && result.token == query.token) {
                        userModel
                            .findByIdAndUpdate(query.user, {
                                password: hash,
                                token: '',
                            })
                            .then(
                                result1 => {
                                    return resolve('Password changed successfully.')
                                },
                                err => {
                                    return reject(err)
                                }
                            )
                    } else {
                        return reject({ expired: 1 })
                    }
                },
                err => {
                    return reject(err)
                }
            )
        })
    }
}


module.exports = new userController