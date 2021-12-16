const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

// variables
const {EMAIL_SERVICE_USERNAME, EMAIL_SERVICE_PASSWORD} = process.env;

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_SERVICE_USERNAME,
        pass: EMAIL_SERVICE_PASSWORD
    }
});

const sendMail = async (mailOptions) => {
    await mailTransporter.sendMail(mailOptions, async (err, data) => {
        if (err) {
            console.log('Error Occurs: ' , err);
        } else {
            console.log('Email sent successfully');
        }
        console.log(data);
    });
}

const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

mailTransporter.use('compile', hbs(handlebarOptions))

module.exports = sendMail;