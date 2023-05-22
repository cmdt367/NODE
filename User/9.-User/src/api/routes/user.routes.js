const { isAuth, isAuthAdmin } = require('../../middleware/auth.middleware');
const { upload } = require('../../middleware/files.middleware');
const {
  register,
  registerSlow,
  sendCode,
  registerWithRedirect,
  login,
  changePassword,
  sendPassword,
  modifyPassword,
  update,
  deleteUser,
} = require('../controllers/user.controllers');

const express = require('express');
const UserRoutes = express.Router();

UserRoutes.get('/register', upload.single('image'), registerWithRedirect);
UserRoutes.post('/register', upload.single('image'), registerSlow);
UserRoutes.get('/forgotpassword', changePassword);
UserRoutes.post('/login', login);
UserRoutes.patch('/changepassword', [isAuth], modifyPassword);
UserRoutes.patch('/update/update', [isAuth], upload.single('image'), update);
UserRoutes.delete('/', [isAuth], deleteUser);
//!---------------- REDIRECT-------------------------------
UserRoutes.get('/register/sendMail/:id', sendCode);
UserRoutes.get('/sendPassword/:id', sendPassword);
module.exports = UserRoutes;
