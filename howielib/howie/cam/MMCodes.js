'use strict';

module.exports = Object.freeze({
  Operations: {
    // Standard
    GetDeviceInfo: 0x1001,
    OpenSession: 0x1002,
    CloseSession: 0x1003,
    GetStorageIDs: 0x1004,
    GetStorageInfo: 0x1005,
    GetNumObjects: 0x1006,
    GetObjectHandles: 0x1007,
    GetObjectInfo: 0x1008,
    GetObject: 0x1009,
    GetThumb: 0x100A,
    DeleteObject: 0x100B,
    SetObjectProtection: 0x1012,
    GetDevicePropDesc: 0x1014,
    GetDevicePropValue: 0x1015,
    GetPartialObject: 0x101B,
		// Extended
    GetExtensionInfo: 0x9081,
    GetObjectHandleWithInfo: 0x9109,
    GetThumbWithMetadata: 0x910A,
    GetInternalDataInfo: 0x9001,
    SetObjectAttributes: 0x910C,
    RequestResizeObject: 0x9085,
    SetExtendedDevicePropValue: 0x9110,
    SetRemoteShootingMode: 0x9086,
    SetEventNotificationMode: 0x9115,
    GetEventData: 0x9116,
    RequestDevicePropValue: 0x9127,
    PressShutterButton: 0x9128,
    ReleaseShutterButton: 0x9129,
    GetLiveviewData: 0x9153,
    SendTouchPosition: 0x915B,
    SetNarrowView: 0x9087,
    CheckPTPSession: 0x902F,
    GetMACAddress: 0x9033,
    GetWirelessSettingInfo: 0x9082,
    SetWirelessSettingInfo: 0x9083,
    ResetWirelessSettings: 0x9084,
    FormatMemoryCard: 0x9088,
    ResetCameraSettings: 0x9089,
    GetIntervalometerSettings: 0x908B,
    SetIntervalometerSettings: 0x908C,
    SetMovieRecording: 0x908D
  },
  Responses: {
    // Standard
    Undefined: 0x2000,
    OK: 0x2001,
    GeneralError: 0x2002,
    SessionNotOpen: 0x2003,
    InvalidTransactionID: 0x2004,
    OperationNotSupported: 0x2005,
    ParameterNotSupported: 0x2006,
    IncompleteTransfer: 0x2007,
    InvalidStorageID: 0x2008,
    InvalidObjectHandle: 0x2009,
    DevicePropNotSupported: 0x200A,
    InvalidObjectFormatCode: 0x200B,
    StoreFull: 0x200C,
    ObjectWriteProtected: 0x200D,
    StoreReadOnly: 0x200E,
    AccessDenied: 0x200F,
    NoThumbnailPresent: 0x2010,
    SelfTestFailed: 0x2011,
    PartialDeletion: 0x2012,
    StoreNotAvailable: 0x2013,
    SpecificationByFormatUnsupported: 0x2014,
    NoValidObjectInfo: 0x2015,
    InvalidCodeFormat: 0x2016,
    UnknownVendorCode: 0x2017,
    CaptureAlreadyTerminated: 0x2018,
    DeviceBusy: 0x2019,
    InvalidParentObject: 0x201A,
    InvalidDevicePropFormat: 0x201B,
    InvalidDevicePropValue: 0x201C,
    InvalidParameter: 0x201D,
    SessionAlreadyOpen: 0x201E,
    TransactionCancelled: 0x201F,
    SpecificationofDestinationUnsupported: 0x2020,
    // Extended
    ObjectNotReady: 0xA102,

    // Application
    TIMEOUT: 'TIMEOUT'
  },
  Events: {
    // Standard
    Undefined: 0x4000,
    ObjectAdded: 0x4002,
    ObjectRemoved: 0x4003,
    DevicePropChanged: 0x4006,
    ObjectInfoChanged: 0x4007,
    DeviceInfoChanged: 0x4008,
    StorageInfoChanged: 0x400C,
    // Extended
    RequestGetEventData: 0xC101
  },
  Properties: {
    // Standard
    Undefined: 0x5000,
    BatteryLevelStandard: 0x5001,
    // Extended
    Exposure: 0xD104, // simple, RS
    RecordingPixels: 0xD120, // complex, RS
    StillImageAspectRatio: 0xD194, // simple, RS
    MaxISOSpeedForStill: 0xD062, // simple, RS
    RecordingMovieStatus: 0xD1B8, // simple, anytime
    MovieRecordingSize: 0xD1CD, // complex, RS
    MaxISOSpeedForMovie: 0xD063, // simple, RS
    VideoSystem: 0xD061, // simple, anytime
    DigitalIS: 0xD064, // simple, RS
    AutoLevel: 0xD065, // simple, RS
    AudioRecordingLevel: 0xD066, // simple, RS
    WirelessCommunicationStatus: 0xD175, // simple, anytime
    LiveviewSize: 0xD1B0, // simple, RS
    RecordableShots: 0xD11B, // simple, RS
    RemainingTime: 0xD067, // simple, RS
    BatteryLevelExtended: 0xD111, // simple, anytime
    BatteryKind: 0xD112, // simple, anytime
    InternalTemperature: 0xD06F, // simple, anytime
    UTC: 0xD17C, // simple, anytime
    TimeZone: 0XD17D, // complex, anytime
    DaylightSavingTime: 0xD17E, // simple, anytime
    Mute: 0xD068, // simple, anytime
    DisplayBrightness: 0xD069, // simple, anytime
    Language: 0xD06B, // simple anytime
    AutoDisplayOff: 0xD06A, // simple, anytime
    AutoPowerOff: 0xD06C, // simple, anytime
    CreateFolder: 0xD06D, // simple, anytime
    FileNumbering: 0xD06E, // simple, anytime
    SerialNumber: 0xD1AF, // complex, anytime
    DeviceNickname: 0xD070, // complex, anytime
    OwnerName: 0xD115, //complex, anytime
    Artist: 0xD1D0, // complex, anytime
    Copyright: 0xD1D1 // complex, anytime
  },
  EventKinds: {
    NotifyAddedObject: 0x0000C01C,
    NotifyModifiedObject: 0x0000C187,
    NotifyRemovedObject: 0x0000C182,
    NotifyModifiedStorage: 0x0000C182,
    NotifyDevicePropValue: 0x0000C189,
    NotifyDevicePropAbility: 0x0000C18A,
    NotifyResizedObject: 0x0000C197,
    TerminatorDataset: 0x00000000
  }
});
