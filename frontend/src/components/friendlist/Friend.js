import React from 'react';
import './Friend.css'; // General styles for the Friend section
import SearchFriend from './SearchFriend';
import FriendRequests from './FriendRequests';
import YourFriendList from './YourFriendList';

const Friend = () => {
    return (
        <div className="friend-container">
            <div className="friend-header">
                <h2>Friend</h2>
            </div>
            <div className="friend-content">
                <div className="friend-search">
                    <SearchFriend />
                </div>
                <div className="friend-requests">
                    <FriendRequests />
                </div>
                <div className="your-friends">
                    <YourFriendList />
                </div>
            </div>
        </div>
    );
};

export default Friend;
