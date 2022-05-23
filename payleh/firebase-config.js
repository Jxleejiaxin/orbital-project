// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBH5EppuMHhV5ghGdCdMPatR5HG4wowPgo",
  authDomain: "payleh-ef723.firebaseapp.com",
  projectId: "payleh-ef723",
  storageBucket: "payleh-ef723.appspot.com",
  messagingSenderId: "205863978203",
  appId: "1:205863978203:web:3037b80ed4153760a3b8fe",
  measurementId: "G-95FE2F9LKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const authentication = getAuth(app);