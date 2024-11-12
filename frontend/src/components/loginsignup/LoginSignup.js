// File: frontend/src/components/LoginSignup/LoginSignup.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import { API_BASE_URL } from '../../App';
import { AuthContext } from '../../AuthContext/AuthContext';
import AsyncSelect from 'react-select/async'; // Import AsyncSelect

const LoginSignup = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { setUser, setAuthToken } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formError, setFormError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    // State variables for country and city
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    // New state variables for Resend OTP
    const [resendCooldown, setResendCooldown] = useState(0); // in seconds
    const [isResending, setIsResending] = useState(false);
    const [resendError, setResendError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');

    // Custom styles for AsyncSelect components
    const customSelectStyles = {
        container: (provided) => ({
            ...provided,
            width: '300px',
            margin: '5px 0',
        }),
        control: (provided, state) => ({
            ...provided,
            padding: '2px',
            border: state.isFocused ? '1px solid #4a90e2' : '1px solid #ccc',
            boxShadow: state.isFocused ? '0 0 5px rgba(74, 144, 226, 0.3)' : 'none',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            backgroundColor: 'white',
            ':hover': {
                borderColor: '#4a90e2',
            },
        }),
        input: (provided) => ({
            ...provided,
            margin: '0',
            padding: '0',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999, // Ensure menu appears above other elements
        }),
    };

    // Effect to handle cooldown timer
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[^A-Za-z0-9]/.test(password),
        };
        return requirements;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'email' && !isLogin) {
            const isValid = validateEmail(value);
            if (!isValid) {
                setEmailError('Please enter a valid email address');
            } else {
                setEmailError('');
            }
        }

        if ((name === 'password' || name === 'newPassword') && (!isLogin || isResettingPassword)) {
            const requirements = validatePassword(value);
            setPasswordRequirements(requirements);
        }
    };

    // Separate handler for newPassword in Reset Password
    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        const requirements = validatePassword(value);
        setPasswordRequirements(requirements);
    };

    // Fetch countries from the backend
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

    // Fetch cities based on selected country
    const fetchCities = async (inputValue) => {
        if (!selectedCountry) return [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/cities?country=${selectedCountry}`);
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

    // Handle country selection
    const handleCountryChange = (selectedOption) => {
        setSelectedCountry(selectedOption ? selectedOption.value : null);
        setSelectedCity(null); // Reset city when country changes
    };

    // Handle city selection
    const handleCityChange = (selectedOption) => {
        setSelectedCity(selectedOption ? selectedOption.value : null);
    };

    const handleLogin = async () => {
        setFormError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setAuthToken(data.token);
                localStorage.setItem('auth-token', data.token);

                const userResponse = await fetch(`${API_BASE_URL}/api/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                    },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }

                navigate('/');
            } else {
                let errorMessage = 'Login failed';
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                }
                setFormError(errorMessage);
            }
        } catch (error) {
            console.error('Error during login:', error);
            setFormError('An unexpected error occurred. Please try again.');
        }
    };

    const handleSignup = async () => {
        setFormError('');

        // Validate email
        if (!validateEmail(formData.email)) {
            setFormError('Please enter a valid email address');
            return;
        }
        // Validate password requirements
        if (!Object.values(passwordRequirements).every(value => value === true)) {
            setFormError('Please meet all password requirements');
            return;
        }
        // Ensure country is selected
        if (!selectedCountry) {
            setFormError('Please select a country');
            return;
        }
        // Ensure city is selected
        if (!selectedCity) {
            setFormError('Please select a city');
            return;
        }

        // Prepare data to send to the backend
        const dataToSend = {
            ...formData,
            country: selectedCountry,
            city: selectedCity,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const data = await response.json();

                // Set to verification step
                setIsVerifying(true);
                setFormError('');
                // Store the email in state for use during verification
                setFormData({ ...formData, email: dataToSend.email });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setFormError(errorData.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            setFormError('An unexpected error occurred. Please try again.');
        }
    };

    const handleVerification = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otpCode,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAuthToken(data.token);
                localStorage.setItem('auth-token', data.token);

                const userResponse = await fetch(`${API_BASE_URL}/api/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                    },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }

                navigate('/');
            } else {
                const errorText = await response.text();
                setFormError(errorText || 'Verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Verification Error:', error);
            setFormError('An unexpected error occurred. Please try again.');
        }
    };

    const handleForgotPassword = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
                // Proceed to OTP verification step for password reset
                setIsVerifying(true);
                setFormError('');
                // Store the email in state for use during verification
                setFormData({ ...formData, email: formData.email });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setFormError(errorData.message || 'Failed to send reset code. Please try again.');
            }
        } catch (error) {
            console.error('Forgot Password Error:', error);
            setFormError('An unexpected error occurred. Please try again.');
        }
    };

    const handleResetPassword = async () => {
        // Validate new password
        const requirements = validatePassword(newPassword);
        if (!Object.values(requirements).every(value => value === true)) {
            setFormError('Please meet all password requirements');
            setPasswordRequirements(requirements);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otpCode,
                    newPassword: newPassword,
                }),
            });

            if (response.ok) {
                setFormError('');
                alert('Password has been reset successfully. Please log in with your new password.');
                setIsResettingPassword(false);
                setIsLogin(true);
                setIsVerifying(false);
                setFormData({ ...formData, password: '' });
                setOtpCode('');
                setNewPassword('');
                setResendCooldown(0);
                setResendError('');
                setResendSuccess('');
            } else {
                const errorText = await response.text();
                setFormError(errorText || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Reset Password Error:', error);
            setFormError('An unexpected error occurred. Please try again.');
        }
    };

    const handleResendOTP = async (context) => {
        // context can be 'signup' or 'resetPassword'
        setIsResending(true);
        setResendError('');
        setResendSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
                const data = await response.json();
                const message = context === 'signup'
                    ? 'A new OTP has been sent to your email address for verification.'
                    : 'A new OTP has been sent to your email address for password reset.';
                setResendSuccess(message);
                // Start cooldown timer (e.g., 60 seconds)
                setResendCooldown(60);
            } else if (response.status === 429) {
                const errorData = await response.json().catch(() => ({}));
                setResendError(errorData.message || 'Too many requests. Please try again later.');
                // Optionally, parse 'Retry-After' header if provided by backend
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                    const retryAfterSeconds = parseInt(retryAfter, 10);
                    if (!isNaN(retryAfterSeconds)) {
                        setResendCooldown(retryAfterSeconds);
                    }
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setResendError(errorData.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            console.error('Resend OTP Error:', error);
            setResendError('An unexpected error occurred. Please try again.');
        } finally {
            setIsResending(false);
        }
    };


    const isPasswordValid = Object.values(passwordRequirements).every(value => value === true);

    return (
        <div className="login-signup-container">
            {
                isResettingPassword ? (
                    isVerifying ? (
                        <>
                            <h1>Reset Password</h1>
                            {formError && <div className="error-message"> {formError} </div> }
                            <p>Please enter the OTP code sent to your email:</p>
                            <input
                                type="text"
                                name="otpCode"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter OTP code"
                            />
                            <input
                                type="password"
                                name="newPassword"
                                value={newPassword}
                                onChange={handleNewPasswordChange} // Updated handler
                                placeholder="Enter new password"
                            />
                            {/* Display password requirements */}
                            <div className="password-requirements">
                                <p>Password must contain:</p>
                                <ul>
                                    <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                                        At least 8 characters
                                    </li>
                                    <li className={passwordRequirements.hasUpperCase ? 'valid' : 'invalid'}>
                                        At least one uppercase letter
                                    </li>
                                    <li className={passwordRequirements.hasNumber ? 'valid' : 'invalid'}>
                                        At least one number
                                    </li>
                                    <li className={passwordRequirements.hasSpecialChar ? 'valid' : 'invalid'}>
                                        At least one special character
                                    </li>
                                </ul>
                                {isPasswordValid && <div className="password-accepted">Password accepted 😊</div>}
                            </div>
                            <button onClick={handleResetPassword}>Reset Password</button>
                            {/* Resent OTP Button */}
                            <div className="resend-otp-section">
                                <button
                                    onClick={() => handleResendOTP('resetPassword')}
                                    disabled={resendCooldown > 0 || isResending}
                                >
                                    {isResending ? 'Resending...' : 'Resend OTP'}
                                </button>
                                { resendCooldown > 0 && (
                                    <p>Please wait {resendCooldown} seconds before resending.</p>
                                )}
                                {resendError && <div className="error-message"> {resendError} </div> }
                                {resendSuccess && <div className="success-message"> {resendSuccess} </div> }
                            </div>
                        </>

                    ) : (
                        <>
                            <h1>Forgot Password</h1>
                            {formError && <div className="error-message">{formError}</div>}
                            <p>Please enter your email to receive a reset code:</p>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                            />
                            <button onClick={handleForgotPassword}>Send Reset Code</button>
                        </>
                    )
                ) : isVerifying ? (
                    // Email verification step after signup
                    <>
                        <h1>Email Verification</h1>
                        {formError && <div className="error-message">{formError}</div>}
                        <p>Please enter the OTP code sent to your email:</p>
                        <input
                            type="text"
                            name="otpCode"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter OTP code"
                        />
                        <button onClick={handleVerification}>Verify Email</button>
                        {/* Resend OTP Button */}
                        <div className="resend-otp-section">
                            <button
                                onClick={() => handleResendOTP('signup')}
                                disabled={resendCooldown > 0 || isResending}
                            >
                                {isResending ? 'Resending...' : 'Resend OTP' }
                            </button>
                            {resendCooldown > 0 && (
                                <p>Please wait {resendCooldown} seconds before resending.</p>
                            )}
                            {resendError && <div className="error-message">{resendError}</div> }
                            {resendSuccess && <div className="success-message">{resendSuccess} </div> }
                        </div>
                    </>
                ) : (
                    <>
                        <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
                        {formError && <div className="error-message">{formError}</div>}
                        {!isLogin && (
                            <>
                                {/* Country AsyncSelect */}
                                <AsyncSelect
                                    styles={customSelectStyles}
                                    cacheOptions
                                    loadOptions={fetchCountries}
                                    onChange={handleCountryChange}
                                    placeholder="Search for a country (3+ letters)"
                                    defaultOptions={[]}
                                    isClearable
                                />

                                {/* City AsyncSelect */}
                                {selectedCountry && (
                                    <AsyncSelect
                                        styles={customSelectStyles}
                                        cacheOptions
                                        loadOptions={fetchCities}
                                        onChange={handleCityChange}
                                        placeholder="Search for a city"
                                        defaultOptions={[]}
                                        isClearable
                                    />
                                )}

                                {/* Username Input */}
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Enter your username"
                                />
                            </>
                        )}
                        {/* Email Input */}
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                        />
                        {emailError && <div className="error-message">{emailError}</div>}
                        {/* Password Input */}
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                        />
                        {/* Password Requirements */}
                        {!isLogin && (
                            <div className="password-requirements">
                                <p>Password must contain:</p>
                                <ul>
                                    <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                                        {passwordRequirements.minLength ? '✓' : '✗'} At least 8 characters
                                    </li>
                                    <li className={passwordRequirements.hasUpperCase ? 'valid' : 'invalid'}>
                                        {passwordRequirements.hasUpperCase ? '✓' : '✗'} At least one uppercase letter
                                    </li>
                                    <li className={passwordRequirements.hasNumber ? 'valid' : 'invalid'}>
                                        {passwordRequirements.hasNumber ? '✓' : '✗'} At least one number
                                    </li>
                                    <li className={passwordRequirements.hasSpecialChar ? 'valid' : 'invalid'}>
                                    {passwordRequirements.hasSpecialChar ? '✓' : '✗'} At least one special character
                                    </li>
                                </ul>
                                {isPasswordValid && <div className="password-accepted">Password accepted 😊</div>}
                            </div>
                        )}
                        {/* Submit Button */}
                        <button onClick={isLogin ? handleLogin : handleSignup}>
                            {isLogin ? 'Login' : 'Sign Up'}
                        </button>
                        {isLogin && (
                            <p>
                                <span
                                    className="link-text"
                                    onClick={() => { setIsResettingPassword(true); setFormError(''); }}
                                >
                                    Forgot Password?
                                </span>
                            </p>
                        )}
                        <p>
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <span
                                className="link-text"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setFormError('');
                                    setIsResettingPassword(false);
                                    setIsVerifying(false);
                                    setResendCooldown(0);
                                    setResendError('');
                                    setResendSuccess('');
                                }}
                            >
                                {isLogin ? ' Sign Up' : ' Login'}
                            </span>
                        </p>
                    </>
                )
            }

        </div>
    );

};

export default LoginSignup;
