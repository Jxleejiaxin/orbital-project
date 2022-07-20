import firebase from "firebase/compat/app"
import "firebase/compat/auth"

const app = firebase.initializeApp({
    apiKey: "AIzaSyC2tgDG8OG9z8ylH4aM41qt9IhKJGOPXB0",
    authDomain: "payleh-login-d6c39.firebaseapp.com",
    projectId: "payleh-login-d6c39",
    storageBucket: "payleh-login-d6c39.appspot.com",
    messagingSenderId: "710816734570",
    appId: "1:710816734570:web:f0a378d6636771875a1913"
})

export const auth = app.auth()
<<<<<<< HEAD
export default app
=======
export default app
>>>>>>> 9133b2b3fd0537c2829a3a08fc70ab546dc94592
