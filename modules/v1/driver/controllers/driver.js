var driverModel = require("../models/driver_model");
var common = require("../../../../utilities/common");
const response_code = require("../../../../utilities/response-error-code");
const {default: localizify} = require('localizify');
const validator = require("../../../../middlewares/validator");
const { t } = require('localizify');
const vrules = require("../../../validation_rules");

class User{
    async signup(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        driverModel.signup(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async verifyOtp(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data))

        driverModel.verifyOTP(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async forgotPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        driverModel.forgotPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async resetPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        driverModel.resetPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async login(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        driverModel.login(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async change_password(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const driver_id = req.user_id;

        driverModel.change_password(request_data, driver_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async logout(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.logout(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async add_vehicle_data(req,res){
        console.log("1");
        const request_data = req.body;
        // const request_data = JSON.parse(common.decryptPlain(requested_data));
        const files = req.files;
        const user_id = req.user_id;
        driverModel.add_vehicle_data(request_data, user_id, files, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_nearby_orders(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.list_nearby_orders(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async accept_order(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.accept_order(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    } 

    async updateDeliveryStatus(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.updateDeliveryStatus(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async get_upcoming_deliveries(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.get_upcoming_deliveries(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async verify_delivery(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.verify_delivery(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async set_availability(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.set_availability(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async show_earnings(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.show_earnings(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_driver_notification(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.list_driver_notification(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_driver_notification(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.list_driver_notification(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async show_ratings(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        driverModel.show_ratings(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }


}


module.exports = new User();