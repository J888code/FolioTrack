// Firebase Configuration for Portfolio Builder
const firebaseConfig = {
    apiKey: "AIzaSyBRznN8W7C76IbWdJqIW2O_P3IBsUoZ5-I",
    authDomain: "portfoliobuilder-e3dbc.firebaseapp.com",
    projectId: "portfoliobuilder-e3dbc",
    storageBucket: "portfoliobuilder-e3dbc.firebasestorage.app",
    messagingSenderId: "110037168241",
    appId: "1:110037168241:web:305075072a666c5d356bd0",
    databaseURL: "https://portfoliobuilder-e3dbc-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const database = firebase.database();

console.log('Firebase initialized for Portfolio Builder');
