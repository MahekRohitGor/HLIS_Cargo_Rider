const Admin = require("../controllers/admin");

const admin = (app) =>{
    app.post("/v1/admin/admin-login", Admin.admin_login);
    app.post("/v1/admin/add-items", Admin.add_items);
    app.post("/v1/admin/delete-item", Admin.delete_item);
    app.post("/v1/admin/analytics", Admin.analytics);
    app.post("/v1/admin/admin-logout", Admin.admin_logout);
}

module.exports = admin;