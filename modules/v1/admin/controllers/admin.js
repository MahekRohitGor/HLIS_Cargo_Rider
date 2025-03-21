var adminModel = require("../models/admin_model");
var common = require("../../../../utilities/common");
const response_code = require("../../../../utilities/response-error-code");
const {default: localizify} = require('localizify');
const validator = require("../../../../middlewares/validator");
const { t } = require('localizify');
const vrules = require("../../../validation_rules");

class Admin {
    async admin_login(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        const rules = vrules.admin_login;
        var message = {
            required: t('required')
        }
        var keywords = {
            'username': t('rest_keywords_username'), // new
            'passwords': t('rest_keywords_password')
        }
        
        const isValid = await validator.checkValidationRules(req, res, request_data, rules, message, keywords);
        if (!isValid) return;

        adminModel.admin_login(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async add_items(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const rules = vrules.add_items;
        
        var message = {
            required: t('required'),
            string: t('must_be_string'),
            array: t('must_be_array'),
            in: t('must_be_one_of_the_valid_categories'),
            numeric: t('must_be_a_number'),
            min: t('must_be_at_least_0'),
            max: t('exceeds_max_length')
        };
        
        var keywords = {
            'image_name': t('rest_keywords_image_name'),
            'name_': t('rest_keywords_item_name'),
            'ingredients': t('rest_keywords_ingredients'),
            'category': t('rest_keywords_category'),
            'price': t('rest_keywords_price'),
            'description': t('rest_keywords_description')
        };

        const isValid = await validator.checkValidationRules(req, res, request_data, rules, message, keywords);
        if (!isValid) return;

        adminModel.add_items(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async analytics(req,res){
        const request_data = req.body;
        adminModel.analytics(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async admin_logout(req,res){
        const admin_id = req.user_id;
        adminModel.admin_logout(admin_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async delete_item(req,res){
        const request_data = req.body;
        adminModel.delete_item(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
}

module.exports = new Admin();