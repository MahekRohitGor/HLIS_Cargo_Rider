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
const constants = require("../../../../config/constants");

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

            // send otp
            const subject = "Cargo Rider - OTP for Verification";
            const message = `Your OTP for verification is ${otp_}`;
            const email = user.email_id;

            try {
                await common.sendMail(subject, email, message);
                console.log("OTP email sent successfully!");
            } catch (error) {
                console.error("Error sending OTP email:", error);
            }

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

                // send otp to driver
                const subject = "Cargo Rider - OTP for Verification";
                const message = `Your OTP for verification is ${otp_}`;
                const email = request_data.email_id;

                try {
                    await common.sendMail(subject, email, message);
                    console.log("OTP email sent successfully!");
                } catch (error) {
                    console.error("Error sending OTP email:", error);
                }
                
                const userFind = `SELECT full_name FROM tbl_driver WHERE driver_id = ? AND is_active = 1 AND is_deleted = 0`;
                const [user] = await database.query(userFind, [insertResult.insertId]);

                // Welcome email to driver
                const subject_email = "Welcome to Cargo Rider!";
                const message_email = `
                    Dear User, 

                    Welcome to Cargo Rider! We're excited to have you onboard. 
                    Your account has been successfully created. You can now start using our platform for seamless cargo transportation.
                    If you ever need assistance, feel free to reach out to our support team.

                    Happy Riding!

                    Best Regards,  
                    Cargo Rider Team
                `;

                try {
                    await common.sendMail(subject_email, email, message_email);
                    console.log("Welcome Email Sent Success");
                } catch (error) {
                    console.error("Error sending Welcome email:", error);
                }
                
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
                const { email_id, otp } = request_data;
                const selectDriverQuery = `
                    SELECT driver_id, otp, is_profile_completed 
                    FROM tbl_driver 
                    WHERE email_id = ? AND is_active = 1 AND is_deleted = 0
                `;
                const [driverResult] = await database.query(selectDriverQuery, [email_id]);
        
                if (driverResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('email_id_not_registered')
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

                    const subject_email = "Cargo Rider | Your Email has been verified!";
                    const message_email = `
                        OTP Verification was successful ! You can now login to our CARGO RIDER APP
                    `;

                    try {
                        await common.sendMail(subject_email, request_data.email_id, message_email);
                        console.log("Verify Email Sent Success");
                    } catch (error) {
                        console.error("Error sending Verify email:", error);
                    }
        
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

                // send link to driver

                const url = "http://localhost:8000/resetemailpassword.php?token=" + otp;
                const subject = "Cargo Rider - Reset Password";
                const message = `Click on the link to reset your password: ${url}`;
                const email = request_data.email_id;

                try {
                    await common.sendMail(subject, email, message);
                    console.log("Reset Password Email Sent Success");
                } catch (error) {
                    console.error("Error sending Reset Password email:", error);
                }

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

        async add_vehicle_data(request_data, driver_id, files, callback){
            try{
                if (!files || Object.keys(files).length === 0) {
                    return common.response(res, common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: 'No documents uploaded'
                    }));
                }

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
                    adhar_card_front: files.adhar_card_front ? files.adhar_card_front[0].path : null,
                    adhar_card_back: files.adhar_card_back ? files.adhar_card_back[0].path : null,
                    pan_card_front: files.pan_card_front ? files.pan_card_front[0].path : null,
                    pan_card_back: files.pan_card_back ? files.pan_card_back[0].path : null,
                    driving_lic_card_front: files.driving_lic_card_front ? files.driving_lic_card_front[0].path : null,
                    driving_lic_card_back: files.driving_lic_card_back ? files.driving_lic_card_back[0].path : null
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

        async list_nearby_orders(request_data, driver_id, callback) {
            try {
                if (!driver_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_driver_id')
                    }));
                }

                const [driver] = await database.query(`
                    SELECT latitude, longitude
                    FROM tbl_driver
                    WHERE driver_id = ?
                    AND is_active = 1
                    AND is_deleted = 0
                `, [driver_id]);

                if (!driver || driver.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('driver_not_found')
                    }));
                }

                const driver_latitude = parseFloat(driver[0].latitude);
                const driver_longitude = parseFloat(driver[0].longitude);

                if (!driver_latitude || !driver_longitude) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('driver_location_not_available')
                    }));
                }

                const [orders] = await database.query(`
                    SELECT 
                        do.order_id,
                        do.user_id,
                        do.vehicle_id,
                        do.pickup_latitude,
                        do.pickup_longitude,
                        do.pickup_address,
                        do.dropoff_latitude,
                        do.dropoff_longitude,
                        do.dropoff_address,
                        do.distance_km,
                        do.total_price,
                        do.requires_pod,
                        do.scheduled_time,
                        do.status,
                        do.created_at,
                        do.updated_at,
                        v.model_name,
                        v.number_plate,
                        (
                            6371 * acos(
                                cos(radians(?)) * cos(radians(do.pickup_latitude)) * 
                                cos(radians(do.pickup_longitude) - radians(?)) + 
                                sin(radians(?)) * sin(radians(do.pickup_latitude))
                            )
                        ) AS distance_from_driver
                    FROM tbl_delivery_order do
                    LEFT JOIN tbl_vehicle v ON do.vehicle_id = v.vehicle_id
                    WHERE do.status = 'pending'
                    AND do.is_canceled = 0
                    HAVING distance_from_driver <= 100
                    ORDER BY distance_from_driver ASC
                    LIMIT 20
                `, [driver_latitude, driver_longitude, driver_latitude]);

                if (orders.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('no_nearby_orders_found'),
                        data: {
                            orders: []
                        }
                    }));
                }

                const [user_data] = await database.query(`SELECT full_name, phone_number FROM tbl_user WHERE user_id = ?`, [orders[0].user_id]);
                const user = user_data[0];

                const formattedOrders = orders.map(order => ({
                    order_id: order.order_id,
                    user: user,
                    pickup: {
                        latitude: order.pickup_latitude,
                        longitude: order.pickup_longitude,
                        address: order.pickup_address
                    },
                    dropoff: {
                        latitude: order.dropoff_latitude,
                        longitude: order.dropoff_longitude,
                        address: order.dropoff_address
                    },
                    distance_km: order.distance_km,
                    total_price: order.total_price,
                    requires_pod: order.requires_pod,
                    scheduled_time: order.scheduled_time,
                    status: order.status,
                    distance_from_driver: Math.round(order.distance_from_driver * 100) / 100,
                    created_at: order.created_at,
                    updated_at: order.updated_at
                }));

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('nearby_orders_listed_successfully'),
                    data: {
                        orders: formattedOrders
                    }
                }));

            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
        
        async accept_order(request_data, driver_id, callback) {
            try {
                const { order_id } = request_data;
                console.log(order_id);
        
                if (!order_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_order_id')
                    }));
                }
        
                const [order] = await database.query(`
                    SELECT * FROM tbl_delivery_order
                    WHERE order_id = ?
                    AND status = 'pending'
                    AND is_canceled = 0
                `, [order_id]);
        
                if (!order || order.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_not_found')
                    }));
                }
        
                const [driver] = await database.query(`
                    SELECT * FROM tbl_driver
                    WHERE driver_id = ?
                `, [driver_id]);
        
                if (!driver || driver.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('driver_not_found')
                    }));
                }
        
                const [vehicle] = await database.query(`
                    SELECT * FROM tbl_vehicle
                    WHERE driver_id = ?
                `, [driver_id]);
        
                if (!vehicle || vehicle.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('vehicle_not_found')
                    }));
                }
        
                const driver_vehicle_id = vehicle[0].vehicle_id;
        
                const updateOrder = `
                    UPDATE tbl_delivery_order
                    SET vehicle_id = ?, 
                        status = 'accepted',
                        delivery_status = 'confirmed'
                    WHERE order_id = ?
                `;
                await database.query(updateOrder, [driver_vehicle_id, order_id]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('order_accepted_successfully')
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
        
        async updateDeliveryStatus(request_data, driver_id, callback) {
            try {
                const { order_id, delivery_status } = request_data;
        
                if (!order_id || !delivery_status) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }
        
                const [order] = await database.query(`
                    SELECT * FROM tbl_delivery_order
                    WHERE order_id = ?
                    AND status = 'accepted'
                    AND is_canceled = 0
                `, [order_id]);
        
                if (!order || order.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_not_found_or_not_accepted')
                    }));
                }

                const findDriver = `SELECT * FROM tbl_vehicle WHERE driver_id = ?`;
                const [driver] = await database.query(findDriver, [driver_id]);
        
                if (driver[0].driver_id !== driver_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('unauthorized_driver')
                    }));
                }
        
                const validStatuses = ['waytopickup', 'waytodropoff', 'delivered'];
                if (!validStatuses.includes(delivery_status)) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_delivery_status')
                    }));
                }

                if (delivery_status === 'delivered') {
                    const otp = common.generateOtp(4);
        
                    // Replace with actual OTP sending logic (SMS, email, notification, etc.)
                    console.log(`OTP sent to user: ${otp}`);
        
                    await database.query(`
                        UPDATE tbl_delivery_order
                        SET delivery_otp = ?
                        WHERE order_id = ?
                    `, [otp, order_id]);

                }
        
                const updateQuery = `
                    UPDATE tbl_delivery_order
                    SET delivery_status = ?, updated_at = NOW()
                    WHERE order_id = ?
                `;
                await database.query(updateQuery, [delivery_status, order_id]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('delivery_status_updated_successfully')
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
        
        async get_upcoming_deliveries(request_data, driver_id, callback) {
            try{
                const [driver] = await database.query(`SELECT * from tbl_vehicle where driver_id = ?`, [driver_id]);
                if(driver.length === 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('no_vehicle_found')
                    }));
                }

                const vehicle_id = driver[0].vehicle_id;

                const [order] = await database.query(`SELECT * 
                    from tbl_delivery_order where vehicle_id = ? and 
                    status = 'accepted' and delivery_status = 'confirmed' 
                    and is_canceled = 0`, [vehicle_id]);

                if(order.length === 0){
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('no_upcoming_deliveries_found')
                    }));
                }

                const scheduled_time = new Date(order[0].scheduled_time);
        
                const order_date = scheduled_time.getFullYear() + '-' +
                        String(scheduled_time.getMonth() + 1).padStart(2, '0') + '-' +
                        String(scheduled_time.getDate()).padStart(2, '0');
        
                let hours = scheduled_time.getHours();
                const minutes = String(scheduled_time.getMinutes()).padStart(2, '0');
                const seconds = String(scheduled_time.getSeconds()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
        
                const order_time = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

                const data = {
                    pickup_address: order[0].pickup_address,
                    dropoff_address: order[0].dropoff_address,
                    order_date: order_date,
                    order_time: order_time
                }

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('upcoming_deliveries_found'),
                    data: data
                }));

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async verify_delivery(request_data, driver_id, callback) {
            try {
                const { order_id, delivery_otp } = request_data;
        
                if (!order_id || !delivery_otp) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }
        
                const [order] = await database.query(`
                    SELECT * FROM tbl_delivery_order WHERE order_id = ?
                `, [order_id]);
        
                if (!order || order.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('no_order_found')
                    }));
                }

                const [driver] = await database.query(`select * from tbl_vehicle where driver_id = ?`, [driver_id]);
                const vehicle_id = driver[0].vehicle_id;
        
                if (order[0].vehicle_id !== vehicle_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('unauthorized_driver')
                    }));
                }

                if (order[0].delivery_otp !== delivery_otp) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_otp')
                    }));
                }

                const distance_km = order[0].distance_km;
                const order_points = distance_km * 100;
                console.log(order_points);
                const earnings_rs = (order_points / 50) * 20;
                console.log(earnings_rs);
        
                await database.query(`
                    UPDATE tbl_delivery_order
                    SET delivery_otp = NULL, order_points = ?, 
                    earnings_rs = ?, updated_at = NOW(), status = 'completed'
                    WHERE order_id = ?
                `, [order_points, earnings_rs, order_id]);

                // send email to user that order was delivered successfully
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('otp_verified_successfully'),
                    data: order[0]
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
        
        async set_availability(request_data, driver_id, callback) {
            try {
                const { days, startTime, endTime, radius_km } = request_data;
        
                if (!days || !startTime || !endTime || days.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }

                await database.query(`DELETE FROM tbl_driver_availability WHERE driver_id = ?`, [driver_id]);
        
                const values = days.map((day, index) => [
                    driver_id,
                    day,
                    startTime[index],
                    endTime[index],
                    radius_km || 5.00
                ]);

                console.log(values);
        
                const insertQuery = `
                    INSERT INTO tbl_driver_availability (driver_id, day, start_time, end_time, radius_km)
                    VALUES ?
                `;
        
                await database.query(insertQuery, [values]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('availability_set_successfully')
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }        
        
        async show_earnings(request_data, driver_id, callback){
            try{
                const [driver] = await database.query(`SELECT * FROM tbl_vehicle where driver_id = ?`, [driver_id]);
                const vehicle_ids = driver.map(vehicle => vehicle.vehicle_id);
                var query;

                if(request_data.week){
                    console.log("WEEK");
                    query = `
                    SELECT order_id, pickup_address, dropoff_address, earnings_rs
                    FROM tbl_delivery_order
                    WHERE vehicle_id IN (?)
                    AND status = 'completed'
                    AND delivery_status = 'delivered'
                    AND updated_at >= NOW() - INTERVAL 7 DAY;
                `;
                    
                } else if(request_data.month){
                    console.log("MONTH");
                    query = `
                    SELECT order_id, pickup_address, dropoff_address, earnings_rs
                    FROM tbl_delivery_order
                    WHERE vehicle_id IN (?)
                    AND status = 'completed'
                    AND delivery_status = 'delivered'
                    AND updated_at >= NOW() - INTERVAL 30 DAY;`;

                } else if(request_data.year){
                    console.log("YEAR");
                    query = `
                    SELECT order_id, pickup_address, dropoff_address, earnings_rs
                    FROM tbl_delivery_order
                    WHERE vehicle_id IN (?)
                    AND status = 'completed'
                    AND delivery_status = 'delivered'
                    AND updated_at >= NOW() - INTERVAL 365 DAY;`;

                } else{
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }

                const [orders] = await database.query(query, [vehicle_ids]);

                const formattedOrders = orders.map(order => ({
                    order_id: order.order_id,
                    pickup_address: order.pickup_address,
                    dropoff_address: order.dropoff_address,
                    earnings_rs: parseFloat(order.earnings_rs) || 0
                }));
                
                const total_earnings = formattedOrders.reduce((sum, order) => sum + order.earnings_rs, 0).toFixed(2);
                
                const response = {
                    orders: formattedOrders,
                    total_earnings: total_earnings
                };
                
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('orders_and_earnings_fetched_successfully'),
                    data: response
                }));                

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }))
            }
        }

        async list_driver_notification(request_data, driver_id, callback){
            try{
                const getNotifications = `SELECT * FROM tbl_driver_notification WHERE driver_id = ?`;
                const [notifications] = await database.query(getNotifications, [driver_id]);

                
                const response = notifications.map(notification => ({
                    cover_image: notification.cover_image ? constants.link + notification.cover_image : null,
                    title: notification.title,
                    description: notification.descriptions
                }));

                if(notifications.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_notifications_found')
                    }));
                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('notifications_listed_successfully'),
                    data: response
                }));
        
            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async show_ratings(request_data, driver_id, callback){
            try{
                const selectRatingQuery = `select u.full_name, u.profile_pic, rrd.rating, rrd.review 
                    from tbl_rating_review_driver rrd inner join tbl_user u
                    on u.user_id = rrd.user_id where rrd.driver_id = ?;`
                
                const [ratings] = await database.query(selectRatingQuery, [driver_id]);

                if(ratings.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_ratings_found')
                    }));
                }

                const resp = ratings.map(rating => ({
                    user_name: rating.full_name,
                    profile_pic: rating.profile_pic ? constants.link + rating.profile_pic : null,
                    rating: rating.rating,
                    review: rating.review
                }));

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('ratings_found_successfully'),
                    data: resp
                }));


            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occured'),
                    data: error.message
                }))
            }
        }
}

module.exports = new driverModel();