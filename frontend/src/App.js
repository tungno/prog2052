import logo from './logo.svg';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import Header from './components/header/Header'
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";
import LoginSignup from "./components/loginsignup/LoginSignup";
import EditProfile from "./components/editprofile/EditProfile";
import Friend from "./components/friendlist/Friend";
import {AuthProvider} from "./AuthContext/AuthContext"; // all components have access to the user state
import News from "./components/news/News";
import Weather from "./components/weather/Weather";
import Horoscope from "./components/horoscope/Horoscope";
import Minigame from "./components/minigame/Minigame";
import Calendar from "./components/calendar/Calendar";
import Journal from './pages/journal/journalPage';
import PrivateRoute from './components/PrivateRoute';

// Export API Base URL from App.js
// export const API_BASE_URL = 'http://localhost:8080';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function App() {
  return (
      <AuthProvider>
          <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/edit-profile" element={<EditProfile />} />

                <Route path="/friend" element={<Friend />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/news" element={<News />} />
                <Route path="/minigame" element={<Minigame />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/horoscope" element={<Horoscope />} />


                
                <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
                
                
            </Routes>
            <Footer />
          </BrowserRouter>
      </AuthProvider>
  );
}

export default App;

// change runs-on: self-hosted