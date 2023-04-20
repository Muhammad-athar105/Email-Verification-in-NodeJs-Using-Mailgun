const { json } = require("express");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox5ec92b9f58924e1a8609ece0cc3a627c.mailgun.org";
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
const { body } = require("express-validator");
const { JsonWebTokenError } = require("jsonwebtoken");

exports.signup = async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // Web Token
    const token = jwt.sign({ name, email, password }, process.env.JWT_ACC_ACTIVATE, { expiresIn: "20m" });

    // Mail Gun
    const data = {
      from: "<noreply@test.com>",
      to: email,
      subject: "Account Activation Link",
      html: `<h2>Please click on the given link to activate the account</h2>
             <p>${process.env.CLIENT_URL}/authentication/activate/${token}</p>
            `,
    };
    mg.messages().send(data, function (error, body) {
      if (error) {
        return res.json({
          error: error.message,
        });
      }
      return res.json({message: "Email has been sent, kindly activate your account"})
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Activating Account 
exports.activateAccount = async (req, res ) =>{
  const {token} = req.body;

  if(token){
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_ACC_ACTIVATE);
      const {name, email, password} = decodedToken;
      const user = await User.findOne({email});
      if (user) {
        return res.status(400).json({error : " User with this email already exists"}); 
      }
      let newUser = new User({name, email, password});
      await newUser.save();
      res.json({
        message: "Signup Successfully, Go to the login Page to login  "
      });
    } catch (err) {
      return res.json({error: "Incorrect or expired link"})
    }
  } else {
    return res.json({error: 'Something went wrong while activating Account !!!'});
  }
};


// Send the Email Trough Node-Mailer


    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: 'mrcoder105@gmail.com',
    //     pass: 'MrCoder786%^!',
    //   },
    // });
    
    
    // transporter.sendMail({
    //   from: '"Fatech Technologies" <fatechtechnologies@gmail.com>', // sender address
    //   to: "athar9157@gmail.com, receivertwo@outlook.com", // list of receivers
    //   subject: "Project Proposal ✔", // Subject line
    //   text: "There is a new article. It's about sending emails, check it out!", // plain text body
    //   html: "<b>There is a new article. It's about sending emails, check it out!</b>", // html body
    // }).then(info => {
    //   console.log({info});
    // }).catch(console.error);



      // Updated Version of Mail Gun Node Code ("It doesnt work")
    // mg.messages.create('sandbox-123.mailgun.org', {
    //   from: "Excited User <noreply@test.com>",
    //   to: email,
    //   subject: "Verify your email",
    //   text: "Testing some Mailgun awesomeness!",
    //   html: "<h1>Testing some Mailgun awesomeness!</h1>"
    // })
    // .then(msg => console.log(msg)) // logs response data
    // .catch(err => console.log(err)); // logs any error