(function () {
    console.log("sanity check!!!!!");

    // how to write a component:
    // first argument needs to be the name of the component we've written on html
    // second argument is an object and data returns a function
    Vue.component("first-component", {
        template: "#template",
        props: ["id"],
        data: function () {
            return {
                image: {
                    url: "",
                    title: "",
                    description: "",
                    username: "",
                    id: "",
                    created_at: "",
                },
                getComments: [],
                username: "",
                comment: "",
            };
        },
        watch: {
            id: function () {
                // this watcher exists to watch any change in the component props.
                // it basically re-runs the function inside mounted, since mounted only goes off once
                // console.log("this in watcher: ", this);
                var thisOfWatch = this;

                axios
                    .get("/images/" + this.id)
                    .then(function (response) {
                        thisOfWatch.image = response.data[0][0];
                        thisOfWatch.getComments = response.data[1];
                    })
                    .catch(function (err) {
                        console.log("error in axios.get/images/:id: ", err);
                    });
            },
        },
        mounted: function () {
            console.log("component mounted!");
            // console.log("this.id: ", this.id);
            // console.log("this after component mounted: ", this);

            // this would be the perfect moment to make a request to the server to ask
            // for all the info about the image based on the id

            var thisOfModal = this;
            axios
                .get("/images/" + this.id)
                .then(function (response) {
                    console.log("response in modal dynamic route: ", response);

                    // if (
                    //     response.data[0][0].length == 0 &&
                    //     response.data[1] == 0
                    // ) {
                    //     console.log("there is no such image!");
                    //     this.$emit("close");
                    // }

                    thisOfModal.image = response.data[0][0];
                    thisOfModal.getComments = response.data[1];
                })
                .catch(function (err) {
                    console.log("error in axios.get/images/:id: ", err);
                });
        },
        methods: {
            addComment: function (e) {
                e.preventDefault();

                console.log("clicked submit button in axios.post comments!");

                var thisOfComments = this;

                let commentData = {
                    username: this.username,
                    comment: this.comment,
                    image_id: this.id,
                };

                console.log("this: ", this);

                console.log("commentData: ", commentData);

                axios
                    .post("/add-coment", commentData)
                    .then(function (response) {
                        console.log(
                            "response of axios.post /add-comment: ",
                            response
                        );
                        // console.log("thisOfComments: ", thisOfComments);

                        thisOfComments.getComments.unshift(
                            response.data.comment
                        );

                        console.log("thisOfComments: ", thisOfComments);
                    });
            },
            closeModal: function () {
                // console.log("close modal");
                // console.log("this in closeModal: ", this);

                // to emit info to the parent:
                this.$emit("close");
            },
        },
    });

    new Vue({
        el: "#main",
        data: {
            images: [],
            id: "",
            // data properties to handle the values of our input fields
            title: "",
            description: "", // empty strings are falsy
            username: "",
            file: null,
            selectedImage: location.hash.slice(1),
            seen: true,
        },
        mounted: function () {
            var thisOfInstance = this;
            axios
                .get("/images")
                .then(function (response) {
                    // console.log("response after axios.get: ", response);
                    thisOfInstance.images = response.data;
                })
                .catch(function (err) {
                    console.log(err);
                });

            window.addEventListener("hashchange", function () {
                // console.log("hashchange happened!");
                // console.log("this in hashchange: ", this);
                console.log("thisOfInstance: ", thisOfInstance);

                // thisOfInstance.selectedImage = location.hash.slice(1);

                // "If the server fails to deliver an image, emit the event that will cause the modal to close."
                // this was the way I found to make it work:
                for (var i = 0; i < thisOfInstance.images.length; i++) {
                    if (thisOfInstance.images[i].id == location.hash.slice(1)) {
                        thisOfInstance.selectedImage = location.hash.slice(1);
                        return;
                    }
                }

                thisOfInstance.selectedImage = null;
                location.hash = "";
                return;
            });
        },

        methods: {
            handleClick: function (e) {
                // prevent page refresh from running on button click:
                e.preventDefault();

                // whatever code I write will run whenever the user clicks the submit button
                console.log("clicked submit button!");

                console.log("this: ", this);

                // we are using FormData because we want to send files along in our request to the server
                // FormData is a regular JS constructor
                var formData = new FormData();
                formData.append("title", this.title);
                formData.append("description", this.description);
                formData.append("username", this.username);
                formData.append("file", this.file);
                // formData has this strange behavior that if I console.log it at this point
                // it will log an empty object! we have to loop through the values of the object in
                // a specific way if we want to see them client side.

                var thisOfData = this;
                axios
                    .post("/upload", formData)
                    .then(function ({ data }) {
                        console.log("response from POST /upload: ", data);

                        thisOfData.images.unshift(data);

                        console.log(
                            "response from POST /upload after unshift: ",
                            data
                        );
                    })
                    .catch(function (err) {
                        console.log("error in POST /upload: ", err);
                    });
            },
            handleChange: function (e) {
                console.log("handleChange ran!");
                // our event object has access to the file that was put into the input field
                // aka selected or upload:
                console.log("file: ", e.target.files[0]);

                // make sure our file property of our data object holds the value of our file
                // in the input field:
                this.file = e.target.files[0];
            },
            closeModal: function () {
                // console.log("I am the parent. I just heard the event close");
                // console.log("this in parent closeModal: ", this);
                // console.log("this.selectedImage: ", this.selectedImage);
                this.selectedImage = null;
                location.hash = "";
            },
            getMoreImages: function (e) {
                e.preventDefault();
                var thisData = this;
                var arr = [];
                for (var i = 0; i < thisData.images.length; i++) {
                    arr.push(thisData.images[i].id);
                }
                var lastId = Math.min(...arr);
                axios
                    .get("/images/more/" + lastId)
                    .then((response) => {
                        console.log(
                            "response in getMoreImages: ",
                            response.data
                        );
                        console.log(
                            "thisData.images in getMoreImages: ",
                            thisData.images
                        );
                        thisData.images.push(...response.data);
                        if (response.data[response.data.length - 1].id === 1) {
                            thisData.seen = false;
                        }
                    })
                    .catch((err) => {
                        console.log("err in get more images: ", err);
                    });
            },
        },
    });
})();
