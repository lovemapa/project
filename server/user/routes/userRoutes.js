const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')
const invoiceModel = require('../../model/invoiceModel')
const userModel = require('../../model/userModel')
const path = require('path')
const mailer = require('@sendgrid/mail');
var phantom = require('phantom');
const session = require('express-session')
var fs = require('file-system')
const bcrypt = require('bcryptjs')
const nodeMailer = require('nodemailer')
const moment = require('moment');

var ejs = require('ejs');
let auth = ((req, res, next) => {
    if (req.session.currentUser) {
        console.log("session set", req.session.currentUser);
        next()
    }
    else {
        res.redirect('/')
    }
})


router.get('/', (req, res) => {
    if (req.session.currentUser) {
        res.redirect('/home')
    } else
        res.render('pages/login', { userid: req.session.currentUser, isadmin: req.session.isAdmin })
})


router.get('/addUser', (req, res) => {
    res.render('pages/register', { userid: req.session.currentUser, isadmin: req.session.isAdmin })
})

router.get('/reset-password', auth, (req, res) => {
    userModel.findOne({ _id: req.query.userid }).then(result => {
        result.userid = req.session.currentUser
        result.isadmin = req.session.isAdmin
        result.message = req.flash('message')
        res.render('pages/reset-password', result)
    }, (err) => {
        res.send(err)
    })
})


router.get('/home', auth, (req, res) => {

    return new Promise((resolve, reject) => {
        const currentUser = req.session.currentUser
        userController.getInvoicesData(currentUser, req.session.isAdmin, req.params.page, moment(req.query.start, "D/M/YYYY").valueOf(), moment(req.query.end, "D/M/YYYY").valueOf()).then((data) => {
            data.isadmin = req.session.isAdmin
            data.userid = req.session.currentUser
            let totalPriceUSD = [];
            let totalPriceINR = [];
            data.Invoices.forEach(function (invoice) {
                if (invoice.currency == 'USD') {
                    totalPriceUSD.push(invoice.totalamount);
                }
                if (invoice.currency == 'INR') {
                    totalPriceINR.push(invoice.totalamount);
                }
            });
            let totalUSD = eval(totalPriceUSD.join('+'));
            let totalINR = eval(totalPriceINR.join('+'));
            data.isadmin = req.session.isAdmin
            data.userid = req.session.currentUser
            data.isadmin = req.session.isAdmin
            data.userid = req.session.currentUser
            data.totalUSD = totalUSD;
            data.totalINR = totalINR;
            res.render('pages/home', data);

        }, (err) => {
            res.send(err)
        })
    })

})





router.post('/addUser', (req, res) => {
    if (req.body.password != req.body.confirmpassword) {
        let sample = {
            err1: "Password didn't matched",
            name: req.body.name,
            email: req.body.email,
            userid: req.session.currentUser,
            isadmin: req.session.isAdmin
        }
        res.render('pages/register', sample)
    } else {
        userController.register(req.body).then((result) => {
            mailer.setApiKey('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');
            const emailbody = req.body.email;
            const passbody = req.body.password;
            const message1 = {
                to: req.body.email,
                from: 'nehasaklani@apptunix.com',
                subject: 'Registration Successfully',
                text: 'You can Access Accoount in this credentials:-' + emailbody + ' ' + 'Password:-' + passbody,
            };
            mailer.send(message1);
            res.redirect('/users')
        }, (err) => {
            let sample1 = {
                err5: 'email is already exist',
                name: req.body.name,
                email: req.body.email,
                userid: req.session.currentUser,
                isadmin: req.session.isAdmin
            }
            res.render('pages/register', sample1)
        })
    }
})


router.post('/login', (req, res) => {
    console.log(req.body)
    if (req.session.currentUser) {
        res.redirect('/home')
    }
    userController.login(req.body).then((user) => {

        req.session.role = user.role
        req.session.currentUser = user._id
        req.session.isAdmin = user.isadmin
        res.redirect('/home')
    }, (err) => {
        res.render('pages/login', { err: " Please enter valid email or password" })
    })
})

router.get('/logout', function (req, res, next) {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});


