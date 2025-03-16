// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "techsphere-aaea0.firebaseapp.com",
    projectId: "techsphere-aaea0",
    storageBucket: "techsphere-aaea0.appspot.com", // Fix this
    messagingSenderId: "10953963530",
    appId: "1:10953963530:web:bf72e29c8cc337bbc7c7f3"
  };
  

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

