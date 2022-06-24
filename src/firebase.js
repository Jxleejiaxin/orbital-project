import firebase from "firebase/compat/app"
import "firebase/compat/auth"

const app = firebase.initializeApp({
    apiKey: "YOUR_OWN_API_KEY",
    authDomain: "YOUR_APP.firebaseapp.com",
    projectId: "YOUR_APP_ID",
    storageBucket: "YOUR_APP.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
})

export const auth = app.auth()
export default app
