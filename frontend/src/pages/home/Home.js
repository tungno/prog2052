import React, { useState, useEffect, useContext  } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import weather from '../../assets/weather.png';
import news from '../../assets/news.png';
import journal from '../../assets/journal.png';
import minigame from '../../assets/minigame.png';
import calendar from '../../assets/calendar.png';
import horoscope from '../../assets/horoscope.png';
import friendsIcon from '../../assets/friends.png';
import { AuthContext } from '../../AuthContext/AuthContext';

const Home = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { isLoggedIn } = useContext(AuthContext); // Use AuthContext to check if logged in


  // Function to calculate the current week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer); // Clear the interval when the component unmounts
  }, []);

  // Format date components
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get the day name
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long'});
  const weekNumber = getWeekNumber(currentDate);
  const formattedTime = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
      <div className="home-container">
        <div className="date-time-container">
          <h1>{formattedDate}</h1>
          <h2>{`${dayName}, Week ${weekNumber}`}</h2>
          <h3>{formattedTime}</h3>
        </div>
        <div className="grid-container">
          <Link to="/weather" className="component-link">
            <div className="component weather">
              <img src={weather} alt="Weather Icon" />
              <h4>Weather</h4>
            </div>
          </Link>
          <Link to="/news" className="component-link">
            <div className="component news">
              <img src={news} alt="News Icon" />
              <h4>News</h4>
            </div>
          </Link>
          <Link to="/journal" className="component-link">
            <div className="component journal">
              <img src={journal} alt="Journal Icon" />
              <h4>Journal</h4>
            </div>
          </Link>
          <Link to="/minigame" className="component-link">
            <div className="component minigame">
              <img src={minigame} alt="MiniGame Icon" />
              <h4>MiniGame</h4>
            </div>
          </Link>
          <Link to="/calendar" className="component-link">
            <div className="component calendar">
              <img src={calendar} alt="Calendar Icon" />
              <h4>Calendar</h4>
            </div>
          </Link>
          <Link to="/horoscope" className="component-link">
            <div className="component horoscope">
              <img src={horoscope} alt="Horoscope Icon" />
              <h4>Horoscope</h4>
            </div>
          </Link>
        </div>
      </div>
  );
};

export default Home;
