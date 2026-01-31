
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6qm4FUWMl_w322ppNrKgj7MxJh65lrLA",
  authDomain: "download-40425.firebaseapp.com",
  databaseURL: "https://download-40425-default-rtdb.firebaseio.com",
  projectId: "download-40425",
  storageBucket: "download-40425.firebasestorage.app",
  messagingSenderId: "767585908524",
  appId: "1:767585908524:web:fc0d217a470b3d6e329e89",
  measurementId: "G-6SFS8ZN49J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
