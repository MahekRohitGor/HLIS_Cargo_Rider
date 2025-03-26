var database = require("../config/database");
var cryptLib = require("cryptlib");
var constants = require("../config/constants");
const nodemailer = require("nodemailer");

class common{
    generateOtp(length){
        if(length <= 0){
            throw new Error("OTP length must be greater than 0");
        }
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }

    generateToken(length){
        if(length <= 0){
            throw new Error("Token length must be greater than 0");
        }
        const alphaNumeric = '0123456789qwertyuiopasdfghjklzxcvbnm';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];
        }
        return token;
    }

    async requestValidation(v) {
        if (v.fails()) {
            const Validator_errors = v.getErrors();
            const error = Object.values(Validator_errors)[0][0];
            return {
                code: true,
                message: error
            };
        } 
        return {
            code: false,
            message: ""
        };
    }

    async sendMail(subject, to_email, htmlContent) {
        try {
            if (!to_email || to_email.trim() === "") {
                throw new Error("Recipient email is empty or undefined!");
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: constants.mailer_email,
                    pass: constants.mailer_password
                }
            });

            const mailOptions = {
                from: constants.from_email,
                to: to_email,
                subject: subject,
                html: htmlContent,
                text: "Please enable HTML to view this email.",
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(info);
            return { success: true, info };
        } catch (error) {
            console.log(error);
            return { success: false, error };
        }
    }

    response(res,message){
        return res.json(message);
    }

    async getUserDetail(user_id, login_user_id, callback){
        var selectUserQuery = "SELECT * from tbl_user where user_id = ?";
        
        try{

            const [user] = await database.query(selectUserQuery, [user_id])
            if(user.length > 0){
                return callback(undefined, user[0]);
            }
            else{
                return callback("No User Found", []);
            }

        } catch(error){

            return callback(error, []);
        }
    }

    async getUserDetailLogin(user_id, callback){
        console.log("User ID:", user_id);
        var selectUserQuery;
        selectUserQuery = "SELECT * from tbl_user where user_id = ?";
        
        try{

            const [user] = await database.query(selectUserQuery, [user_id])
            console.log("User", user);
            if(user.length > 0){
                return callback(undefined, user[0]);
            }
            else{
                return callback("No User Found", []);
            }

        } catch(error){

            return callback(error, []);
        }
    }

    async updateOtp(user_id) {
        const newOtp = this.generateOtp(4);
        console.log("OTP SENT: ", newOtp);
        const updateOtpQuery = `UPDATE tbl_otp SET otp = ?, verify = 0, is_deleted = 0, is_active = 1 WHERE user_id = ?`;
        await database.query(updateOtpQuery, [newOtp, user_id]);
    }
    

    async updateUserInfo(user_id, user_data, callback){
            const updateFields = { ...user_data};
            const updateQuery = "UPDATE tbl_user u INNER JOIN tbl_otp o ON u.user_id = o.user_id SET o.verify = 1 WHERE o.otp = ? and u.user_id = ? and o.verify = 0";
            
            try{
                const [updatedUser] = await database.query(updateQuery, [updateFields.otp, user_id]);
                console.log("Updated User:", updatedUser);
                if (updatedUser.affectedRows > 0) {
                    await this.getUserDetail(user_id, user_id, function(err, userInfo) {
                        console.log("UserInfo: ", userInfo);
                        if (err) {
                            console.log(err);
                            return callback(err, null);
                        } else {
                            console.log(userInfo);
                            return callback(null, userInfo);
                        }
                });
                } else {
                    return callback("Either NO USER FOUND or Your Email ID is already verified", null);
                }

            } catch(error){
                return callback(error, null);
            }

        }

    async updateUserInfoGeneral(id, data, callback){
        var updateUserQuery = "UPDATE tbl_user SET ? where user_id = ?";
        try{
            const [result] = database.query(updateUserQuery, [data, id]);
            this.getUserDetail(id, id, (error, result)=>{
                if(error){
                    return callback(error, undefined);
                } else{
                    return callback(undefined, result);
                }
            });

        }catch(error){
            return callback(error, undefined);
        }
    }

    encrypt(data) {
        return cryptLib.encrypt(JSON.stringify(data), constants.encryptionKey, constants.encryptionIV);
    }
    decryptPlain(data) {
        return cryptLib.decrypt(data, constants.encryptionKey, constants.encryptionIV);
    }
    decryptString (data){
        try{
            if(data){
                return cryptLib.decrypt(data, constants.encryptionKey, constants.encryptionIV);
            }else{
                return;
            }
        }catch(error){
            return error;
        }
    }

}

module.exports = new common();