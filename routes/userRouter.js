const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/usercontroller');
const { verifyUser, verifyAccessToken } = require('../service/auth');


userRouter.get('/', userController.getregisteruser);

userRouter.post('/',userController.postregisteruser);

userRouter.get('/login', userController.getloginuser);

userRouter.post('/login',userController.postloginuser);

userRouter.get('/user/dashboard/shortlink',verifyAccessToken,userController.geturluser);

userRouter.post('/user/dashboard/shortlink',verifyAccessToken,verifyUser,userController.posturluser);

userRouter.get('/refresh',userController.refreshaccesstoken);

userRouter.post('/logout',userController.logoutuser);

userRouter.get('/:short_code',userController.redirect_original_url);

userRouter.post('/all_links',verifyAccessToken, verifyUser, userController.getlinks);

userRouter.get('/user/link/:id',verifyAccessToken,verifyUser,userController.view_analytics);

userRouter.post('/user/dashboard/qrcode',verifyAccessToken,verifyUser,userController.generate_qr_code);

module.exports = userRouter;
