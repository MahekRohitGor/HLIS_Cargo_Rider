var globals = require("./config/constants");
var exports = module.exports = {};


exports.forgot_password = function(result) {
        const template = `<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Forgot Password</title>
  
          <style type="text/css">
              @media only screen and (max-width: 480px) {
              body,
              table,
              td,
              p,
              a,
              li,
              blockquote {
                  -webkit-text-size-adjust: none !important
              }
              body {
                  width: 100% !important;
                  min-width: 100% !important
              }
              td[id=bodyCell] {
                  padding: 10px !important
              }
              table.kmMobileHide {
                  display: none !important
              }
              table[class=kmTextContentContainer] {
                  width: 100% !important
              }
              table[class=kmBoxedTextContentContainer] {
                  width: 100% !important
              }
              td[class=kmImageContent] {
                  padding-left: 0 !important;
                  padding-right: 0 !important
              }
              img[class=kmImage],
              img.kmImage {
                  width: 100% !important
              }
              td.kmMobileStretch {
                  padding-left: 0 !important;
                  padding-right: 0 !important
              }
              table[class=kmSplitContentLeftContentContainer],
              table.kmSplitContentLeftContentContainer,
              table[class=kmSplitContentRightContentContainer],
              table.kmSplitContentRightContentContainer,
              table[class=kmColumnContainer],
              td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],
              td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],
              table[class=kmVerticalButton],
              table[class=kmVerticalButtonContent] {
                  width: 100% !important
              }
              td[class=kmButtonCollectionInner] {
                  padding-left: 9px !important;
                  padding-right: 9px !important;
                  padding-top: 9px !important;
                  padding-bottom: 0 !important;
                  background-color: transparent !important
              }
              td[class=kmVerticalButtonIconContent],
              td[class=kmVerticalButtonTextContent],
              td[class=kmVerticalButtonContentOuter] {
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                  padding-bottom: 9px !important
              }
              table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],
              table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],
              table[class=kmColumnContainer] td[class=kmTextContent],
              table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],
              table[class=kmSplitContentRightContentContainer] td[class=kmImageContent],
              table.kmSplitContentLeftContentContainer td.kmImageContent,
              table.kmSplitContentRightContentContainer td.kmImageContent {
                  padding-top: 9px !important
              }
              td[class="rowContainer kmFloatLeft"],
              td.rowContainer.kmFloatLeft,
              td[class="rowContainer kmFloatLeft firstColumn"],
              td.rowContainer.kmFloatLeft.firstColumn,
              td[class="rowContainer kmFloatLeft lastColumn"],
              td.rowContainer.kmFloatLeft.lastColumn {
                  float: left;
                  clear: both;
                  width: 100% !important
              }
              table[class=templateContainer],
              table[class="templateContainer brandingContainer"],
              div[class=templateContainer],
              div[class="templateContainer brandingContainer"],
              table[class=templateRow] {
                  max-width: 600px !important;
                  width: 100% !important
              }
              h1 {
                  font-size: 24px !important;
                  line-height: 130% !important
              }
              h2 {
                  font-size: 20px !important;
                  line-height: 130% !important
              }
              h3 {
                  font-size: 18px !important;
                  line-height: 130% !important
              }
              h4 {
                  font-size: 16px !important;
                  line-height: 130% !important
              }
              td[class=kmTextContent] {
                  font-size: 14px !important;
                  line-height: 130% !important
              }
              td[class=kmTextBlockInner] td[class=kmTextContent] {
                  padding-right: 18px !important;
                  padding-left: 18px !important
              }
              table[class="kmTableBlock kmTableMobile"] td[class=kmTableBlockInner] {
                  padding-left: 9px !important;
                  padding-right: 9px !important
              }
              table[class="kmTableBlock kmTableMobile"] td[class=kmTableBlockInner] [class=kmTextContent] {
                  font-size: 14px !important;
                  line-height: 130% !important;
                  padding-left: 4px !important;
                  padding-right: 4px !important
              }
              }
          </style>
          <!--[if mso]>
          <style>
            
            .templateContainer {
              border: 1px none #aaaaaa;
              background-color: #FFFFFF;
              
            }
            #brandingContainer {
              background-color: transparent !important;
              border: 0;
            }
            
            
            .templateContainerInner {
              padding: 0px;
            }
            
          </style>
          <![endif]-->
      </head>
        <body style="margin:0;padding:0;background-color:#FFF">
          <center>
            <table align="center" border="0" cellpadding="0" cellspacing="0" id="bodyTable" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#FFF;height:100%;margin:0;width:100%">
              <tbody>
                <tr>
                  <td align="center" id="bodyCell" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%">
                    <!--[if !mso]><!-->
                    <div class="templateContainer" style="border:1px none #aaa;background-color:#FFF;display: table; width:600px">
                      <div class="templateContainerInner" style="padding:0">
                        <!--<![endif]-->
                  <!--[if mso]>
                    <table border="0" cellpadding="0" cellspacing="0" class="templateContainer"  width="600" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                    <tbody>
                      <tr>
                        <td class="templateContainerInner" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                          <![endif]-->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                            <tr>
                              <td align="center" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                <table border="0" cellpadding="0" cellspacing="0" class="templateRow" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                  <tbody>
                                    <tr>
                                      <td class="rowContainer kmFloatLeft" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                        <table border="0" cellpadding="0" cellspacing="0" class="kmTextBlock" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                          <tbody class="kmTextBlockOuter">
                                            <tr>
                                              <td class="kmTextBlockInner" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" class="kmTextContentContainer" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                                  <tbody>
                                                    <tr>
                                                      <td class="kmTextContent" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#000;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;">
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" class="kmTextBlock" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                          <tbody class="kmTextBlockOuter">
                                            <tr>
                                              <td class="kmTextBlockInner" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" class="kmTextContentContainer" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                                  <tbody>
                                                    <tr>
                                                      <td class="kmTextContent" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#000;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;">
                                                        <span style="color:#000000;"></span>
                                                        <!-- Your Content As below -->
                                                        <p style="margin:0;padding-bottom:1em;text-align: justify;"><span style="font-size:16px;"><span style="color: rgb(0, 0, 0);"><span style="font-family: arial,helvetica,sans-serif;"></span></span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Dear <strong>${result.name}</strong>,</span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Please use below link to change your password!</span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"> </p>
                                                        
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Click Here To Change Your Password:&nbsp;&nbsp;&nbsp;<a href="${result.url}" target="_blank" style="word-wrap:break-word;color:#0000cd;font-weight:normal;text-decoration:underline">Change Password</a></span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Do not share your password to anyone.</span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"> </p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Thank you,</span></span></p>
                                                        <p style="margin:0;padding-bottom:0"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Cargo Team</span></span></p>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if !mso]><!-->
                        </div>
                      </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </center>
        </body>
    </html>
    `;
       return template;
    },

    exports.contactUs = function(result, callback) {
        const template = `<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Enquiry Details</title>
  
          <style type="text/css">
              @media only screen and (max-width: 480px) {
              body,
              table,
              td,
              p,
              a,
              li,
              blockquote {
                  -webkit-text-size-adjust: none !important
              }
              body {
                  width: 100% !important;
                  min-width: 100% !important
              }
              td[id=bodyCell] {
                  padding: 10px !important
              }
              table.kmMobileHide {
                  display: none !important
              }
              table[class=kmTextContentContainer] {
                  width: 100% !important
              }
              table[class=kmBoxedTextContentContainer] {
                  width: 100% !important
              }
              td[class=kmImageContent] {
                  padding-left: 0 !important;
                  padding-right: 0 !important
              }
              img[class=kmImage],
              img.kmImage {
                  width: 100% !important
              }
              td.kmMobileStretch {
                  padding-left: 0 !important;
                  padding-right: 0 !important
              }
              table[class=kmSplitContentLeftContentContainer],
              table.kmSplitContentLeftContentContainer,
              table[class=kmSplitContentRightContentContainer],
              table.kmSplitContentRightContentContainer,
              table[class=kmColumnContainer],
              td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],
              td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],
              table[class=kmVerticalButton],
              table[class=kmVerticalButtonContent] {
                  width: 100% !important
              }
              td[class=kmButtonCollectionInner] {
                  padding-left: 9px !important;
                  padding-right: 9px !important;
                  padding-top: 9px !important;
                  padding-bottom: 0 !important;
                  background-color: transparent !important
              }
              td[class=kmVerticalButtonIconContent],
              td[class=kmVerticalButtonTextContent],
              td[class=kmVerticalButtonContentOuter] {
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                  padding-bottom: 9px !important
              }
              table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],
              table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],
              table[class=kmColumnContainer] td[class=kmTextContent],
              table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],
              table[class=kmSplitContentRightContentContainer] td[class=kmImageContent],
              table.kmSplitContentLeftContentContainer td.kmImageContent,
              table.kmSplitContentRightContentContainer td.kmImageContent {
                  padding-top: 9px !important
              }
              td[class="rowContainer kmFloatLeft"],
              td.rowContainer.kmFloatLeft,
              td[class="rowContainer kmFloatLeft firstColumn"],
              td.rowContainer.kmFloatLeft.firstColumn,
              td[class="rowContainer kmFloatLeft lastColumn"],
              td.rowContainer.kmFloatLeft.lastColumn {
                  float: left;
                  clear: both;
                  width: 100% !important
              }
              table[class=templateContainer],
              table[class="templateContainer brandingContainer"],
              div[class=templateContainer],
              div[class="templateContainer brandingContainer"],
              table[class=templateRow] {
                  max-width: 600px !important;
                  width: 100% !important
              }
              h1 {
                  font-size: 24px !important;
                  line-height: 130% !important
              }
              h2 {
                  font-size: 20px !important;
                  line-height: 130% !important
              }
              h3 {
                  font-size: 18px !important;
                  line-height: 130% !important
              }
              h4 {
                  font-size: 16px !important;
                  line-height: 130% !important
              }
              td[class=kmTextContent] {
                  font-size: 14px !important;
                  line-height: 130% !important
              }
              td[class=kmTextBlockInner] td[class=kmTextContent] {
                  padding-right: 18px !important;
                  padding-left: 18px !important
              }
              table[class="kmTableBlock kmTableMobile"] td[class=kmTableBlockInner] {
                  padding-left: 9px !important;
                  padding-right: 9px !important
              }
              table[class="kmTableBlock kmTableMobile"] td[class=kmTableBlockInner] [class=kmTextContent] {
                  font-size: 14px !important;
                  line-height: 130% !important;
                  padding-left: 4px !important;
                  padding-right: 4px !important
              }
              }
          </style>
          <!--[if mso]>
          <style>
            
            .templateContainer {
              border: 1px none #aaaaaa;
              background-color: #FFFFFF;
              
            }
            #brandingContainer {
              background-color: transparent !important;
              border: 0;
            }
            
            
            .templateContainerInner {
              padding: 0px;
            }
            
          </style>
          <![endif]-->
      </head>
        <body style="margin:0;padding:0;background-color:#FFF">
          <center>
            <table align="center" border="0" cellpadding="0" cellspacing="0" id="bodyTable" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#FFF;height:100%;margin:0;width:100%">
              <tbody>
                <tr>
                  <td align="center" id="bodyCell" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%">
                    <!--[if !mso]><!-->
                    <div class="templateContainer" style="border:1px none #aaa;background-color:#FFF;display: table; width:600px">
                      <div class="templateContainerInner" style="padding:0">
                        <!--<![endif]-->
                  <!--[if mso]>
                    <table border="0" cellpadding="0" cellspacing="0" class="templateContainer"  width="600" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                    <tbody>
                      <tr>
                        <td class="templateContainerInner" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                          <![endif]-->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                            <tr>
                              <td align="center" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                <table border="0" cellpadding="0" cellspacing="0" class="templateRow" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                  <tbody>
                                    <tr>
                                      <td class="rowContainer kmFloatLeft" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                        <table border="0" cellpadding="0" cellspacing="0" class="kmTextBlock" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                          <tbody class="kmTextBlockOuter">
                                            <tr>
                                              <td class="kmTextBlockInner" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" class="kmTextContentContainer" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                                  <tbody>
                                                    <tr>
                                                      <td class="kmTextContent" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#000;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;">
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" class="kmTextBlock" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                          <tbody class="kmTextBlockOuter">
                                            <tr>
                                              <td class="kmTextBlockInner" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" class="kmTextContentContainer" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0">
                                                  <tbody>
                                                    <tr>
                                                      <td class="kmTextContent" valign="top" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#000;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;">
                                                        <span style="color:#000000;"></span>
                                                        <!-- Your Content As below -->
                                                        <p style="margin:0;padding-bottom:1em;text-align: justify;"><span style="font-size:16px;"><span style="color: rgb(0, 0, 0);"><span style="font-family: arial,helvetica,sans-serif;"></span></span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Dear <strong> Host </strong>,</span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Please check below customer enquiry details</span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"> </p>
                                                        
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Customer Name : ${result.name} </span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Customer Email : ${result.email} </span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Message : ${result.message} </span></span></p>
                                                        <p style="margin:0;padding-bottom:1em"> </p>
                                                        <p style="margin:0;padding-bottom:1em"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">Thank you,</span></span></p>
                                                        <p style="margin:0;padding-bottom:0"><span style="font-family:arial,helvetica,sans-serif;"><span style="font-size: 16px;">${globals.app_name} Team</span></span></p>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if !mso]><!-->
                        </div>
                      </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </center>
        </body>
    </html>
    `;
        callback(template);
    }






// https://stackoverflow.com/questions/13151693/passing-arguments-to-require-when-loading-module