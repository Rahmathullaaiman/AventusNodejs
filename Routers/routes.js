const express = require('express')

//CONTROLLERS IMPORTS
//________________________________________________________________
const Usercontrolls = require("../Controllers/usercontroll")
const Chatcontrolls = require("../Controllers/Chatcontroll")
const groupChatController = require("../Controllers/GroupChatcontroll")




//MIDDLEWARES
//________________________________________________________________
const Multerlmiddleware = require('../Middlewares/MulterConfig')
const jwtmiddleware = require('../Middlewares/Jwtconfig')
//________________________________________________________________


const router = new express.Router()
//_________________________________________


//ROUTE PATHS


//1)Registration
router.post('/user/reg',Usercontrolls.register)
//2)Verify Otp
router.post('/otp',Usercontrolls.verifyOTP)
//3)Login
router.post('/user/login',Usercontrolls.login)
//4)Reset Password
router.post('/reset',Usercontrolls.resetPassword)
//5)Edit Profile
router.put('/editprofile/:id',jwtmiddleware,Multerlmiddleware.single('profile'),Usercontrolls.editProfile)
//_____________________________________________________________________________________________________

//CHAT CONTROLLS

//6)Send Message
router.post('/sendmessage/:id',jwtmiddleware,Chatcontrolls.sendMessage)//Use Receiver id at endpoint(/:id)
//7)Get messages
router.get('/getmessage/:id',jwtmiddleware,Chatcontrolls.getMessages)//Use Receiver id at endpoint(/:id)
//______________________________________________________________________________________________________________


//GROUP CHAT CONTROLLS

//8)Create Group
router.post('/group',jwtmiddleware, groupChatController.createGroup);
//9)Add Members
router.post('/group/:groupId',jwtmiddleware, groupChatController.addMembers);
//10)Remove Members
router.delete('/group/:groupId/remove-members',jwtmiddleware, groupChatController.removeMembers);
//11)Update Group Settings
router.put('/group/:groupId/settings',jwtmiddleware,Multerlmiddleware.single('profilePic'), groupChatController.updateGroupSettings);
//12)Group Send Message
router.post('/sendgroup/messages',jwtmiddleware, groupChatController.sendGroupMessage);
//13)Group Get Message
router.get('/getgroup/:groupId/messages',jwtmiddleware, groupChatController.getGroupMessages);
//14)Delete Group
router.delete('/group/:groupId',jwtmiddleware, groupChatController.deleteGroup);















module.exports=router