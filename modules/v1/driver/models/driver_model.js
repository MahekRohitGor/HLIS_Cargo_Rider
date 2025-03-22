const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const en = require("../../../../language/en");
const fr = require("../../../../language/fr");
const guj = require("../../../../language/guj");
const validator = require("../../../../middlewares/validator");
var lib = require('crypto-lib');
const moment = require('moment');

const { t } = require('localizify');
const { drop } = require("lodash");
const { schedule } = require("node-cron");

class driverModel{
        async findExistingDriver(database, email_id, phone_number = null) {
            const findDriverQuery = `SELECT * FROM tbl_driver WHERE (email_id = ? OR phone_number = ?) AND is_deleted = 0 AND is_active = 1`;
            const [existingDriver] = await database.query(findDriverQuery, [email_id, phone_number || email_id]);
            return existingDriver;
        }
        
        async handleExistingDriverOTP(database, user, callback) {
            if (user.otp) {
                return callback(common.encrypt({
                    code: response_code.VERIFICATION_PENDING,
                    message: t('verify_account_driver_exists')
                }));
            }
        
            const otp_ = common.generateOtp(4);
            const updateOtpQuery = `UPDATE tbl_driver SET otp = ? WHERE driver_id = ?`;
            await database.query(updateOtpQuery, [otp_, user.driver_id]);
        
            return callback(common.encrypt({
                code: response_code.VERIFICATION_PENDING,
                message: t('otp_sent_please_verify_acc'),
                data: user.email_id
            }));
        }
        
        calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        async signup(request_data, callback) {
            try {
                const data_received = {
                    email_id: request_data.email_id,
                    signup_type: request_data.signup_type
                };
        
                const device_data = {
                    device_type: request_data.device_type,
                    os_version: request_data.os_version,
                    app_version: request_data.app_version,
                    time_zone: request_data.time_zone
                };
        
                let driverData;
                let insertResult;
        
                if (data_received.signup_type === 'S') {
                    driverData = {
                        full_name: request_data.full_name,
                        email_id: request_data.email_id,
                        company_name: request_data.company_name,
                        code_id: request_data.code_id,
                        phone_number: request_data.mobile_number,
                        password_: md5(request_data.passwords),
                        signup_type: request_data.signup_type,
                        login_type: request_data.signup_type
                    };
        
                    const existingDriver = await this.findExistingDriver(database, driverData.email_id, driverData.phone_number);
                    
                    if (existingDriver.length > 0) {
                        return await this.handleExistingDriverOTP(database, existingDriver[0], callback);
                    }
        
                } else {
                    driverData = {
                        email_id: data_received.email_id,
                        social_id: request_data.social_id,
                        signup_type: request_data.signup_type
                    };
                
                    const existingUser = await this.findExistingDriver(database, data_received.email_id);
                    if (existingUser.length > 0) {
                        return await this.handleExistingDriverOTP(database, existingUser[0], callback);
                    }
                }
                
                const insertIntoDriver = `INSERT INTO tbl_driver SET ?`;
                [insertResult] = await database.query(insertIntoDriver, [driverData]);
                
                const devicetoken = common.generateToken(40);
                device_data.device_token = devicetoken;
                device_data.driver_id = insertResult.insertId;
                
                const insertDeviceData = `INSERT INTO tbl_device_info_driver SET ?`;
                await database.query(insertDeviceData, device_data);
                
                const otp_ = common.generateOtp(4);
                const updateOtpQuery = `UPDATE tbl_driver SET otp = ?, is_profile_completed = 0 WHERE driver_id = ?`;
                await database.query(updateOtpQuery, [otp_, insertResult.insertId]);
                
                const userFind = `SELECT full_name FROM tbl_driver WHERE driver_id = ? AND is_active = 1 AND is_deleted = 0`;
                const [user] = await database.query(userFind, [insertResult.insertId]);
                
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('signup_success'),
                    data: user
                }));
                
                } catch (error) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('some_error_occurred'),
                        data: error.message
                    }));
                }
        }
    
        async verifyOTP(request_data, callback) {
            try {
                const { code_id, phone_number, otp } = request_data;
                const selectDriverQuery = `
                    SELECT driver_id, otp, is_profile_completed 
                    FROM tbl_driver 
                    WHERE phone_number = ? AND code_id = ? AND is_active = 1 AND is_deleted = 0
                `;
                const [driverResult] = await database.query(selectDriverQuery, [phone_number, code_id]);
        
                if (driverResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('phone_number_not_registered')
                    }));
                }
        
                const driver = driverResult[0];
                const driver_id = driver.driver_id;
        
                if (!driver.otp) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('otp_not_found')
                    }));
                }
        
                if (request_data.otp === driver.otp) {
                    const updatedriverQuery = `
                        UPDATE tbl_driver 
                        SET otp = NULL, 
                            is_profile_completed = 1 
                        WHERE driver_id = ?
                    `;
                    await database.query(updatedriverQuery, [driver_id]);
        
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('otp_verify_success')
                    }));
                } else {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_otp')
                    }));
                }
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
    
        async forgotPassword(request_data, callback) {
            try {
                if (!request_data.email_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('provide_email')
                    }));
                }
        
                const data = {};
                let driverQuery = "SELECT * FROM tbl_driver WHERE email_id = ? and is_active = 1 and is_deleted = 0";
                const [driverResult] = await database.query(driverQuery, [request_data.email_id]);
        
                if (driverResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('user_not_found_signup_req')
                    }));
                }
        
                const driver = driverResult[0];
                if(driver.signup_type != 'S'){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('signup_type_invalid_for_forgot_pswd'),
                        data: driver.fname
                    }))
                }
    
                const existingToken = `SELECT * from tbl_forgot_password_driver where email_id = ? and expires_at > NOW()`;
                console.log(request_data.email_id);
                const [exitingTokenData] = await database.query(existingToken, [request_data.email_id]);
                if(exitingTokenData.length > 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('token_sent_already_req_after_1hr'),
                        data: exitingTokenData[0].reset_token
                    }))
                }
    
                const otp = common.generateToken(4);
                const tokenData = {
                    otp: otp,
                    expires_at: new Date(Date.now() + 3600000)
                };
        
                tokenData.email_id = request_data.email_id;
    
                await database.query("INSERT INTO tbl_forgot_password_driver SET ?", tokenData);
                
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('password_reset_token_sent')
                }));
        
            } catch(error) {
                console.error(error);
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: error.sqlMessage || t('forgot_password_error')
                }));
            }
        }
    
        async login(request_data, callback) {
            try {
                const login_type = request_data.login_type;
        
                if (login_type === 'S') {
                    const email_id = request_data.email_id;
                    const password_ = md5(request_data.passwords);
        
                    const findDriver = `
                        SELECT driver_id, full_name, signup_type 
                        FROM tbl_driver 
                        WHERE email_id = ? 
                        AND password_ = ? 
                        AND is_active = 1 
                        AND is_deleted = 0 
                        AND is_profile_completed = 1
                    `;
                    const [driver] = await database.query(findDriver, [email_id, password_]);
        
                    if (driver.length === 0) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('driver_not_found')
                        }));
                    }
        
                    if (driver[0].signup_type !== 'S') {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('invalid_login_type')
                        }));
                    }
        
                    const token = common.generateToken(40);
                    const updatedriver = `
                        UPDATE tbl_driver 
                        SET login_type = 'S', 
                            driver_token = ?, 
                            is_login = 1 
                        WHERE driver_id = ?
                    `;
                    await database.query(updatedriver, [token, driver[0].driver_id]);
        
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('login_success'),
                        data: "WELCOME " + driver[0].full_name
                    }));
        
                } else {
                    const email_id = request_data.email_id;
                    const social_id = request_data.social_id;
                    const login_type = request_data.login_type;
                    
                    if(login_type !== 'G' && login_type !== 'F'){
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('invalid_login_type')
                        }));
                    }

                    if (!email_id || !social_id) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('missing_required_fields')
                        }));
                    }
        
                    const findDriver = `
                        SELECT driver_id, full_name, signup_type 
                        FROM tbl_driver
                        WHERE email_id = ? 
                        AND social_id = ?
                        AND is_active = 1 
                        AND is_deleted = 0 
                        AND is_profile_completed = 1
                    `;
                    const [driver] = await database.query(findDriver, [email_id, social_id]);
        
                    if (driver.length === 0) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('driver_not_found')
                        }));
                    }
        
                    if (driver[0].signup_type !== login_type) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('singup_login_type_mismatch')
                        }));
                    }

                    const updatedriver = `
                        UPDATE tbl_driver
                        SET login_type = ?,  
                            is_login = 1 
                        WHERE driver_id = ?
                    `;
                    await database.query(updatedriver, [login_type, token, driver[0].driver_id]);
        
                    const device_token = common.generateToken(40);
                    const token = common.generateToken(40);

                    const updateDeviceToken = `
                        UPDATE tbl_device_info_driver 
                        SET device_token = ?, driver_token = ? 
                        WHERE driver_id = ?
                    `;
                    await database.query(updateDeviceToken, [device_token, driver[0].driver_id]);
        
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('login_success'),
                        data: "WELCOME " + driver[0].full_name
                    }));
                }
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occured'),
                    data: error.message
                }));
            }
        }

        async resetPassword(requested_data, callback){
            const { otp, new_password } = requested_data;
                
            try {
                const selectTokenQuery = `
                    SELECT email_id FROM tbl_forgot_password_driver 
                    WHERE otp = '${otp}' AND expires_at > NOW()
                `;
                
                const [result] = await database.query(selectTokenQuery);
                console.log(result);
                
                if (!result.length) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('invalid_expired_reset_token')
                    }));
                }
                
                const email_id = result[0].email_id;
                const hashedPassword = md5(new_password);
                
                const updatePasswordQuery = "UPDATE tbl_driver SET password_ = ? WHERE email_id = ?";
                await database.query(updatePasswordQuery, [hashedPassword, email_id]);
                
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('password_reset_success')
                }));
                
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: error.sqlMessage || t('password_reset_error')
                }));
            }
        }

        async change_password(request_data, driver_id, callback){
    
            var selectQuery = "SELECT * FROM tbl_driver WHERE driver_id = ? and is_login = 1";
            try {
                const [rows] = await database.query(selectQuery, [driver_id]);
                
                if (!rows || rows.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_data_found')
                    }));
                }
                const user = rows[0];
        
                const oldPasswordHash = md5(request_data.old_password);
                const newPasswordHash = md5(request_data.new_password);
    
                console.log(oldPasswordHash);
                console.log(user.password_);
                if (oldPasswordHash !== user.password_) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('old_password_mismatch')
                    }));
                }
        
                if (newPasswordHash === user.password_) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('old_new_password_same')
                    }));
                }
        
                const data = {
                    password_: newPasswordHash
                };
    
                const updateQuery = "UPDATE tbl_driver SET ? where driver_id = ?";
                await database.query(updateQuery, [data, driver_id]);
    
                const selectUser = "SELECT * FROM tbl_driver where driver_id = ?"
                const [result] = await database.query(selectUser, [driver_id]);
    
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('password_changed_success'),
                    data: result
                }));
        
            } catch (error) {
                console.error('Change Password Error:', error);
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: error.message || t('password_change_error')
                }));
            }
        }
        
        async logout(request_data, driver_id, callback){
            try{
                const [result] = await database.query("SELECT * FROM tbl_driver WHERE driver_id = ? and is_login = 1", [driver_id]);
                if(result.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_user_found')
                    }));
                }

                const updateQuery = "UPDATE tbl_driver SET driver_token = NULL, is_login = 0 WHERE driver_id = ?";
                await database.query(updateQuery, [driver_id]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('logout_success')
                }));
        
            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        } 

        async add_vehicle_data(request_data, driver_id, callback){
            try{
                const vehicle_data = {
                    driver_id: driver_id,
                    vehicle_type_id: request_data.vehicle_type_id,
                    number_plate: request_data.number_plate,
                    model_name: request_data.model_name,
                    owner_name: request_data.owner_name,
                    owner_phone_number: request_data.owner_phone_number,
                    vehicle_company: request_data.vehicle_company,
                    vehicle_rto: request_data.vehicle_rto
                }

                const [existing_data] = await database.query(`SELECT number_plate FROM tbl_vehicle WHERE number_plate = ?`, [vehicle_data.number_plate]);
                if(existing_data.length > 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('vehicle_already_added')
                    }));
                }

                const insertVechicleData = `INSERT INTO tbl_vehicle SET ?`;
                const [newvehicle] = await database.query(insertVechicleData, [vehicle_data]);
                const vehicle_id = newvehicle.insertId;

                const vehicle_doc_data = {
                    vehicle_id: vehicle_id,
                    adhar_card_front: request_data.adhar_card_front,
                    adhar_card_back: request_data.adhar_card_back,
                    pan_card_front: request_data.pan_card_front,
                    pan_card_back: request_data.pan_card_back,
                    driving_lic_card_front: request_data.driving_lic_card_front,
                    driving_lic_card_back: request_data.driving_lic_card_back
                }

                const insertDoc = `INSERT INTO tbl_vehicle_doc SET ?`;
                await database.query(insertDoc, [vehicle_doc_data]);

                const updateDriver = `UPDATE tbl_driver SET is_doc_uploaded = 1, is_doc_verified = 0 WHERE driver_id = ?`;
                await database.query(updateDriver, [driver_id]);

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('vehicle_data_added'),
                    data: "Thank you for adding vehicle data"
                }));

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }))
            }
        }


}

module.exports = new driverModel();