class routing{
    v1(app){
        const user = require("./v1/user/routes/routes");
        const driver = require("./v1/driver/routes/routes")

        user(app);
        driver(app);
    }
}

module.exports = new routing();