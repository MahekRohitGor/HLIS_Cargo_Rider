const users = require("../controllers/driver");

const user = (app) =>{
        app.post("/v1/driver/signup", users.signup);
        app.post("/v1/driver/verifyOtp", users.verifyOtp);
        app.post("/v1/driver/forgotPassword", users.forgotPassword);
        app.post("/v1/driver/resetPassword", users.resetPassword);
        app.post("/v1/driver/login", users.login);
        app.post("/v1/driver/change-password", users.change_password);
        app.post("/v1/driver/logout", users.logout);
        app.post("/v1/driver/add-vehicle-data", users.add_vehicle_data);
        app.post("/v1/driver/show-order", users.list_nearby_orders);
        app.post("/v1/driver/accept-order", users.accept_order);
        app.post("/v1/driver/update-status", users.updateDeliveryStatus);
}

module.exports = user;