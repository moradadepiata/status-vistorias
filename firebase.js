import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8Xkr6rU1n2Fmu7HrvHzD4n9rHHoNRU9E",
  authDomain: "vistorias-23821.firebaseapp.com",
  projectId: "vistorias-23821",
  storageBucket: "vistorias-23821.firebasestorage.app",
  messagingSenderId: "912197763726",
  appId: "1:912197763726:web:2c0ad62f435f87051fffdf"
};

const app = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdF_80sAAAAAM5PMIhUDSKn051X_XOM7z2UhUsb'),
  isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs
};