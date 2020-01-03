const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')()

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyA20INr4U0zvxZLOB_wwQkAPcbedBpYC5s",
    authDomain: "socialapp-dd7cc.firebaseapp.com",
    databaseURL: "https://socialapp-dd7cc.firebaseio.com",
    projectId: "socialapp-dd7cc",
    storageBucket: "socialapp-dd7cc.appspot.com",
    messagingSenderId: "214598796937",
    appId: "1:214598796937:web:18a32d99555709bfaea858",
    measurementId: "G-TD05QVPFTE"
  };

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig)

const db = admin.firestore();

app.get('/posts', (req, res) => {
    db
        .collection('Posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let posts = []
            data.forEach((doc) => {
                posts.push({
                    postId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                })
            })
            return res.json(posts)
        })
        .catch(err => console.error(err))
})

app.post('/posts', (req, res) => {
    const newPost = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    db
        .collection('Posts')
        .add(newPost)
        .then((doc) => {
            res.json({ message: `Document ${doc.id} created successfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'Something went wrong' })
            console.error(err)
        })
})

//Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    //TODO validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'This handle is already taken' })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
                    .then(data => {
                        userId = data.user.uid;
                        return data.user.getIdToken();
                    })
                    .then(idToken => {
                        token = idToken
                        const userCredentials = {
                            handle: newUser.handle,
                            email: newUser.email,
                            createdAt: new Date().toISOString(),
                            userId
                        };
                        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
                    })
                    .then(() => {
                        return res.status(201).json({ token })
                    })
                    .catch(err => {
                        console.error(err);
                        if (err.code === "auth/email-already-in-use") {
                            return res.status(400).json({ email: 'Email is already in use' })
                        } else {
                            return res.status(500).json({ error: err.code})
                        }
                    })
            }
        })
})

exports.api = functions.https.onRequest(app);