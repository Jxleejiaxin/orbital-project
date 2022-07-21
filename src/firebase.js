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
>>>>>>> c48e610fb5d360c2decc4d82c73ac1e55dc1f9c7
