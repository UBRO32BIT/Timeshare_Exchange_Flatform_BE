const S3Client = require("@aws-sdk/client-s3").S3Client;
const GetObjectCommand = require("@aws-sdk/client-s3").GetObjectCommand;
const ListObjectsV2Command = require("@aws-sdk/client-s3").ListObjectsV2Command;
const PutObjectCommand = require("@aws-sdk/client-s3").PutObjectCommand;
const getSignedUrl = require("@aws-sdk/s3-request-presigner").getSignedUrl;
const uuid = require("uuid").v4;
const fs = require("fs");
const configs = require("../configs/default.json");

const credentials = {
    accessKeyId: "AKIA2UC3APRF5E545EHU",
    secretAccessKey: "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",
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html
const config = {
    region: 'ap-southeast-1',
    credentials,
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/s3client.html
const s3 = new S3Client({
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: "AKIA2UC3APRF5E545EHU",
        secretAccessKey: "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",
    }
});

const BUCKET = process.env.S3_BUCKET;

const uploadToS3 = async ({file, userId}) => {
    const key = `${userId}/${uuid()}`;
    if (file) {
        const command = new PutObjectCommand({
            Bucket: 'vipoptic',
            Key: key,
            Body: file.data,
            ContentType: file.mimetype
        });

        try {
            await s3.send(command);
            return {key};
        } catch (error) {
            console.log(error);
            return {error};
        }
    }

};
const uploadBase64ToS3 = async ({file, userId}) => {
    const key = `${userId}/${uuid()}`;
    const command = new PutObjectCommand({
        Bucket: 'vipoptic',
        Key: key,
        Body: file,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    });

    try {
        await s3.send(command);
        return {key};
    } catch (error) {
        console.log(error);
        return {error};
    }
};
const getImageKeysByUser = async (userId) => {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: userId,
    });
    const {Contents = []} = await s3.send(command);
    return Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
    ).map((image) => image.Key);
};
const GetPresignedUrl = async (key) => {
    try {
        if (key) {
            const command = new GetObjectCommand({Bucket: 'vipoptic', Key: key});
            return getSignedUrl(s3, command, {expiresIn: 900}); // default
        }
    } catch (error) {
        console.log(error);
        return {error};
    }
};
const getUserPresignedUrls = async (userId, key) => {
    try {
        const imageKeys = await getImageKeysByUser(userId);

        const presignedUrls = await Promise.all(
            imageKeys.map((key) => {
                const command = new GetObjectCommand({Bucket: BUCKET, Key: key});
                return getSignedUrl(s3, command, {expiresIn: 900}); // default
            })
        );
        return {presignedUrls};
    } catch (error) {
        console.log(error);
        return {error};
    }
};

module.exports = {uploadToS3, GetPresignedUrl}