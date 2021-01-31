const express = require("express");
const app = express();
const db = require("./db");
const multer = require("multer"); // npm package for handling multipart/form-data on the server side
const uidSafe = require("uid-safe"); // npm package that generates a random and unique string
const path = require("path"); // core module that helps with handling files by making path manipulation easier
const s3 = require("./s3");

app.use(express.json());

//////// SERVING STATIC FILES /////////
app.use(express.static("public"));
///////////////////////////////////////

app.use((req, res, next) => {
    console.log("req.url: ", req.url);
    // console.log("req.session: ", req.session);
    next();
});

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152,
    },
});

app.get("/images", (req, res) => {
    console.log("i am the images route!");

    db.getImages()
        .then((response) => {
            // console.log("response: ", response);

            res.json(response.rows);
        })
        .catch((err) => {
            console.log("error in getImages query: ", err);
        });
});

app.get("/images/:id", (req, res) => {
    // console.log("res from images/:id: ", res);

    let id = req.params.id;
    // console.log("id in req.params: ", id);

    Promise.all([db.getImageModal(id), db.getComments(id)])
        .then((response) => {
            // console.log("response in promise.all: ", response);

            let image = response[0].rows;
            let comments = response[1].rows;

            // console.log("image: ", image);
            // console.log("comments: ", comments);

            res.json([image, comments]);
        })
        .catch((err) => {
            console.log("error in app.get dynamic route: ", err);
            res.json([]);
        });
});

app.get("/images/more/:lastId", (req, res) => {
    // console.log("user cliked more button!");
    console.log("req.params in more route: ", req.params);

    let lastId = req.params.lastId;

    db.getMoreImages(lastId)
        .then((response) => {
            console.log("user cliked more button!");
            console.log("response in getMoreImages query: ", response);

            res.json(response.rows);
        })
        .catch((err) => {
            console.log("error in getMoreImages query: ", err);
        });
});

//////////////////////////// POST ROUTES //////////////////////////////

// uploader triggers our multer boilerplate that handles that files are being stored in our hardidisk,
// to be precise, in our uploads folder
// single is a method that uploader gives us
// and 'file' comes from the property we have set on our formData
app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    // multer adds the file and the body to the request object
    console.log("file: ", req.file);
    console.log("body: ", req.body);
    console.log("yay! everything went well!!"); // if we get here it means the file was succesfully uploaded
    // to AWS

    if (req.file) {
        // we will eventually want to make a db insert query where we insert all image information

        console.log("req.body in upload images: ", req.body);

        let url =
            "https://s3.amazonaws.com/vanilla-imageboard/" + req.file.filename;

        let { username, title, description } = req.body;

        db.uploadImage(url, username, title, description)
            .then((response) => {
                console.log("response in images upload query: ", response);

                res.json({
                    success: true,
                    url,
                    username,
                    title,
                    description,
                    id: response.rows[0].id,
                    created_at: response.rows[0].created_at,
                });
            })
            .catch((err) => {
                console.log("error in uploadImage query: ", err);
            });
    } else {
        res.json({ success: false });
    }
});

app.post("/add-coment", (req, res) => {
    console.log("req.body in POST add-coment: ", req.body);

    let { username, comment, image_id } = req.body;

    db.addComments(username, comment, image_id)
        .then((response) => {
            console.log("response in addComments query: ", response);
            res.json({ comment: response.rows[0] });
        })
        .catch((err) => {
            console.log("error in addComments query: ", err);
        });
});

app.listen(8080, () => console.log("imageboard server up and running!"));
