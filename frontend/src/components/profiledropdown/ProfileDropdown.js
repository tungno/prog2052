import React from 'react';

const ProfileDropdown = () => {
    return (
        <div className="profile-dropdown-menu">
            <Link to="/edit-profile">Edit Profile</Link>
            <Link to="/friend-list">Friend List</Link>
            <button onClick={() => {
                localStorage.removeItem('auth-token');
                localStorage.removeItem('userInfo');
                window.location.replace('/');  // Redirect to home after logout
            }}>Logout</button>
        </div>
    );
};

export default ProfileDropdown;