router.get('/invoices/:page?', auth, (req, res) => {
    const currentUser = req.session.currentUser

    userController.getInvoices(currentUser, req.session.isAdmin, req.params.page).then((data) => {
        // console.log('query',data.invoices)
        data.isadmin = req.session.isAdmin
        data.userid = req.session.currentUser
        res.render('pages/invoices', data)
    }, (err) => {
        res.send(err)
    })

})


router.post('/reset-password', auth, (req, res) => {



    userModel.findOne({ _id: req.body.userId }, (err, user) => {
        if (err) {
            console.log('err', err)
        }
        else {
            if (bcrypt.compareSync(req.body.oldpassword, user.password) && req.body.newpassword == req.body.confirmpassword) {
                var salt = bcrypt.genSaltSync(4)

                var hash = bcrypt.hashSync(req.body.confirmpassword, salt)
                userModel.findOneAndUpdate({ _id: req.body.userId }, { $set: { password: hash } }, (err, user) => {
                    if (req.body.oldpassword == req.body.newpassword) {
                        let form3 = {
                            _id: req.body.userId,
                            userid: req.session.currentUser,
                            isadmin: req.session.isAdmin,
                            err4: "old password and new password are same"
                        }
                        res.render('pages/reset-password', { message: form3.err4, _id: form3._id, userid: form3.userid, isadmin: form3.isadmin })
                    }
                    else {
                        let form3 = {
                            _id: req.body.userId,
                            userid: req.session.currentUser,
                            isadmin: req.session.isAdmin,
                            err4: "Password changes successfully"
                        }
                        res.render('pages/reset-password', { message: form3.err4, _id: form3._id, userid: form3.userid, isadmin: form3.isadmin })
                    }
                })
            }
            else {
                if (req.body.newpassword != req.body.confirmpassword) {
                    let form = {
                        _id: req.body.userId,
                        userid: req.session.currentUser,
                        isadmin: req.session.isAdmin,
                        err3: "password didn't matched with new password"
                    }
                    res.render('pages/reset-password', form)
                }
                else {
                    console.log('Error')
                    let form = {
                        _id: req.body.userId,
                        userid: req.session.currentUser,
                        isadmin: req.session.isAdmin,
                        err2: "old password is incorrect"
                    }
                    res.render('pages/reset-password', form)
                }
            }

        }
    })
})


router.post('/createinvoice', auth, (req, res) => {
    console.log(req.body);

    userController.createinvoice(req.body, req.session.currentUser).then((result) => {
        res.redirect('/invoices')
    }, (err) => {
        console.log(err, '362163')
        res.send(err)

    })
})


router.get('/createinvoice', auth, (req, res) => {
    invoiceModel.countDocuments().then((count) => {
        count = count + 1
        return new Promise((resolve, reject) => {
            userModel.findById(req.session.currentUser, (err, result) => {

                if (err) return reject(err)

                let invoiceno = "MO/" + "19-20/688/" + count;
                res.render('pages/createinvoice', { userid: req.session.currentUser, invoiceno, user: result, isadmin: req.session.isAdmin })
            })
        })
    })
})

router.get('/invoice/edit/:invoiceid', auth, (req, res) => {
    userController.getInvoiceById(req.params.invoiceid).then((data) => {

        res.render('pages/editInvoice', { Invoices: data, user: data.userId, currentUser: req.session.currentUser, invoiceid: req.params.invoiceid, userid: req.params.userid, isadmin: req.session.isAdmin })

    }, (err) => {
        res.send(err)
    });
});

router.post('/invoice/edit/', auth, (req, res) => {


    userController.updateInvoice(req.body._id, req.body).then(result => {
        result.isadmin = req.session.isAdmin
        result.userid = req.session.currentUser
        res.render('pages/invoices', result);
    }, (err) => {
        res.send(err)
    });
});





router.get('/users/:page?', auth, (req, res) => {
    userController.getUsers(req.params.page).then((data) => {
        data.isadmin = req.session.isAdmin
        data.userid = req.session.currentUser

        res.render('pages/users', data)
    }, (err) => {
        res.send(err)
    })
})


router.get('/users/delete/:userid', auth, (req, res) => {
    userController.removeUser(req.params.userid).then((data) => {
        res.redirect('/users')
    }, (err) => {
        res.send(err)

    })
})


