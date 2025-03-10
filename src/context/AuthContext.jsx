import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useState, useEffect, useContext, createContext } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider(props) {
  const { children } = props;
  const [globalUser, setGlobalUser] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function resetPassword() {
    return sendPasswordResetEmail(auth, email);
  }

  function logout() {
    setGlobalUser(null);
    setGlobalData(null);
    return signOut(auth);
  }

  const value = {
    globalUser,
    globalData,
    setGlobalData,
    isLoading,
    signup,
    login,
    logout,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("CURRENT USER: ", user);
      setGlobalUser(user);
      // IF THERE IS NO USER, EMPLTY THE USER STATE AND RETURN FROM THIS LISTENER
      if (!user) {
        console.log("No active user");
        return;
      }

      try {
        setIsLoading(true);

        // FIRST WE CREATE A REFERANCE FOR THE DOCUMENT (LANELLED JSON OBJECT), AND THEN WE GET THE DOC, AND THEN WE SNAPSHO IT TO SEE IF THERE IS ANYTHING THERE
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let firebaseData = {};
        if (docSnap.exists()) {
          firebaseData = docSnap.data();
          console.log("Found user data", firebaseData);
        }
        setGlobalData(firebaseData);
      } catch (error) {
        console.log(error.massage);
      } finally {
        setIsLoading(false);
      }

      // IF THERE IS A USER, THEN CHECK IF THE USER HAS DATA IN THE DATABASE, AND IF THEY DO, THEN FETCH SAID DATA AND UPDATE THE GLOBAL STATE
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
