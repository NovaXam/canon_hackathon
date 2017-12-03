'use strict';

const OpCodes = require('../cam/MMCodes').Operations;
const logger = require('../util/logger');

const jsonTransform = {

  GetLiveviewData: function GetLiveviewDataJson(rawJson) {
    let data = rawJson.data.payload;

    let obj = {
      image: data.Image.ImageData,
      width: data.LVSize.Width,
      height: data.LVSize.Height,
      angleOfView: data.AngleOfView.AngleOfViewStatus,
      angle: {
        horizontal: data.MotionInfo.HorizontalAngle,
        tilt: data.MotionInfo.TiltAngle
      },
      gyro: {
        pitch: data.MotionInfo.PitchVelocity,
        yaw: data.MotionInfo.YawVelocity,
        roll: data.MotionInfo.RollVelocity
      },
      accel: {
        x: data.MotionInfo.XAcceleration,
        y: data.MotionInfo.YAcceleration,
        z: data.MotionInfo.ZAcceleration,
      },
      shake: data.MotionInfo.ShakeLevel,
      shock: data.MotionInfo.ShockForce,
      detection: {
        type: data.DetectionInfo.DetectionType,
        mode: data.DetectionInfo.DetectionMode,
        subjects: data.DetectionInfo.SubjectInfoArray
      }
    };

    let rawSubjects = data.DetectionInfo.SubjectInfoArray;
    let refinedSubjects = [];
    for (let raw of rawSubjects) {
      let sub = {
        subjectID: raw.SubjectID,
        state: raw.State,
        centerX: raw.SubjectPosH,
        centerY: raw.SubjectPosV,
        width: raw.SubjectSizeH,
        height: raw.SubjectSizeV,
        leftEyeX: raw.LeftEyePosH,
        leftEyeY: raw.LeftEyePosV,
        rightEyeX: raw.RightEyePosH,
        rightEyeY: raw.RightEyePosV,
        rotate: raw.Rotate,
      }
      refinedSubjects.push(sub);
    }

    obj.detection.subjects = refinedSubjects;

    return obj;

  },

  GetWirelessSettingInfo: function(rawJson) {
    let data = rawJson.data.payload;
    return {
      uuid: data.UUID,
      networkMode: data.NetworkType,
      essid: data.ESSID,
      essidDisplay: data.ESSIDDisplayType,
      authentication: data.AuthenticationType,
      encryption: data.EncryptionType,
      passphrase: data.Passphrase,
      addressing: data.AddressingType,
      dns: data.DNSSettingType
    };
  },

  GetObjectHandles: function(rawJson) {
    let data = rawJson.data.payload;
    let handles = [];
    for (let item of data) {
      handles.push(item.ObjectHandle);
    }
    return(handles);
  }

};

module.exports = function MMJsonResponse(rawJson) {


  let op = rawJson.operation;

  if (typeof jsonTransform[op] === 'function') {
    return jsonTransform[op](rawJson);
  } else {
    logger.debug.yellow('WARNING: MMJsonResponse could not find match for OpCode: ' + rawJson.operation);
    return rawJson;
  }


};

