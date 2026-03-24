const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/admincontroller');
const { verifyAdmin, verifyAccessToken } = require('../service/auth');

adminRouter.get('/dashboard',verifyAccessToken,verifyAdmin, adminController.getusers);

adminRouter.post('/logout',adminController.logoutuser);

adminRouter.get('/user/:id',verifyAccessToken,verifyAdmin,adminController.user_link_details);

adminRouter.get('/link/:id', verifyAccessToken, verifyAdmin, adminController.link_analytics);

module.exports = adminRouter;