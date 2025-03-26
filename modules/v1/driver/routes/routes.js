const users = require("../controllers/driver");
const { vehicleDocumentUpload, UserImageUpload } = require('../../../../middlewares/uploadFiles');

const user = (app) =>{
        app.post("/v1/driver/signup", UserImageUpload.fields([
                { name: 'profile_pic', maxCount: 1 }
            ]), users.signup);
        app.post("/v1/driver/verifyOtp", users.verifyOtp);
        app.post("/v1/driver/forgotPassword", users.forgotPassword);
        app.post("/v1/driver/resetPassword", users.resetPassword);
        app.post("/v1/driver/login", users.login);
        app.post("/v1/driver/change-password", users.change_password);
        app.post("/v1/driver/logout", users.logout);
        app.post("/v1/driver/add-vehicle-data", vehicleDocumentUpload.fields([
                { name: 'adhar_card_front', maxCount: 1 },
                { name: 'adhar_card_back', maxCount: 1 },
                { name: 'pan_card_front', maxCount: 1 },
                { name: 'pan_card_back', maxCount: 1 },
                { name: 'driving_lic_card_front', maxCount: 1 },
                { name: 'driving_lic_card_back', maxCount: 1 }
            ]), users.add_vehicle_data);
        app.post("/v1/driver/show-order", users.list_nearby_orders);
        app.post("/v1/driver/accept-order", users.accept_order);
        app.post("/v1/driver/update-status", users.updateDeliveryStatus);
        app.post("/v1/driver/get-upcoming-deliveries", users.get_upcoming_deliveries);
        app.post("/v1/driver/verify-delivery", users.verify_delivery);
        app.post("/v1/driver/set-availibility", users.set_availability);
        app.post("/v1/driver/show-earnings", users.show_earnings);
        app.post("/v1/driver/list-notification", users.list_driver_notification);
        app.post("/v1/driver/show-ratings", users.show_ratings);
}

module.exports = user;