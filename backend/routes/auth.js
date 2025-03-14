const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const router = express.Router({mergeParams: true});
const Store = require("../models/store")
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const {fetchStore} = require("../middleware");
const maxAge = 3 * 24 * 60 * 60;

const handleErrors = (err) => {
    let errors = { email: "", password: "" , name:""};
  
    console.log("Error occurred:", err);
    if (err.message === "invalid credentials") {
      errors.email = "Invalid Credentials";
      return errors;
    }
  
    if (err.message === "invalid credentials") {
      errors.password = "Invalid Credentials";
      return errors;
    }
  
    if (err.code === 11000) {
      errors.email = "Email is already registered";
      return errors;
    }
  
    if (err.message.includes("Store validation failed")) {
      Object.values(err.errors).forEach(({ properties }) => {
        errors[properties.path] = properties.message;
      });
    }
    return errors;
  };
  // Creating a Store - /api/auth/
router.post("/",  async (req,res)=>{
    console.log("Registration request received:", req.body);
    try{
        // let store = await  Store.findOne({email: req.body.email});
        // if(store){
        //     res.send("Error email taken")
        // }
        let salt = 10;
        const secPass = await bcrypt.hash(req.body.password, salt);
        console.log("Creating new store with name:", req.body.name, "and email:", req.body.email);
        store = new Store({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        });
        await store.save();
        console.log("Store saved successfully with ID:", store._id);
        const data = {
            store: {
                id: store.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // res.cookie("jwt", authToken, {
        //     withCredentials: true,
        //     httpOnly: false,
        //     maxAge: maxAge * 1000,
        // });
        res.status(201).json({store: store._id,token: authToken ,created: true});
        console.log("Registration successful, token generated");
    }catch (err) {
        console.log("Registration failed:", err);
        const errors = handleErrors(err);
        res.json({ errors, created: false });
    }
})

// Login the Store - /api/auth/login
router.post("/login", async(req,res)=>{
    console.log("Login request received:", req.body);
    try{
        let store = await Store.findOne({email: req.body.email});
        if(!store){
            console.log("Store not found");
            throw Error("invalid credentials")
        }
        console.log("Store found, comparing passwords");
        const passcmp = await bcrypt.compare(req.body.password, store.password);
        if(!passcmp){
            console.log("Wrong Password");
            throw Error("invalid credentials");
        }
        console.log("Password correct, generating token");
        const data = {
            store: {
                id: store.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // res.cookie("jwt", authToken, {
        //     withCredentials: true,
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "none",
        //     maxAge: maxAge * 1000,
        // });
        // res.cookie("sid", store._id, {
        //     withCredentials: true,
        //     httpOnly: false,
        //     maxAge: maxAge * 1000,
        // })
        res.status(201).json({store: store._id,token: authToken, created: true});
        console.log("Login successful, token generated");
    }catch(err){
        console.log("Login failed:", err);
        const errors = handleErrors(err);
        res.json({errors, created: false});
    }
})

// Fetch Store - /api/auth/getstore
router.post("/getstore",fetchStore)

module.exports = router