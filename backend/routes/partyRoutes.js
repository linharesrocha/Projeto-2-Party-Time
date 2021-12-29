const router = require("express").Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");

const Party = require("../models/party");
const User = require("../models/user");

// define file storage
const diskStorage = require("../helpers/file-storage");
const upload = multer({storage: diskStorage});

// middlewares
const verifyToken = require("../helpers/check-token");

// helpers
const getUserByToken = require("../helpers/get-user-by-token");

// create new party
router.post("/", verifyToken, upload.fields([{ name: "photos"}]), async (req, res) => {

    // req data
    const { title, description, partyDate } = req.body;

    let files = [];

    if(req.files) {
        files = req.files.photos;
    }

    // validations
    if(title == "null" || description == "null" || partyDate == "null") {
        return res.status(400).json({ error: "Preencha pelo menos nome, descrição e data."})
    }

    // verify user
    const token = req.header("auth-token");
    const userByToken = await getUserByToken(token);

    const userId = userByToken._id.toString();

    try {
        const user = await User.findOne({ _id: userId });

        // create photos array with image path
        let photos = [];

        if(files && files.length > 0) {
            files.forEach((photo, i) => {
                photo[i] = photo.path;
            })
        }

        const party = new Party({
            title: title,
            description: description,
            partyDate: partyDate,
            photos: photos,
            privacy: req.body.privacy,
            userId: user._id.toString()
        });

        try {

            const newParty = await party.save();
            res.json({ error: null, msg: "Evento criado com sucesso!", data: newParty });

        }catch(err) {
            return res.status(400).json({ err })
        }

    }catch(err) {
        return res.status(400).json({ error: "Acesso negado."})
    }
    


});

// get all public parties
router.get("/all", async (req, res) => {
    try {
        
        const parties = await Party.find({ privacy: false }).sort([[ '_id', -1 ]]);
        res.json({ error: null, parties: parties });

    }catch(err) {
        return res.status(400).json({ error })
    }
})

module.exports = router;