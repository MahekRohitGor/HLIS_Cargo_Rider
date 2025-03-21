const rules = {
    signup: {
        email_id: "required|email",
        phone_number: "required|string|min:10|regex:/^[0-9]+$/|max:10",
        password_: "required|min:8",
        user_name: "required",
        code_id: "required"
    },

    login: {
        email_id: "nullable|required_without:phone_number|email",
        phone_number: "nullable|required_without:email_id|min:10|regex:/^[0-9]+$/|max:10",
        password_: "required|min:8"
    },

    verifyOTP:{
        email_id: "required|email",
        otp: "required|min:4|max:4"
    },

    resendOTP:{
        email_id: "required|email"
    },

    forgot_password:{
        email_id: "nullable|required_without:phone_number|email",
        phone_number: "nullable|required_without:email_id|string|min:10|regex:/^[0-9]+$/|max:10",
    },

    reset_password: {
        reset_token: "required|min:10|max:10",
        new_password: "required|min:8"
    },

    complete_profile: {
        latitude: "required_if:isstep_,3",
        longitude: "required_if:isstep_,3",
        goal_id: "required_if:isstep_,3",
        dob: "nullable|required",
        gender: "nullable|required",
        target_weight_kg: "nullable|required",
        current_weight_kg: "nullable|required",
        activity_level: "nullable|required"
    },

    changePassword: {
        old_password: "required|min:8",
        new_password: "required|min:8"
    },

    admin_login:{
        username: "required",
        password: "required"
    },

    add_items: {
        image_name: "required|string",
        name_: "required|string",
        ingredients: "required|array",
        category: "string|in:Breakfast,Lunch,Dinner",
        description: "string|max:500"
    }
}

module.exports = rules;