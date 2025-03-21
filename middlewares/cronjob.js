const cron = require("node-cron");
const database = require("../config/database");

const updateOrderStatus = async () => {
    try {
        console.log("Running order status update...");
        
        // Get current time for logging
        const currentTime = new Date();
        console.log(`Current time: ${currentTime.toISOString()}`);
        
        // First update: Confirmed -> In Preparation (1 hour before delivery starts)
        const confirmToPrep = `
            UPDATE tbl_order 
            SET status_ = 'in_preparation', updated_at = NOW() 
            WHERE status_ = 'confirmed' 
            AND is_active = 1 
            AND is_deleted = 0
            AND TIMESTAMPDIFF(HOUR, NOW(), delivery_time_start) <= 1
        `;
        
        const [prepResult] = await database.query(confirmToPrep);
        console.log(`Orders moved to in_preparation: ${prepResult.affectedRows}`);
        
        // Second update: In Preparation -> Out For Delivery (when delivery start time is reached)
        const prepToOfd = `
            UPDATE tbl_order 
            SET status_ = 'ofd', updated_at = NOW() 
            WHERE status_ = 'in_preparation' 
            AND is_active = 1 
            AND is_deleted = 0
            AND NOW() >= delivery_time_start
        `;
        
        const [ofdResult] = await database.query(prepToOfd);
        console.log(`Orders moved to out for delivery: ${ofdResult.affectedRows}`);
        
        // Third update: Out For Delivery -> Complete (when delivery end time is reached)
        const ofdToComplete = `
            UPDATE tbl_order 
            SET status_ = 'complete', updated_at = NOW() 
            WHERE status_ = 'ofd' 
            AND is_active = 1 
            AND is_deleted = 0
            AND NOW() >= delivery_time_end
        `;
        
        const [completeResult] = await database.query(ofdToComplete);
        console.log(`Orders moved to complete: ${completeResult.affectedRows}`);
        
        return {
            to_preparation: prepResult.affectedRows,
            to_delivery: ofdResult.affectedRows,
            to_complete: completeResult.affectedRows
        };
        
    } catch (error) {
        console.error("Error updating order statuses:", error);
        return { error: error.message };
    }
};

// Run every 10 minutes
cron.schedule("*/10 * * * *", updateOrderStatus);

// Export for manual triggering if needed
module.exports = { updateOrderStatus };