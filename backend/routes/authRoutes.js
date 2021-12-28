const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

// register an user
router.post("/register", async (req, res) => {

    const { name, email, password, confirmpassword } = req.body;

    // check for required fields
    if(name == null || email == null || password == null || confirmpassword == null) {
        return res.status(400).json({error: "Por favor, preencha todos os campos"});
    }

    // check if passwords match
    if(password != confirmpassword) {
        return res.status(400).json({error: "As senhas não conferem!"});
    }

    // check if user exists
    const emailExists = await User.findOne({ email: email });

    if(emailExists) {
        return res.status(400).json({ error: "O e-mail informado já está em uso!"});
    }

    // create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        name: name,
        email: email,
        password: passwordHash
    });

    try{
        const newUser = await user.save();

        // create token
        const token = jwt.sign(
            // payload
            {
                name: newUser.name,
                id: newUser._id
            },
            // secret
            "linux"
        );

        // return token
        res.json({ error: null, msg: "Você realizou o cadastro com sucesso", token: token, userId: newUser._id });

    }catch(error){
        res.status(400).json({ error });
    }

});

module.exports = router;