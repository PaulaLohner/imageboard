const spicedPg = require("spiced-pg");
let db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres://postgres:postgres@localhost:5432/vanilla-imageboard`
);

exports.getImages = function () {
    return db.query(
        `SELECT * FROM images
        ORDER BY id DESC
        LIMIT 9;`
    );
};

exports.uploadImage = function (url, username, title, description) {
    return db.query(
        `INSERT INTO images (url, username, title, description) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
        [url, username, title, description]
    );
};

exports.getMoreImages = function (lastId) {
    return db.query(
        `SELECT url, title, id, (
        SELECT id FROM images
        ORDER BY id ASC
        LIMIT 1
        ) AS "lowestId" FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 9;`,
        [lastId]
    );
};

exports.getImageModal = function (id) {
    return db.query(
        `SELECT  url, username, title, description FROM images WHERE id=$1`,
        [id]
    );
};

exports.getComments = function (image_id) {
    return db.query(`SELECT * FROM comments WHERE image_id = $1`, [image_id]);
};

exports.addComments = function (username, comment, image_id) {
    return db.query(
        `INSERT INTO comments (username, comment, image_id) VALUES ($1, $2, $3) RETURNING *`,
        [username, comment, image_id]
    );
};
