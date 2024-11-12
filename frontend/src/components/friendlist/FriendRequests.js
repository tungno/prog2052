import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../App';
import './FriendRequests.css'; // Component-specific styles

const FriendRequests = () => {
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch friend requests');
                }

                const data = await response.json();

                // Log the API response for debugging purposes
                console.log("Friend Requests API Response:", data);

                // Check if data is an array and has expected structure
                if (Array.isArray(data) && data.every(req => req.username)) {
                    setFriendRequests(data);
                } else {
                    console.error('Unexpected response structure:', data);
                }
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        };

        fetchFriendRequests();
    }, []);

    const acceptFriendRequest = async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({ username })
            });
            if (response.ok) {
                alert('Friend request accepted!');
                setFriendRequests(friendRequests.filter(request => request.username !== username));
            } else {
                alert('Failed to accept friend request');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const declineFriendRequest = async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({ username })
            });
            if (response.ok) {
                alert('Friend request declined!');
                setFriendRequests(friendRequests.filter(request => request.username !== username));
            } else {
                alert('Failed to decline friend request');
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };

    return (
        <div className="friend-requests-section">
            <h3>Friend Requests</h3>
            {friendRequests.length > 0 ? (
                <ul className="friend-requests-list">
                    {friendRequests.map(request => (
                        <li key={request.username} className="friend-request-item">
                            {request.username}
                            <div className="friend-request-actions">
                                <button onClick={() => acceptFriendRequest(request.username)} className="accept-friend-button">Accept</button>
                                <button onClick={() => declineFriendRequest(request.username)} className="decline-friend-button">Decline</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No friend requests</p>
            )}
        </div>
    );
};

export default FriendRequests;
