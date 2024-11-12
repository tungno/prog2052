import React, { createContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../App";

// Create the AuthContext
export const AuthContext = createContext();

// AuthProvider component to provide user state and token handling
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() =>
        JSON.parse(localStorage.getItem('user')) || null  // Rehydrate user from localStorage
    );
    const [authToken, setAuthToken] = useState(() =>
        localStorage.getItem('auth-token') || null // Rehydrate token from localStorage
    );

    const isLoggedIn = !!user; // Boolean value for whether user is logged in

    // Function to log out and clear tokens and user data
    const logout = () => {

        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');

        setAuthToken(null);
        setUser(null);
    };

    // Function to fetch user info using the token
    const fetchUserInfo = async () => {
        if (authToken) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,  // Attach the token directly
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);  // Set the user data in state
                    localStorage.setItem('user', JSON.stringify(data));  // Persist user to localStorage
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                logout();  // If error, clear user state and token
            }
        }
    };

    // Fetch user info on component mount if token exists
    useEffect(() => {
        if (authToken) {
            fetchUserInfo();
        }
    }, [authToken]);

    return (
        <AuthContext.Provider value={{ user, setUser, authToken, setAuthToken, logout, isLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
