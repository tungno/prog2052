import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserEdit, FaUserFriends, FaSignOutAlt } from 'react-icons/fa'; // Ensure react-icons is installed
import './Header.css';
import logo from '../../assets/logo.png';
import { AuthContext } from "../../AuthContext/AuthContext";

const Header = () => {
    const { user, setUser, setAuthToken } = useContext(AuthContext);
    const [dropdownOpen, setDropdownOpen] = useState(false); // Dropdown visibility state
    const [greeting, setGreeting] = useState('');
    const navigate = useNavigate();

    // Determine greeting based on the time of day
    React.useEffect(() => {
        const hours = new Date().getHours();
        if (hours < 12) setGreeting('Good Morning');
        else if (hours < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');

        setUser(null);
        setAuthToken(null);

        navigate('/');
    };

    const getUserGreeting = () => user ? `${greeting}, ${user.username}` : greeting;

    // Toggle the dropdown menu visibility
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Close the dropdown when clicking outside
    const closeDropdown = () => setDropdownOpen(false);

    return (
        <header className="header">
            <Link to="/" className="logo">
                <img src={logo} alt="Logo" className="logo-img" />
            </Link>

            <div className="greeting">{getUserGreeting()}</div>

            <div className="header-links">
                {user ? (
                    <div className="profile-dropdown">
                        <button className="profile-link" onClick={toggleDropdown}>
                            Profile
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-content">
                                <Link to="/edit-profile" onClick={closeDropdown}>
                                    <FaUserEdit /> Edit Profile
                                </Link>
                                <Link to="/friend" onClick={closeDropdown}>
                                    <FaUserFriends /> Friend
                                </Link>
                                <button onClick={() => { handleLogout(); closeDropdown(); }}>
                                    <FaSignOutAlt /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="login-link">Login</Link>
                )}
            </div>
        </header>
    );
};

export default Header;
