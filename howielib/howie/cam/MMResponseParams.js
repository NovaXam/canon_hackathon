'use strict';
module.exports = Object.freeze({

  /* Operation Response Parameter Codes */

  PressShutterButton: [
    {
      name: 'shootingResult',
      values: {
        OK: 0x00,
        OutOfFocus: 0x01,
        FailureToShoot: 0x02,
        StoreFull: 0x07
      }
    }
  ],

  GetLiveviewData: [
    { 
      name: 'allocationResult',
      values: {
        OK: 0x00,
        InitiatorBufferShort: 0x01,
        ResponderBufferShort: 0x02
      },
    },
    {
      name: 'bufferSize'
    }
  ],

  SetWirelessSettingInfo: [
    {
      name: 'settingResult',
      values: {
        OK: 0x00,
        DataSetLengthError: 0x01,
        UUIDError: 0x02,
        NetworkTypeError: 0x03,
        ESSIDError: 0x04,
        ESSIDDisplayTypeError: 0x05,
        AuthenticationTypeError: 0x07,
        EncryptionTypeError: 0x07,
        PassphraseError: 0x08,
        ChannelError: 0x09,
        AddressingTypeError: 0x0a,
        IPAddressError: 0x0b,
        SubnetMaskError: 0x0c,
        DefaultGatewayError: 0x0d,
        DNSSettingTypeError: 0x0e,
        PreferredDNSError: 0x0f,
        AlternateDNSError: 0x10,
        LeaseStartAddressError: 0x11
      }
    }
  ]


});
