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

const {forgot_password, contactUs, sendOTP, welcomeEmail, orderConfirmationEmail} = require("../../../../template");

const { t } = require('localizify');
const { drop } = require("lodash");
const { schedule } = require("node-cron");

class userModel{
        async findExistingUser(database, email_id, phone_number = null) {
            const findUserQuery = `SELECT * FROM tbl_user WHERE (email_id = ? OR phone_number = ?) AND is_deleted = 0 AND is_active = 1`;
            const [existingUser] = await database.query(findUserQuery, [email_id, phone_number || email_id]);
            return existingUser;
        }
        
        async handleExistingUserOTP(database, user, callback) {
            if (user.otp) {
                return callback(common.encrypt({
                    code: response_code.VERIFICATION_PENDING,
                    message: t('verify_account_user_exists')
                }));
            }
        
            const otp_ = common.generateOtp(4);
            const subject = "Cargo Rider - OTP for Verification";
            // const message = `Your OTP for verification is ${otp_}`;
            const email = user.email_id;

            const data = {
                name: user.full_name || 'User',
                otp: otp_
            }
            
            try {
                const htmlMessage = sendOTP(data);
                await common.sendMail(subject, email, htmlMessage);
                console.log("OTP email sent successfully!");
            } catch (error) {
                console.error("Error sending OTP email:", error);
            }

            const updateOtpQuery = `UPDATE tbl_user SET otp = ? WHERE user_id = ?`;
            await database.query(updateOtpQuery, [otp_, user.user_id]);
        
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

        async signup(request_data, files, callback) {
            try {
                if (!request_data.email_id || !request_data.signup_type) {
                    throw new Error("Email and signup type are required");
                }

                console.log("Request data:", request_data);
                console.log("Files:", files);

                const data_received = {
                    email_id: request_data.email_id,
                    signup_type: request_data.signup_type
                };
        
                const device_data = {
                    device_type: request_data.device_type,
                    os_version: request_data.os_version,
                    app_version: request_data.app_version
                };
        
                let userData;
                let insertResult;
        
                if (data_received.signup_type === 'S') {
                    userData = {
                        full_name: request_data.full_name,
                        email_id: request_data.email_id,
                        code_id: request_data.code_id,
                        phone_number: request_data.phone_number,
                        password_: md5(request_data.password_),
                        signup_type: request_data.signup_type,
                        profile_pic: files.profile_pic ? files.profile_pic[0].filename : null,
                    };
        
                    const existingUser = await this.findExistingUser(database, userData.email_id, userData.phone_number);
                    
                    if (existingUser.length > 0) {
                        return await this.handleExistingUserOTP(database, existingUser[0], callback);
                    }
        
                } else {
                    userData = {
                        email_id: data_received.email_id,
                        social_id: request_data.social_id,
                        signup_type: request_data.signup_type
                    };
                
                    const existingUser = await this.findExistingUser(database, data_received.email_id);
                    if (existingUser.length > 0) {
                        return await this.handleExistingUserOTP(database, existingUser[0], callback);
                    }
                }
                
                const insertIntoUser = `INSERT INTO tbl_user SET ?`;
                [insertResult] = await database.query(insertIntoUser, [userData]);
                
                const devicetoken = common.generateToken(40);
                device_data.device_token = devicetoken;
                device_data.user_id = insertResult.insertId;
                
                const insertDeviceData = `INSERT INTO tbl_device_info SET ?`;
                await database.query(insertDeviceData, device_data);
                
                const otp_ = common.generateOtp(4);
                const updateOtpQuery = `UPDATE tbl_user SET otp = ?, is_profile_completed = 0 WHERE user_id = ?`;
                await database.query(updateOtpQuery, [otp_, insertResult.insertId]);

                // send otp to driver
                const subject = "Cargo Rider - OTP for Verification";
                // const message = `Your OTP for verification is ${otp_}`;
                const email = request_data.email_id;

                const data = {
                    name: request_data.full_name || 'User',
                    otp: otp_
                }

                try {
                    const htmlMessage = sendOTP(data);
                    await common.sendMail(subject, email, htmlMessage);
                    console.log("OTP email sent successfully!");
                } catch (error) {
                    console.error("Error sending OTP email:", error);
                }
                
                const userFind = `SELECT full_name FROM tbl_user WHERE user_id = ? AND is_active = 1 AND is_deleted = 0`;
                const [user] = await database.query(userFind, [insertResult.insertId]);

                // Welcome email to driver
                const subject_email = "Welcome to Cargo Rider!";
                const welcomeMessageData = {
                    name: request_data.full_name || "User"
                }

                try {
                    const htmlMessage = welcomeEmail(welcomeMessageData);
                    await common.sendMail(subject_email, email, htmlMessage);
                    console.log("Welcome Email Sent Success");
                } catch (error) {
                    console.error("Error sending Welcome email:", error);
                }
                
                callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('signup_success'),
                    data: user
                }));
                
                } catch (error) {
                    callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('some_error_occurred'),
                        data: error.message
                    }));
                }
        }
    
        async verifyOTP(request_data, callback) {
            try {
                const { phone_number, otp } = request_data;
                const selectUserQuery = `
                    SELECT user_id, otp, is_profile_completed 
                    FROM tbl_user 
                    WHERE phone_number = ? AND is_active = 1 AND is_deleted = 0
                `;
                const [userResult] = await database.query(selectUserQuery, [phone_number]);
        
                if (userResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('phone_number_not_registered')
                    }));
                }
        
                const user = userResult[0];
                const user_id = user.user_id;
        
                if (!user.otp) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('otp_not_found')
                    }));
                }
        
                if (request_data.otp === user.otp) {
                    const updateUserQuery = `
                        UPDATE tbl_user 
                        SET otp = NULL, 
                            is_profile_completed = 1 
                        WHERE user_id = ?
                    `;
                    await database.query(updateUserQuery, [user_id]);
        
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
                let userQuery = "SELECT * FROM tbl_user WHERE email_id = ? and is_active = 1 and is_deleted = 0";
                const [userResult] = await database.query(userQuery, [request_data.email_id]);
        
                if (userResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('user_not_found_signup_req') // new
                    }));
                }
        
                const user = userResult[0];
                if(user.signup_type != 'S'){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('signup_type_invalid_for_forgot_pswd'), // new
                        data: user.fname
                    }))
                }
    
                const existingToken = `SELECT * from tbl_forgot_passwords where email_id = ? and expires_at > NOW()`;
                console.log(request_data.email_id);
                const [exitingTokenData] = await database.query(existingToken, [request_data.email_id]);
                if(exitingTokenData.length > 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('token_sent_already_req_after_1hr'), // new
                        data: exitingTokenData[0].reset_token
                    }))
                }
    
                const otp = common.generateToken(4);
                const tokenData = {
                    otp: otp,
                    expires_at: new Date(Date.now() + 3600000)
                };
        
                tokenData.email_id = request_data.email_id;
    
                await database.query("INSERT INTO tbl_forgot_passwords SET ?", tokenData);

                const url = "http://localhost:8000/resetemailpasswordUser.php?token=" + otp;
                const subject = "Cargo Rider - Reset Password";
                // const message = `Click on the link to reset your password: ${url}`;
                const email = request_data.email_id;

                const emailData = {
                    name: request_data.full_name || 'User',
                    url: url
                };

                try {
                    const htmlMessage = forgot_password(emailData);
                    await common.sendMail(subject, email, htmlMessage);
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
    
        async resetPassword(requested_data, callback){
            const { otp, new_password } = requested_data;
        
            try {
                const selectTokenQuery = `
                    SELECT email_id FROM tbl_forgot_passwords 
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
        
                const updatePasswordQuery = "UPDATE tbl_user SET passwords = ? WHERE email_id = ?";
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

        async login(request_data, callback) {
            try {
                const login_type = request_data.login_type;
        
                if (login_type === 'S') {
                    const email_id = request_data.email_id;
                    const password_ = md5(request_data.passwords);
        
                    const findUser = `
                        SELECT user_id, full_name, signup_type 
                        FROM tbl_user 
                        WHERE email_id = ? 
                        AND password_ = ? 
                        AND is_active = 1 
                        AND is_deleted = 0 
                        AND is_profile_completed = 1
                    `;
                    const [user] = await database.query(findUser, [email_id, password_]);
        
                    if (user.length === 0) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('user_not_found')
                        }));
                    }
        
                    if (user[0].signup_type !== 'S') {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('invalid_login_type')
                        }));
                    }
        
                    const token = common.generateToken(40);
                    const updateUser = `
                        UPDATE tbl_user 
                        SET login_type = 'S', 
                            user_token = ?, 
                            is_login = 1 
                        WHERE user_id = ?
                    `;
                    await database.query(updateUser, [token, user[0].user_id]);
        
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('login_success'),
                        data: "WELCOME " + user[0].full_name
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
        
                    const findUser = `
                        SELECT user_id, full_name, signup_type 
                        FROM tbl_user 
                        WHERE email_id = ? 
                        AND social_id = ?
                        AND is_active = 1 
                        AND is_deleted = 0 
                        AND is_profile_completed = 1
                    `;
                    const [user] = await database.query(findUser, [email_id, social_id]);
        
                    if (user.length === 0) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('user_not_found')
                        }));
                    }
        
                    if (user[0].signup_type !== login_type) {
                        return callback(common.encrypt({
                            code: response_code.OPERATION_FAILED,
                            message: t('singup_login_type_mismatch')
                        }));
                    }

                    const updateUser = `
                        UPDATE tbl_user 
                        SET login_type = ?,  
                            is_login = 1 
                        WHERE user_id = ?
                    `;
                    await database.query(updateUser, [login_type, token, user[0].user_id]);
        
                    const device_token = common.generateToken(40);
                    const token = common.generateToken(40);

                    const updateDeviceToken = `
                        UPDATE tbl_device_info 
                        SET device_token = ?, user_token = ? 
                        WHERE user_id = ?
                    `;
                    await database.query(updateDeviceToken, [device_token, user[0].user_id]);
        
                    return callback(common.encrypt({
                        code: response_code.SUCCESS,
                        message: t('login_success'),
                        data: "WELCOME " + user[0].full_name
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
        
        async list_vehicles(request_data, user_id, callback) {
            try {
                const latitude_pickup = request_data.pickup_latitude;
                const longitude_pickup = request_data.pickup_longitude;
                const latitude_drop = request_data.dropoff_latitude;
                const longitude_drop = request_data.dropoff_longitude;
        
                if (!latitude_pickup || !longitude_pickup || !latitude_drop || !longitude_drop) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }
        
                const distance_km = this.calculateDistance(latitude_pickup, longitude_pickup, latitude_drop, longitude_drop);
        
                const [vehicle_types] = await database.query(`
                    SELECT 
                    vt.vehicle_type_id,
                    vt.vehicle_type_name,
                    MIN(vt.vehicle_weight_kg) AS vehicle_weight_kg,
                    MIN(vt.height) AS height,
                    MIN(vt.width) AS width,
                    MIN(vt.depth) AS depth,
                    MIN(vt.unit) AS unit,
                    MIN(vt.speed_limit_kmh) AS speed_limit_kmh,
                    MIN(p.base_price) AS base_price,
                    MIN(p.price_per_km) AS price_per_km,
                    MIN(p.pod_fee) AS pod_fee,
                    COUNT(v.vehicle_id) AS available_count,
                    MIN(va.latitude) AS vehicle_latitude,
                    MIN(va.longitude) AS vehicle_longitude
                    FROM tbl_vehicle_type vt
                    LEFT JOIN tbl_vehicle v ON vt.vehicle_type_id = v.vehicle_type_id
                    LEFT JOIN tbl_vehicle_availability va ON v.vehicle_id = va.vehicle_id
                    LEFT JOIN tbl_pricing p ON vt.vehicle_type_id = p.vehicle_type_id
                    WHERE vt.is_active = 1 
                    AND vt.is_deleted = 0
                    AND v.is_active = 1
                    AND v.is_deleted = 0
                    AND va.is_available = 1
                    GROUP BY vt.vehicle_type_id, vt.vehicle_type_name
                    HAVING available_count > 0
                `);
        
                const availableVehicleTypes = vehicle_types.map(vt => {
                    const totalPrice = vt.base_price + (vt.price_per_km * distance_km);
        
                    const speed_kmh = vt.speed_limit_kmh || 20;
                    const estimated_time_hours = distance_km / speed_kmh;
                    const estimated_arrival_minutes = Math.round(estimated_time_hours * 60);

                    const vehicleLatitude = Number(vt.vehicle_latitude);
                    const vehicleLongitude = Number(vt.vehicle_longitude);

                    let estimated_time_vehicle_to_pickup_minutes = 0;
                    if (vehicleLatitude && vehicleLongitude) {
                        const distance_km_vehicle_to_pickup = this.calculateDistance(
                            vehicleLatitude,
                            vehicleLongitude,
                            latitude_pickup,
                            longitude_pickup
                        );

                        const speed_kmh = Number(vt.speed_limit_kmh) || 20;
                        const estimated_time_vehicle_to_pickup_hours = distance_km_vehicle_to_pickup / speed_kmh;
                        estimated_time_vehicle_to_pickup_minutes = Math.round(estimated_time_vehicle_to_pickup_hours * 60);
                    }

                    return {
                        vehicle_type_id: vt.vehicle_type_id,
                        name: vt.vehicle_type_name,
                        estimated_time_vehicle_to_pickup: `${estimated_time_vehicle_to_pickup_minutes} min`,
                        estimated_order_arrival: `${estimated_arrival_minutes} min`,
                        weight_capacity: `${vt.vehicle_weight_kg} kgs`,
                        dimensions: `${vt.width} x ${vt.height} x ${vt.depth} ${vt.unit}`,
                        price: `₹${totalPrice}`,
                        pod_fee: vt.pod_fee,
                        available_count: vt.available_count
                    };
                });
        
                availableVehicleTypes.sort((a, b) => {
                    const timeA = parseInt(a.estimated_arrival);
                    const timeB = parseInt(b.estimated_arrival);
                    return timeA - timeB;
                });
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('vehicles_listed_successfully'),
                    data: {
                        distance_km: Math.round(distance_km),
                        vehicle_types: availableVehicleTypes
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

        async create_delivery_order(request_data, user_id, callback) {
            try {
                const data = {
                    package_type_id: request_data.package_type_id,
                    weight_kg: request_data.weight_kg,
                    unit: request_data.unit,
                    height_feet: request_data.height_feet,
                    width_feet: request_data.width_feet,
                    notes: request_data.notes
                };

                const basePrice = 1000.00;
                const pricePerKm = 100.00;
                const podFee = 100.00;
        
                const insertPackage = `INSERT INTO tbl_package_details SET ?`;
                const [insertResult] = await database.query(insertPackage, [data]);
                const package_id = insertResult.insertId;
        
                const scheduled_time = request_data.scheduled_time 
                ? moment(request_data.scheduled_time).format('YYYY-MM-DD HH:mm:ss') 
                : moment().format('YYYY-MM-DD HH:mm:ss');

                const orderData = {
                    user_id: user_id,
                    package_id: package_id,
                    pickup_latitude: request_data.pickup_latitude,
                    pickup_longitude: request_data.pickup_longitude,
                    pickup_address: request_data.pickup_address,
                    dropoff_latitude: request_data.dropoff_latitude,
                    dropoff_longitude: request_data.dropoff_longitude,
                    dropoff_address: request_data.dropoff_address,
                    status: 'pending',
                    scheduled_time: scheduled_time,
                    tax: 100,
                    discount: 10,
                };

                if(request_data.requires_pod && request_data.requires_pod === 1){
                    orderData.requires_pod = 1;
                    orderData.pos_charge = podFee;
                }
          
                const insertOrder = `INSERT INTO tbl_delivery_order SET ?`;
                const [insertResultOrder] = await database.query(insertOrder, [orderData]);
                const order_id = insertResultOrder.insertId;
        
                const updatePackDetails = `UPDATE tbl_package_details SET order_id = ? WHERE package_id = ?`;
                await database.query(updatePackDetails, [order_id, package_id]);
        
                const receiver_data = {
                    full_name: request_data.full_name,
                    email_id: request_data.email_id,
                    code_id: request_data.code_id,
                    phone_number: request_data.phone_number,
                    address: request_data.address,
                    latitude: request_data.latitude,
                    longitude: request_data.longitude
                };
        
                const findReceiver = `SELECT * FROM tbl_receiver WHERE email_id = ? AND phone_number = ?`;
                const [receiverData] = await database.query(findReceiver, [receiver_data.email_id, receiver_data.phone_number]);
                
                let rec_id;
                let receiver;
                
                if (receiverData.length === 0) {
                    const insertReceiver = `INSERT INTO tbl_receiver SET ?`;
                    const [rec_data] = await database.query(insertReceiver, [receiver_data]);
                    rec_id = rec_data.insertId;

                    const getRecData = `SELECT * FROM tbl_receiver WHERE rec_id = ?`;
                    const [receiver_] = await database.query(getRecData, [rec_id]);
                    receiver = receiver_[0];

                } else {
                    rec_id = receiverData[0].rec_id;
                    receiver = receiverData[0];
                }

                console.log(receiver);
        
                const updateOrderData = `UPDATE tbl_delivery_order SET rec_id = ? WHERE order_id = ?`;
                await database.query(updateOrderData, [rec_id, order_id]);

                const getpackageData = `SELECT * FROM tbl_package_details WHERE package_id = ?`;
                const [packageData] = await database.query(getpackageData, [package_id]);
        
                const distance_km = await this.calculateDistance(
                    request_data.pickup_latitude,
                    request_data.pickup_longitude,
                    request_data.dropoff_latitude,
                    request_data.dropoff_longitude
                );

                const subtotal = basePrice + (pricePerKm * distance_km);
                const total_price = subtotal + orderData.tax - orderData.discount;
                await database.query(`UPDATE tbl_delivery_order SET distance_km = ?, total_price = ?, subtotal = ? WHERE order_id = ?`, [distance_km, total_price, subtotal, order_id]);
        
                const resp = {
                    pick_up_loc: request_data.pickup_address,
                    drop_off_loc: request_data.dropoff_address,
                    receiver: receiver,
                    item: packageData[0],
                    payment_data: "Cash on delivery",
                    order_status: "pending",
                    delivery_status: "confirmed",
                    distance: `${distance_km} km`,
                    time: `${Math.round(distance_km / 20)} min`,
                    subtotal: subtotal,
                    tax: orderData.tax,
                    discount: orderData.discount,
                    total_price: total_price,
                };

                const notificationQuery = `
                INSERT INTO tbl_notification 
                (title, cover_image, descriptions, user_id, notification_type) 
                VALUES (?, "notification.png", ?, ?, ?)
                `;

                const title = "Order Placed and Scheduled";
                const descriptions = `Order #${order_id} has been Placed and Scheduled at ${scheduled_time} successfully.`;
                const notificationType = "success";
                await database.query(notificationQuery, [title, descriptions, user_id, notificationType]); 
                
                const [user] = await database.query(`SELECT * FROM tbl_user WHERE user_id = ?`, [user_id]);

                const subject = "Cargo Rider - Order Summary";
                const orderDataEmail = {
                    order_id: order_id,
                    order_status: resp.order_status,
                    delivery_status: resp.delivery_status,
                    pick_up_loc: resp.pick_up_loc,
                    drop_off_loc: resp.drop_off_loc,
                    receiver_name: resp.receiver.full_name,
                    receiver_email: resp.receiver.email_id,
                    item: resp.item,
                    distance: resp.distance,
                    time: resp.time,
                    payment_data: resp.payment_data,
                    subtotal: resp.subtotal,
                    tax: resp.tax,
                    discount: resp.discount,
                    total_price: resp.total_price
                  };

                
                const email = user[0].email_id;
                
                try {
                    const htmlMessage = orderConfirmationEmail(orderDataEmail)
                    await common.sendMail(subject, email, htmlMessage);
                    console.log("Order email sent successfully!");
                } catch (error) {
                    console.error("Error sending OTP email:", error);
                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('order_created_successfully'),
                    data: resp
                }));
        
            } catch (error) {
                console.error("Error in create_delivery_order:", error.message);
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async list_notifications(request_data, user_id, callback){
            try{
                const getNotifications = `SELECT * FROM tbl_notification WHERE user_id = ?`;
                const [notifications] = await database.query(getNotifications, [user_id]);

                if(notifications.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_notifications_found')
                    }));
                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('notifications_listed_successfully'),
                    data: notifications
                }));
        
            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async cancel_order(request_data, user_id, callback) {
            try {
                const order_id = request_data.order_id;
                const cancel_res_id = request_data.cancel_order;
        
                const getOrder = `SELECT * FROM tbl_delivery_order WHERE order_id = ? AND user_id = ?`;
                const [order] = await database.query(getOrder, [order_id, user_id]);
        
                if (order.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('order_not_found')
                    }));
                }
        
                const currentStatus = order[0].status;
                const current_delivery_status = order[0].delivery_status;
                const cancellable_delivery_statuses = ['confirmed'];

                const vehicle_id = order[0].vehicle_id;
                const cancellableStatuses = ['pending', 'accepted'];

                const [driver] = await database.query(`SELECT * FROM tbl_vehicle WHERE vehicle_id = ?`, [vehicle_id]);
                const driver_id = driver[0].driver_id;
        
                if (currentStatus === 'cancelled') {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_already_cancelled')
                    }));
                }
        
                if (!cancellableStatuses.includes(currentStatus) && !cancellable_delivery_statuses.includes(current_delivery_status)) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_cannot_be_cancelled')
                    }));
                }
        
                if (vehicle_id) {
                    await database.query(`
                        UPDATE tbl_vehicle_availability 
                        SET is_available = 1, estimated_arrival_minutes = NULL 
                        WHERE vehicle_id = ?
                    `, [vehicle_id]);
                }
        
                const cancel_order = `
                    UPDATE tbl_delivery_order 
                    SET status = 'cancelled', is_canceled = 1, cancel_res_id = ? 
                    WHERE order_id = ? AND user_id = ?
                `;
                await database.query(cancel_order, [cancel_res_id, order_id, user_id]);

                if(cancellable_delivery_statuses.includes(current_delivery_status)){
                    const notificationQuery = `
                    INSERT INTO tbl_driver_notification 
                    (title, descriptions, driver_id, notification_type) 
                    VALUES (?, ?, ?, ?)
                    `;

                    const title = "Order Cancelled";
                    const descriptions = `Order #${order_id} has been cancelled successfully.`;
                    const notificationType = "cancel";
                    await database.query(notificationQuery, [title, descriptions, driver_id, notificationType]);

                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('order_cancelled_successfully')
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async contact_us(request_data, user_id, callback){
            try{
                const data = {
                    full_name: request_data.full_name,
                    email_address: request_data.email_address,
                    code_id: request_data.code_id,
                    phone_number: request_data.phone_number
                }

                const insertContact = `INSERT INTO tbl_contact_us SET ?`;
                const [contactInsert] = await database.query(insertContact, [data]);

                const subject = `Thank you for contacting us!`;
                const email = request_data.email_address;

                const contact_data = {
                    name: request_data.full_name,
                    email: request_data.email_address
                }
                console.log(contact_data.email);

                try {
                    const htmlMessage = contactUs(contact_data);
                    await common.sendMail(subject, email, htmlMessage);
                    console.log("Contact us Email Sent Success");
                } catch (error) {
                    console.error("Error sending Contact Us email:", error);
                }


                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('contact_us_success'),
                    data: contactInsert.insertId
                }));

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occured'),
                    data: error.message
                }))
            }
        }

        async list_user_orders(request_data, user_id, callback) {
            try {
                const is_running = request_data.is_running;
                const is_upcoming = request_data.is_upcoming;
        
                if ((is_running === 1 && is_upcoming === 1) || (is_running === 0 && is_upcoming === 0)) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_request')
                    }));
                }
        
                let query = `SELECT * FROM tbl_delivery_order WHERE user_id = ? AND status != 'cancelled'`;
                let queryParams = [user_id];
        
                if (is_running === 1) {
                    query += ` AND scheduled_time < NOW()`;
                } else if (is_upcoming === 1) {
                    query += ` AND scheduled_time >= NOW()`;
                }
        
                const [orders] = await database.query(query, queryParams);
        
                if (orders.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_orders_found')
                    }));
                }
        
                let order_list = [];
        
                for (let order of orders) {
                    const rec_id = order.rec_id;
        
                    const findReceiver = `SELECT * FROM tbl_receiver WHERE rec_id = ?`;
                    const [receiverData] = await database.query(findReceiver, [rec_id]);
        
                    const createdAt = new Date(order.created_at);
        
                    const order_date = createdAt.getFullYear() + '-' +
                        String(createdAt.getMonth() + 1).padStart(2, '0') + '-' +
                        String(createdAt.getDate()).padStart(2, '0');
        
                    let hours = createdAt.getHours();
                    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
                    const seconds = String(createdAt.getSeconds()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
        
                    const order_time = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
        
                    order_list.push({
                        receiver_details: receiverData[0] || null,
                        order_id: order.order_id,
                        order_date: order_date,
                        order_time: order_time
                    });
                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('orders_fetched_successfully'),
                    data: order_list
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }

        async change_password(request_data, user_id, callback){
    
            var selectQuery = "SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1";
            try {
                const [rows] = await database.query(selectQuery, [user_id]);
                
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
    
                const updateQuery = "UPDATE tbl_user SET ? where user_id = ?";
                await database.query(updateQuery, [data, user_id]);
    
                const selectUser = "SELECT * FROM tbl_user where user_id = ?"
                const [result] = await database.query(selectUser, [user_id]);
    
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
        
        async logout(request_data, user_id, callback){
            try{

                const [result] = await database.query("SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1", [user_id]);
                if(result.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_user_found')
                    }));
                }

                const updateQuery = "UPDATE tbl_user SET user_token = NULL, is_login = 0 WHERE user_id = ?";
                await database.query(updateQuery, [user_id]);
        
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

        async add_review(request_data, user_id, callback) {
            try {
                if (!request_data.order_id) {
                    return callback(common.encrypt({
                        code: response_code.INVALID_REQUEST,
                        message: t('missing_required_fields')
                    }));
                }
        
                const rating = parseInt(request_data.rating, 10);
                if (rating < 1 || rating > 5) {
                    return callback(common.encrypt({
                        code: response_code.INVALID_REQUEST,
                        message: t('invalid_rating')
                    }));
                }
        
                const orderQuery = `SELECT * FROM tbl_delivery_order WHERE order_id = ? AND user_id = ?`;
                const [orderResult] = await database.query(orderQuery, [request_data.order_id, user_id]);
        
                if (!orderResult || orderResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('order_not_found')
                    }));
                }
        
                const reviewQuery = `SELECT * FROM tbl_review_rating WHERE order_id = ? AND user_id = ?`;
                const [reviewResult] = await database.query(reviewQuery, [request_data.order_id, user_id]);
        
                if (reviewResult.length > 0) {
                    return callback(common.encrypt({
                        code: response_code.ALREADY_EXISTS,
                        message: t('review_already_exists')
                    }));
                }

                const findStatus = `SELECT status FROM tbl_delivery_order WHERE order_id = ?`;
                const [statusResult] = await database.query(findStatus, [request_data.order_id]);

                if(statusResult[0].status != 'completed'){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_is_not completed')
                    }));
                }
        
                const data = {
                    user_id: user_id,
                    order_id: request_data.order_id,
                    rating: rating,
                    review: request_data.review
                };
        
                const insertReview = `INSERT INTO tbl_review_rating SET ?`;
                await database.query(insertReview, [data]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('review_added_successfully')
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }
        
        async report(request_data, user_id, files, callback) {
            try {
                const {
                    order_id,
                    subject,
                    description
                } = request_data;
        
                if (!order_id || !subject || !description || !user_id) {
                    if (files && files.length > 0) {
                        files.forEach(file => {
                            fs.unlinkSync(file.path);
                        });
                    }

                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('missing_required_fields')
                    }));
                }
        
                const [order] = await database.query(`
                    SELECT status, user_id
                    FROM tbl_delivery_order
                    WHERE order_id = ?
                    AND is_canceled = 0
                `, [order_id]);
        
                if (!order || order.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_not_found')
                    }));
                }
        
                if (order[0].status !== 'completed') {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('order_not_completed')
                    }));
                }
        
                if (order[0].user_id !== user_id) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('unauthorized_user')
                    }));
                }
        
                const [reportResult] = await database.query(`
                    INSERT INTO tbl_report (
                        subject,
                        description,
                        user_id,
                        is_active,
                        is_deleted,
                        order_id
                    ) VALUES (?, ?, ?, 1, 0, ?)
                `, [subject, description, user_id, order_id]);
        
                const report_id = reportResult.insertId;

                if (files && files.length > 0) {
                    const imageValues = files.map(file => [
                        file.filename,
                        report_id
                ]);
                
                await database.query(`
                    INSERT INTO tbl_image_report (
                    image_name,
                    report_id
                    ) VALUES ?
                `, [imageValues]);

                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('report_created_successfully'),
                    data: {
                        report_id,
                        order_id
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

        async history(request_data, user_id, callback) {
            try {
                const getOrders = `
                    SELECT * FROM tbl_delivery_order 
                    WHERE user_id = ? 
                    AND (status = 'completed' OR status = 'cancelled')
                `;
                const [orders] = await database.query(getOrders, [user_id]);
        
                if (orders.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('no_orders_found')
                    }));
                }
        
                let order_list = [];
        
                for (let order of orders) {
                    const rec_id = order.rec_id;
        
                    const findReceiver = `SELECT * FROM tbl_receiver WHERE rec_id = ?`;
                    const [receiverData] = await database.query(findReceiver, [rec_id]);
        
                    const createdAt = new Date(order.created_at);
        
                    const order_date = createdAt.getFullYear() + '-' +
                        String(createdAt.getMonth() + 1).padStart(2, '0') + '-' +
                        String(createdAt.getDate()).padStart(2, '0');
        
                    let hours = createdAt.getHours();
                    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
                    const seconds = String(createdAt.getSeconds()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
        
                    const order_time = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
        
                    order_list.push({
                        receiver_details: receiverData[0] || null,
                        order_id: order.order_id,
                        order_date: order_date,
                        order_time: order_time,
                        order_status: order.status
                    });
                }
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('orders_fetched_successfully'),
                    data: order_list
                }));
        
            } catch (error) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }));
            }
        }        

        async add_driver_rating(request_data, user_id, callback){
            try{
                const rating_data = {
                    user_id: user_id
                };

                if(request_data.rating){
                    rating_data.rating = request_data.rating;
                }
                if(request_data.review){
                    rating_data.review = request_data.review;
                }
                if(request_data.order_id){
                    rating_data.order_id = request_data.order_id;
                }

                const findVehicle = `SELECT * from tbl_delivery_order where order_id = ? where status = 'completed' and delivery_status = 'delivered'`;
                const [vehicle_data] = await database.query(findVehicle, [rating_data.order_id]);
                const vehicle_id = vehicle_data[0].vehicle_id;

                const findDriver = `SELECT * from tbl_vehicle where vehicle_id = ?`;
                const [driver_data] = await database.query(findDriver, [vehicle_id]);

                const driver_id = driver_data[0].driver_id;
        
                const driverQuery = `SELECT * FROM tbl_driver WHERE driver_id = ?`;
                const [driverResult] = await database.query(driverQuery, [driver_id]);
        
                if (!driverResult || driverResult.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('driver_not_found')
                    }));
                }
        
                const ratingQuery = `SELECT * FROM tbl_driver_rating WHERE driver_id = ? AND user_id = ?`;
                const [ratingResult] = await database.query(ratingQuery, [driver_id, user_id]);
        
                if (ratingResult.length > 0) {
                    return callback(common.encrypt({
                        code: response_code.ALREADY_EXISTS,
                        message: t('rating_already_exists')
                    }));
                }
        
                rating_data.driver_id = driver_id;
        
                const insertRating = `INSERT INTO tbl_driver_rating SET ?`;
                await database.query(insertRating, [rating_data]);
        
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('rating_added_successfully')
                }));

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occurred'),
                    data: error.message
                }))
            }
        }

        async edit_order_details(request_data, user_id, callback){
            try{
                const order_id = request_data.order_id;
                const findOrder = `SELECT * FROM tbl_delivery_order WHERE order_id = ? AND user_id = ? AND status in ('pending')`;
                const [orderData] = await database.query(findOrder, [order_id, user_id]);

                if(orderData.length === 0){
                    return callback(common.encrypt({
                        code: response_code.NOT_FOUND,
                        message: t('order_not_found_or_can_not_edit')
                    }))
                }

                const data = {
                    weight_kg: request_data.weight_kg,
                    unit: request_data.unit,
                    height_feet: request_data.height_feet,
                    width_feet: request_data.width_feet,
                    notes: request_data.notes
                }

                const updateOrder = `UPDATE tbl_package_details SET ? where order_id = ?`;
                await database.query(updateOrder, [data, order_id]);

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('order_updated_successfully')
                }));

            } catch(error){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('some_error_occured'),
                    data: error.message
                }));
            }
        }
}

module.exports = new userModel();