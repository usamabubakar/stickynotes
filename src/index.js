const express = require("express");
const path = require("path");
const hbs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require("express-session");
const cookie = require("cookie-parser");
const { get } = require("request");
const { Script } = require("vm");
const cookieParser = require("cookie-parser");
const { stringify } = require("querystring");
const app = express();
var router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
let pathh = path.join(__dirname, "../template", "views");
const static_path = path.join(__dirname, "../template/picsandcss");
app.use(express.static(static_path));
app.set("view engine", "ejs");
app.set("views", pathh);
// seesion middlewar 
app.use(cookieParser());
app.use(session({
    secret: "cokkie sign kry ga",
    //    resave means for every req we create new session
    key: "user_id",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))
// session midlewear end 
// cheack session or cookie make or not
// app.use((req,res,next)=>{
//     if(req.session.user && req.cookies.user){
//         res.redirect("/");
//     }
//     next()
// })
// var chcksession=((req,res,next)=>{
//     if(req.session.user){
//         res.render("/");
//     }
//     else{
//         res.render("/login");
//     }
// })
// database conection 
mongoose.connect("mongodb://localhost:27017/stickynote", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connnection done");
    })
    .catch((err) => {
        console.log(err);
    })
// database conection end

// document body
const bodyschema = new mongoose.Schema({
    fname: {
        type: String,
        unique: false,

    },
    lname: {
        type: String,
        unique: false,

    },
    password: {
        type: String,
        unique: false,

    },
    cpassword: {
        type: String,
        unique: false,

    },
    email: {
        type: String,
        unique: true,


    },
    phone: {
        type: Number,
        unique: false,


    },
    data: {
        type: Array,
        items: {
            type: Object,
            properties: {
                title: {
                    type: String,
                    unique: false,

                },
                text: {
                    type: String,
                    unique: false,

                }
            }
        }
    }

})

// document body end

// collection for inserdata 
const colection_name = new mongoose.model("alldata", bodyschema);
// collection for inserdata edn



const resul = colection_name.find({});


app.get("/login", (req, res) => {
    req.session.user = 0;
    res.render("login", {
        ab: 0
    });
})

app.post("/login", async (req, res) => {
    req.session.user = 0;
    const email = req.body.email;
    const password = req.body.password;
    const user_check = await colection_name.findOne({ email: email, password: password });
    if (user_check) {
        req.session.user = 1;
        req.session.bodyschema = user_check;
        console.log(req.session.bodyschema.fname)
        res.render("home", {
            session: req.session
        });
    }
    else {
        req.session.user = 0;
        res.render("login",{
            ab: 1
        });
    }
})

app.get("/singup", (req, res) => {
    res.render("singup", {
        sign_chk: 0
    })
})

app.post("/singup", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const cpassword = req.body.cpassward;
    let user_check = await colection_name.findOne({ email: email });
    if (user_check) {
        res.render("singup", {
            sign_chk: 1
        })
    }
    else if (password != cpassword) {
        res.render("singup", {
            sign_chk: 2
        })
    }
    else {
        const sign = async () => {
            try {
                const signup = new colection_name({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    password: req.body.password,
                    cpassword: req.body.cpassword,
                    email: req.body.email,
                    phone: req.body.number,
                })
                const result = await signup.save();

            }
            catch (err) {
                console.log(err);
                req.session.user = err;
            }
        }
        sign();
        res.redirect("/login");
    }
})
app.get("/logout", (req, res) => {
    console.log(req.session.user);
    if (req.session.user == 1) {
        req.session.user = 0;
        res.clearCookie("user_id");
        res.redirect("login");
    }
    else {
        res.redirect("/");
    }
})

app.get("/delete/:id", (req, res) => {
    var titl=req.params.id
    console.log(titl);
    // console.log(iid);
 
   const del=async()=>{
       try{
        var del = colection_name.updateOne({titl},{
            $pull:{
                data:{
                    title: req.session.bodyschema.data.title,
                    text: req.session.bodyschema.data.text
                }
            }
        });
       }
    catch(err){
        console.log(err);
    }}
    del()
    res.redirect("/");
})
app.get("/update/:id", (req, res) => {
    var iid = req.params.id;
    console.log(iid);
    var updat = colection_name.find(iid);
    updat.exec(function (err, data) {
        res.render("/", {
            updaterecord: data
        });
    })
})
app.get("/", async (req, res) => {
    if (req.session.user == 1) {

        res.render("home", {
            session: req.session
        });
    }

    else {
        res.redirect("login")
    }

})
app.post("/", (req, res) => {
    if (req.session.user == 1) {
        const title = req.body.title;
        const note = req.body.note;
        // console.log(req.session.bodyschema._id);
        console.log(note);
        console.log(title);

        // data save in database 


        const data = async () => {
            try {
                const dataa = await colection_name.updateOne({ email: req.session.bodyschema.email }, {
                    $push: {
                        data: {
                            title: req.body.title,
                            text: req.body.text
                        }
                    }
                })
            }
            catch (err) {
                console.log(err);
            }
        }
        data();
        console.log();
        res.render("home");


    }
})


app.listen(8000, () => {
    console.log("connection done at 8000");
})