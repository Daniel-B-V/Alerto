// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdJ33RmL_1vnM3AnRXhrkhdGCULiNDPnc",
  authDomain: "alerto-966c7.firebaseapp.com",
  projectId: "alerto-966c7",
  storageBucket: "alerto-966c7.firebasestorage.app",
  messagingSenderId: "380143166451",
  appId: "1:380143166451:web:ba9e9126cff0c0f9396886",
  measurementId: "G-69VX3VVLWM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);