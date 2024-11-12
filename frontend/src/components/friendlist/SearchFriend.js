import React, { useState } from 'react';
import { API_BASE_URL } from '../../App';
import './SearchFriend.css'; // Component-specific styles

const SearchFriend = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [noResultsMessage, setNoResultsMessage] = useState(''); // State to handle no results message

    const handleSearch = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/search?query=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                }
            });
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                setSearchResults(data);
                setNoResultsMessage(''); // Clear any previous no-results message
            } else {
                setSearchResults([]);
                setNoResultsMessage(`No friend found with the name "${searchQuery}"`);
            }
        } catch (error) {
            console.error('Error searching for users:', error);
            setNoResultsMessage(`No friend found with the name "${searchQuery}"`);
        }
    };

    const handleAction = async (username, action) => {
        let endpoint = '';
        if (action === 'add') {
            endpoint = `${API_BASE_URL}/api/friends/add`;
        } else if (action === 'accept') {
            endpoint = `${API_BASE_URL}/api/friends/accept`;
        } else if (action === 'decline') {
            endpoint = `${API_BASE_URL}/api/friends/decline`;
        } else if (action === 'cancel') {
            const confirmCancel = window.confirm(`Are you sure you want to cancel the friend request to ${username}?`);
            if (!confirmCancel) return; // Exit if the user cancels the confirmation

            endpoint = `${API_BASE_URL}/api/friends/cancel`;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} request successful!`);
                handleSearch(); // Re-fetch search results after action to update the button text
            } else {
                alert(`Failed to ${action} friend request.`);
            }
        } catch (error) {
            console.error(`Error during ${action} friend request:`, error);
        }
    };

    return (
        <div className="search-friend-section">
            <h3>Search Friend</h3>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friend by username"
                className="search-input"
            />
            <button onClick={handleSearch} className="search-button">Search</button>

            {noResultsMessage && <p className="no-results-message">{noResultsMessage}</p>}

            {searchResults && searchResults.length > 0 && (
                <ul className="search-results">
                    {searchResults.map(user => (
                        <li key={user.username} className="search-result-item">
                            {user.username}
                            {user.status === 'none' && (
                                <button onClick={() => handleAction(user.username, 'add')} className="add-friend-button">Add Friend</button>
                            )}
                            {user.status === 'received' && (
                                <>
                                    <button onClick={() => handleAction(user.username, 'accept')} className="accept-friend-button">Accept</button>
                                    <button onClick={() => handleAction(user.username, 'decline')} className="decline-friend-button">Decline</button>
                                </>
                            )}
                            {user.status === 'pending' && (
                                <button onClick={() => handleAction(user.username, 'cancel')} className="pending-friend-button">Pending (Click to Cancel)</button>
                            )}
                            {user.status === 'accepted' && (
                                <button className="remove-friend-button">Remove Friend</button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchFriend;
