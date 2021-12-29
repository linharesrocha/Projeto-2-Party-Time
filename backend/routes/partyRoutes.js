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
});

// get all user parties
router.get("/userparties", verifyToken, async (req, res) => {
    try {

        const token = req.header("auth-token");

        const user = await getUserByToken(token);

        const userId = user._id.toString();

        const parties = await Party.find({ userId: userId });
        res.json({ error: null, parties: parties });

    }catch(err) {
        return res.status(400).json({ err })
    }
});

// get user party
router.get("/userparty/:id", verifyToken, async (req, res) => {
    try {

        const token = req.header("auth-token");

        const user = await getUserByToken(token);

        const userId = user._id.toString();
        const partyId = req.params.id;

        const party = await Party.findOne({ _id: partyId, userId: userId });
        res.json({ error: null, party: party });

    }catch(err) {
        return res.status(400).json({err})
    }
});

// get party (public or private)
router.get("/:id", async (req, res) => {

    try {
        // find party
        const id = req.params.id;

        const party = await Party.findOne({ _id: id });

        // public party
        if(party.privacy === false) {
            res.json({ error: null, party: party});
        }
        // private party
        else {

            const token = req.header("auth-token");

            const user = await getUserByToken(token);

            const userId = user._id.toString();
            const partyUserId = party.userId.toString();

            // check if user id is equal to party user id
            if(userId == partyUserId) {
                res.json({ error: null, party: party});
            }
        }
    }
    catch(err){
        return res.status(400).json({ msg: "Este evento não existe" });
    }
});

// delete a party
router.delete("/", verifyToken, async (req, res) => {

    const token = req.header("auth-token");
    const user = await getUserByToken(token);
    const partyId = req.body.id;
    const userId = user._id.toString();

    try {

        await Party.deleteOne({ _id: partyId, userId: userId });
        res.json({error: null, msg: "Evento removido com sucesso!"});

    }catch(err) {
        res.status(400).json({err: "Acesso negado!"})
    }

});

module.exports = router;