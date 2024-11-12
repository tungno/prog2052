import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../App';
import './YourFriendList.css'; // Component-specific styles

const YourFriendList = () => {
    const [friendList, setFriendList] = useState([]);  // Initialize as an empty array

    useEffect(() => {
        const fetchFriendList = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/friends/list`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                    }
                });
                const data = await response.json();
                setFriendList(data || []);  // Fallback to empty array if data is null or undefined
            } catch (error) {
                console.error('Error fetching friend list:', error);
                setFriendList([]);  // Fallback to empty array on error
            }
        };

        fetchFriendList();
    }, []);

    const handleRemoveFriend = async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                alert('Friend removed successfully');
                setFriendList(friendList.filter(friend => friend !== username)); // Remove from UI
            } else {
                alert('Failed to remove friend');
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <div className="your-friends-section">
            <h3>Your Friendlist</h3>
            {friendList && friendList.length > 0 ? (  // Safely check if friendList exists and has length
                <ul className="friend-list">
                    {friendList.map(friend => (
                        <li key={friend} className="friend-item">
                            <span>{friend}</span>
                            <button
                                className="remove-friend-button"
                                onClick={() => handleRemoveFriend(friend)}>
                                Remove Friend
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no friends yet.</p>
            )}
        </div>
    );
};

export default YourFriendList;
