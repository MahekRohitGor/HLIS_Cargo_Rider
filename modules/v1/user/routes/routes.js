const users = require("../controllers/user");
const { UserImageUpload, UserReportImage } = require('../../../../middlewares/uploadFiles');

const user = (app) =>{
        app.post("/v1/user/signup", UserImageUpload.fields([
                { name: 'profile_pic', maxCount: 1 }
            ]), users.signup);
        app.post("/v1/user/verifyOtp", users.verifyOtp);
        app.post("/v1/user/forgotPassword", users.forgotPassword);
        app.post("/v1/user/resetPassword", users.resetPassword);
        app.post("/v1/user/login", users.login);
        app.post("/v1/user/list-vehicles", users.list_vehicles);
        app.post("/v1/user/create-delivery-order", users.create_delivery_order);
        app.post("/v1/user/list-notifications", users.list_notifications);
        app.post("/v1/user/cancel-order", users.cancel_order);
        app.post("/v1/user/contact-us", users.contact_us);
        app.post("/v1/user/list-order", users.list_user_orders);
        app.post("/v1/user/edit-order", users.edit_order_details);
        app.post("/v1/user/change-password", users.change_password);
        app.post("/v1/user/logout", users.logout);
        app.post("/v1/user/add-review", users.add_review);
        app.post("/v1/user/report-order", UserReportImage.array('images', 5), users.report);
        app.post("/v1/user/history", users.history);
}

module.exports = user;