router.post('/users/edit', auth, (req, res) => {
    userController.updateUser(req.body, { _id: req.body.userId }).then((data) => {
        res.redirect('/users')
    }, (err) => {

        let form1 = {
            _id: req.body.userId,
            err: 'email is already exist',
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            userid: req.session.currentUser,
            isadmin: req.session.isAdmin
        }
        res.render('pages/EditUser', form1)
    })
})
router.get('/profile', auth, (req, res) => {


    userController.getProfile(req.session.currentUser).then(result => {



        res.render('pages/profile', { title: 'profile', user: result.currentUser, _id: result.userid, email: result.email, name: result.name, role: result.role });
    });
});

router.get('/users/edit/:userid', auth, (req, res) => {
    userController.getuserProfile(req.params.userid).then(result => {
        result.isadmin = req.session.isAdmin
        result.userid = req.session.currentUser
        res.render('pages/EditUser', result)
    }, (err) => {
        res.send(err)
    })
})


router.get('/invoice/delete/:invoiceid', auth, (req, res) => {
    console.log('invoice==', req.params.invoiceid);

    userController.removeInvoice(req.params.invoiceid).then((data) => {
        res.redirect('/invoices')
    }, (err) => {
        res.send(err)

    })
})


router.get('/invoice/detail/:invoiceid', auth, (req, res) => {
    userController.viewdetail(req.params.invoiceid).then((data) => {
        res.render('pages/invoicedetail', { Invoices: JSON.parse(data), invoiceno: JSON.parse(data).invoiceno, user: data.userId, invoiceid: req.params.invoiceid, userid: req.params.userid })
    }, (err) => {
        res.send(err)
    })
})


router.get('/invoice/pdfdetail/:invoiceid', (req, res) => {
    userController.viewdetail(req.params.invoiceid).then((data) => {
        res.render('pages/pdf', { Invoices: JSON.parse(data), invoiceno: JSON.parse(data).invoiceno, user: data.userId, invoiceid: req.params.invoiceid, userid: req.params.userid })
    }, (err) => {
        res.send(err)
    })
})


router.get('/invoice/pdf/:invoiceid', (req, res) => {
    var d = new Date();
    var n = d.getTime();
    let nm = req.query.inv + '_' + n
    phantom.create().then(function (ph) {
        ph.createPage().then(function (page) {
            page.open("http://localhost:2000/invoice/pdfdetail/" + req.params.invoiceid).then(function (status) {
                page.render('public/' + nm + '.pdf').then(function () {
                    var file = 'public/' + nm + '.pdf'
                    res.download(file);
                    fs.access(file, error => {
                        if (!error) {
                            // fs.unlinkSync(file);
                        } else {
                            console.log(error);
                        }
                    });
                    ph.exit();
                });
            });
        });
    });
})


router.get('/forgetpass', (req, res) => {
    res.render('forgetpass')
})

//post on this router

router.post('/forget-password', (req, res) => {
    userController.forgetPassword(req.body.email).then(
        message => {
            res.json({ success: 1, message: message })
        },
        err => {
            res.json({ success: 0, message: err })
        }
    )
})


router.get('/forgetpassword', (req, res) => {
    if (!(req.query.user || req.query.token)) {
        res.redirect('/404-page')
    }
    let message = req.flash('errm')
    res.render('forgetPassword', { title: 'Forget password', message: message })
})


router.get('/activated', (req, res) => {
    if (!(req.query.email || req.query.user)) {
        res.redirect('/404-page')
    }

    userController.acivateAccount(req.query).then(
        result => {
            res.send(
                ` <h1 style="text-align:center;font-size: 41px">Your account has been successfully activated.</h1> <h1 style='text-align:center;font-size: 41px'>You may now sign in to the app with your email and password.</h1>
        `)
        },
        err => {
            res.send(err)
        }
    )
})


router.get('/404-page', (req, res) => {
    res.render('404-page', { title: 'Page not found' })
})


router.get('/expired', (req, res) => {
    res.send('Forget password link expired.')
})


router.post('/forgetpassword', (req, res) => {
    userController.forgetPasswordVerify(req.body, req.query).then(
        message => {
            res.render('forgetPassword', { message: message, title: 'Forget password' })
        },
        err => {
            if (err.expired) {
                res.redirect('/expired')
            }
            req.flash('errm', err)
            let url = `/forgetpassword?token=${req.query.token}&user=${req.query.user}`
            res.redirect(url)
        }
    )
})


module.exports = router;