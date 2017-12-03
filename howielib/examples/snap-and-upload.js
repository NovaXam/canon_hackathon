/*
connect, snap a photo, retrieve and upload it to S3 bucket

- NOTE: make sure you generate S3 upload credentials from the IAM dashboard and put in 
  credentials file in your home directory. Should look like this when complete: 

```
$ cat ~/.aws/credentials
[default]
aws_access_key_id = <YOUR_PUBLIC_KEY>
aws_secret_access_key = <YOUR_SECRET_KEY>
```
- Need to update the `BUCKET_NAME` and `BUCKET_SUBPATH` in the snap-and-upload.js file
*/

/* nodejs modules */
const fs = require('fs');
const exec = require('child_process').exec;

/* NPM modules */
const AWS = require('aws-sdk');

/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

/* AWS S3 bucket path */
const BUCKET_NAME = 'howie-uploads';
const BUCKET_SUBPATH = 'examples/thumbs/'; 


logger.setLevel('normal');
const camera = new Camera();

// connect to the camera 
camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // ask the camera to take a photo
  camera.snap()
  .then((response) => {
    // retrieve the thumbnail of the photo
    return camera.getLastThumb()
  })
  .then((response) => {
    logger.green('got thumb');

    let info = response[0].info;
    let thumbBuf = response[0].image;

    logger.dir(info);

    let fileKey = BUCKET_SUBPATH + (new Date).getTime() + '.jpg';
    
    (new AWS.S3()).upload({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: thumbBuf,
      ACL: 'private'
    }, (error, response) => {

      if (error === null) {
        logger.green('uploaded thumb to ' + BUCKET_NAME + '/' + fileKey);
        logger.dir(response);
      } else {
        logger.red('problem uploading: ');
        logger.red(error);
      }
      process.exit(0);

    });


  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);
    process.exit(0);

  });

});

