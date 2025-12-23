import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

// ------------------ Firebase Setup ------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function Home() {
  const OWNER_EMAIL = "owner@example.com"; // Dein Owner Account
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [mode, setMode] = useState("light");
  const [authMode, setAuthMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    botName: "",
    botType: "Discord",
    botWebsite: "",
    botPhone: "",
    botDiscord: ""
  });

  // ----------- Auth Listener ----------
  useEffect(() => {
    onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) loadBots();
    });
  }, []);

  // ----------- Load Bots ----------
  const loadBots = async () => {
    const snapshot = await getDocs(collection(db, "bots"));
    setBots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ----------- Auth ----------
  const handleAuth = async () => {
    const { email, password } = formData;
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // ----------- Add Bot ----------
  const handleAddBot = async () => {
    if (!formData.botName) return alert("Bitte Bot Name eingeben");
    await addDoc(collection(db, "bots"), {
      name: formData.botName,
      type: formData.botType,
      website: formData.botWebsite,
      discord: formData.botDiscord,
      phone: formData.botPhone,
      ownerEmail: user.email,
      verified: false,
      banned: false,
      ratings: [],
      comments: []
    });
    setFormData({ ...formData, botName: "", botWebsite: "", botDiscord: "", botPhone: "" });
    loadBots();
  };

  // ----------- Owner Actions ----------
  const verifyBot = async id => {
    const docRef = doc(db, "bots", id);
    await updateDoc(docRef, { verified: true });
    loadBots();
  };

  const banBot = async id => {
    const docRef = doc(db, "bots", id);
    await updateDoc(docRef, { banned: true });
    loadBots();
  };

  const deleteBot = async id => {
    const docRef = doc(db, "bots", id);
    await deleteDoc(docRef);
    loadBots();
  };

  // ---------- UI ----------
  return (
    <div className={mode}>
      <header style={{ padding: 20, display: "flex", justifyContent: "space-between", background: "#020617", color: "#fff" }}>
        <h1 style={{ color: "#38bdf8" }}>🤖 BotHub</h1>
        <div>
          <button onClick={() => setMode(mode === "light" ? "dark" : "light")}>🌗</button>
          {user ? (
            <button onClick={handleLogout}>Logout ({user.email})</button>
          ) : (
            <button onClick={() => setAuthMode("login")}>Login/Register</button>
          )}
        </div>
      </header>

      {!user && (
        <div style={{ padding: 20 }}>
          <h2>{authMode === "login" ? "Anmelden" : "Registrieren"}</h2>
          <input placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input type="password" placeholder="Passwort" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <button onClick={handleAuth}>{authMode === "login" ? "Login" : "Registrieren"}</button>
          <p style={{ cursor: "pointer", color: "#38bdf8" }} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>Konto wechseln</p>
        </div>
      )}

      {user && (
        <main style={{ padding: 20 }}>
          {user.email !== OWNER_EMAIL && (
            <div style={{ marginBottom: 20 }}>
              <h2>Bot hinzufügen</h2>
              <input placeholder="Bot Name" value={formData.botName} onChange={e => setFormData({ ...formData, botName: e.target.value })} />
              <select value={formData.botType} onChange={e => setFormData({ ...formData, botType: e.target.value })}>
                <option value="Discord">Discord</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Beides">Discord & WhatsApp</option>
              </select>
              <input placeholder="Website" value={formData.botWebsite} onChange={e => setFormData({ ...formData, botWebsite: e.target.value })} />
              <input placeholder="WhatsApp Nummer" value={formData.botPhone} onChange={e => setFormData({ ...formData, botPhone: e.target.value })} />
              <input placeholder="Discord Link" value={formData.botDiscord} onChange={e => setFormData({ ...formData, botDiscord: e.target.value })} />
              <button onClick={handleAddBot}>Hinzufügen</button>
            </div>
          )}

          <h2>Alle Bots</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {bots.filter(b => !b.banned).map(bot => (
              <div key={bot.id} style={{ padding: 16, background: "#020617", borderRadius: 12, color: "#fff", border: bot.ownerEmail === OWNER_EMAIL ? "2px solid gold" : "none" }}>
                <h3>{bot.name} {bot.verified && "✔"}</h3>
                <p>Type: {bot.type}</p>
                {bot.website && <p>🌐 <a style={{color:"#38bdf8"}} href={bot.website} target="_blank">Website</a></p>}
                {bot.discord && <p>💬 <a style={{color:"#38bdf8"}} href={bot.discord} target="_blank">Discord Link</a></p>}
                {bot.phone && <p>📱 {bot.phone}</p>}
                {user.email === OWNER_EMAIL && (
                  <>
                    {!bot.verified && <button onClick={() => verifyBot(bot.id)}>Verifizieren</button>}
                    <button onClick={() => banBot(bot.id)}>Sperren</button>
                    <button onClick={() => deleteBot(bot.id)}>Löschen</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
