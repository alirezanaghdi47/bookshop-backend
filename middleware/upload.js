const sharp = require('sharp');
const multer = require("multer");
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');

// variable
const {arvan_cloud_endpoint , arvan_cloud_secret_access_key , arvan_cloud_access_key_id} = require("../utils/variables.js");

// config multer to get file
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// arvan config
const s3 = new S3Client({
    region: 'default',
    endpoint: arvan_cloud_endpoint,
    credentials: {
        accessKeyId: arvan_cloud_access_key_id,
        secretAccessKey: arvan_cloud_secret_access_key,
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
module.exports.uploadAvatar = uploadAvatar;