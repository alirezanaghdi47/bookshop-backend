const sharp = require('sharp');
const multer = require("multer");
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');

// variables
const {ARVAN_CLOUD_ENPOINT, ARVAN_CLOUD_ACCESS_KEY_ID, ARVAN_CLOUD_SECRET_ACCESS_KEY} = process.env;

// config multer to get file
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// arvan config
const s3 = new S3Client({
    region: 'default',
    endpoint: ARVAN_CLOUD_ENPOINT,
    credentials: {
        accessKeyId: ARVAN_CLOUD_ACCESS_KEY_ID,
        secretAccessKey: ARVAN_CLOUD_SECRET_ACCESS_KEY,
    },
});

// upload image with optimize
const uploadImage = async (buffer , filename , width , height) => {
    await sharp(buffer)
        .resize({
            width: width,
            height: height,
            fit: "cover",
            position: "center"
        })
        .toBuffer()
        .then(async (newBuffer) => {
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: 'bookshop',
                    Key: filename,
                    ACL: 'public-read',
                    Body: newBuffer
                }));
                console.log("file added");
            } catch (err) {
                console.log("file rejected");
            }
        });
}

// upload advertise with optimize
const uploadAdvertise = async (buffer , filename) => {
    await sharp(buffer)
        .resize({
            width: 1920,
            height: 1080,
            fit: "cover",
            position: "center"
        })
        .toBuffer()
        .then(async (newBuffer) => {
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: 'bookshop',
                    Key: filename,
                    ACL: 'public-read',
                    Body: newBuffer
                }));
                console.log("file added");
            } catch (err) {
                console.log("file rejected");
            }
        });
}

// upload avatar with optimize
const uploadAvatar = async (buffer , filename) => {
    await sharp(buffer)
        .resize({
            width: 320,
            height: 320,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        .toBuffer()
        .then(async (newBuffer) => {
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: 'bookshop',
                    Key: filename,
                    ACL: 'public-read',
                    Body: newBuffer
                }));
                console.log("file added");
            } catch (err) {
                console.log("file rejected");
            }
        });
}

module.exports.upload = upload;
module.exports.uploadImage = uploadImage;
module.exports.uploadAdvertise = uploadAdvertise;
module.exports.uploadAvatar = uploadAvatar;