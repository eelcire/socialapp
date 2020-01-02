const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/posts', (req, res) => {
    admin
        .firestore()
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

    admin
        .firestore()
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

exports.api = functions.https.onRequest(app);