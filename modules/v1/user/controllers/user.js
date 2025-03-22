var userModel = require("../models/user_model");
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
        userModel.signup(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async verifyOtp(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data))

        userModel.verifyOTP(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async forgotPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        userModel.forgotPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async resetPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        userModel.resetPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async login(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));

        userModel.login(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_vehicles(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.list_vehicles(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async create_delivery_order(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.create_delivery_order(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_notifications(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.list_notifications(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async cancel_order(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.cancel_order(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async contact_us(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.contact_us(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async list_user_orders(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.list_user_orders(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async change_password(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.change_password(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async logout(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.logout(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async add_review(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.add_review(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async report(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.report(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async history(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.history(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
}


module.exports = new User();