import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import './EditProfile.css';
import { API_BASE_URL } from '../../App';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const [profileData, setProfileData] = useState({ Username: '', Email: '' });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            const token = localStorage.getItem('auth-token');
            try {
                const response = await fetch(`${API_BASE_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProfileData(data);
                    if (data.Country) setSelectedCountry({ label: data.Country, value: data.Country });
                    if (data.City) setSelectedCity({ label: data.City, value: data.City });
                } else {
                    console.error('Failed to fetch profile data');
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };
        fetchProfileData();
    }, []);

    const fetchCountries = async (inputValue) => {
        if (inputValue.length < 3) return [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/countries?search=${inputValue}`);
            const data = await response.json();
            return data.map(country => ({
                label: country.name,
                value: country.name,
            }));
        } catch (error) {
            console.error('Error fetching countries:', error);
            return [];
        }
    };

    const fetchCities = async (inputValue) => {
        if (!selectedCountry) return [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/cities?country=${encodeURIComponent(selectedCountry.value)}`);
            const data = await response.json();
            const filteredCities = data.data.filter(city =>
                city.toLowerCase().includes(inputValue.toLowerCase())
            );
            return filteredCities.map(city => ({
                label: city,
                value: city,
            }));
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    };

    const handleSave = async () => {
        setMessage('');
        setError('');

        if (!profileData.Username) {
            setError('Username cannot be empty');
            return;
        }

        const token = localStorage.getItem('auth-token');
        if (!token) {
            setError('No auth token found');
            return;
        }

        if (!currentPassword) {
            setError('Please enter your current password to save changes');
            return;
        }

        const updatedProfile = {
            ...profileData,
            Country: selectedCountry ? selectedCountry.value : '',
            City: selectedCity ? selectedCity.value : '',
            CurrentPassword: currentPassword,
        };

        if (newPassword) {
            updatedProfile.NewPassword = newPassword;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProfile),
            });

            if (response.ok) {
                setMessage('Successfully updated your profile');
                setCurrentPassword('');
                setNewPassword('');
                setTimeout(() => navigate('/'), 2000); // Redirect to home after 2 seconds
            } else {
                const errorText = await response.text();
                setError(`Error updating profile: ${errorText}`);
            }
        } catch (error) {
            setError('Error in handleSave');
        }
    };

    return (
        <div className="edit-profile-container">
            <h1>Edit Profile</h1>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
                <label>Username</label>
                <input
                    type="text"
                    value={profileData.Username}
                    onChange={(e) => setProfileData({ ...profileData, Username: e.target.value })}
                    placeholder="Enter your username"
                />
            </div>

            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    value={profileData.Email}
                    placeholder="Enter your email"
                    disabled
                />
            </div>

            <div className="form-group">
                <label>Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                />
            </div>

            <div className="form-group">
                <label>New Password (optional)</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                />
            </div>

            <div className="form-group">
                <label>Country</label>
                <AsyncSelect
                    cacheOptions
                    loadOptions={fetchCountries}
                    onChange={(option) => setSelectedCountry(option)}
                    value={selectedCountry}
                    styles={{ container: (provided) => ({ ...provided, width: '300px' }) }}
                    placeholder="Search for a country (3+ letters)"
                    defaultOptions={[]}
                    isClearable
                />
            </div>

            {selectedCountry && (
                <div className="form-group">
                    <label>City</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={fetchCities}
                        onChange={(option) => setSelectedCity(option)}
                        value={selectedCity}
                        styles={{ container: (provided) => ({ ...provided, width: '300px' }) }}
                        placeholder="Search for a city"
                        defaultOptions={[]}
                        isClearable
                    />
                </div>
            )}

            <button className="save-button" onClick={handleSave}>Save</button>
        </div>
    );
};

export default EditProfile;
