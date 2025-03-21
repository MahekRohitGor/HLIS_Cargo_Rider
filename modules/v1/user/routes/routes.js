const users = require("../controllers/user");

const user = (app) =>{
        app.post("/v1/user/signup", users.signup);
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
}

module.exports = user;