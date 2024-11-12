// Calendar.js

import React, { useState, useEffect } from 'react';
import './Calendar.css';
import Month from './Month';
import Week from './Week';
import Day from './Day';
import Year from './Year';
import EventModal from './EventModal';
import { API_BASE_URL } from "../../App"; // Import the base URL of the backend API

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // Default view is 'month'
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState({
        email: '',
        username: '',
        isLoggedIn: !!localStorage.getItem('auth-token')
    });
    const [userEvents, setUserEvents] = useState([]);
    const [friendEvents, setFriendEvents] = useState([]);

    // Fetch logged-in user info when the component mounts
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('auth-token');
                const response = await fetch(`${API_BASE_URL}/api/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser({ ...data, isLoggedIn: true });
                }
            } catch (error) {
                console.error("Error fetching user info", error);
            }
        };

        fetchUserInfo();
    }, []);

    // Fetch events from the backend when the component mounts
    useEffect(() => {
        const fetchEventsFromBackend = async () => {
            if (!user.email) {
                console.error("User email not available");
                return;
            }

            try {
                const token = localStorage.getItem('auth-token');
                const response = await fetch(`${API_BASE_URL}/api/events/all?email=${user.email}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const eventData = await response.json();
                    console.log("Fetched event data:", eventData);

                    // Separate events into userEvents and friendEvents
                    const userEventsData = eventData.filter(event => event.email === user.email);
                    const friendEventsData = eventData.filter(event => event.email !== user.email);

                    console.log("User Events:", userEventsData);
                    console.log("Friend Events:", friendEventsData);

                    setUserEvents(userEventsData);
                    setFriendEvents(friendEventsData);
                } else {
                    console.error('Failed to fetch events.');
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        if (user.email) {
            fetchEventsFromBackend();  // Fetch events once the user email is available
        }
    }, [user.email]);  // Depend on user.email to trigger this useEffect only when it's available

    // Helper function to clone the currentDate object to avoid mutating the original
    const cloneDate = (date) => new Date(date.getTime());

    // Increment or decrement the current date based on view
    const incrementDate = () => {
        if (view === 'day') {
            setCurrentDate(prevDate => new Date(prevDate.getTime() + 24 * 60 * 60 * 1000)); // Add one day
        } else if (view === 'week') {
            setCurrentDate(prevDate => new Date(prevDate.getTime() + 7 * 24 * 60 * 60 * 1000)); // Add one week
        } else if (view === 'month') {
            setCurrentDate(prevDate => {
                const newDate = cloneDate(prevDate); // Clone the current date
                newDate.setMonth(newDate.getMonth() + 1); // Add one month
                return newDate;
            });
        } else if (view === 'year') {
            setCurrentDate(prevDate => {
                const newDate = cloneDate(prevDate); // Clone the current date
                newDate.setFullYear(newDate.getFullYear() + 1); // Add one year
                return newDate;
            });
        }
    };

    const decrementDate = () => {
        if (view === 'day') {
            setCurrentDate(prevDate => new Date(prevDate.getTime() - 24 * 60 * 60 * 1000)); // Subtract one day
        } else if (view === 'week') {
            setCurrentDate(prevDate => new Date(prevDate.getTime() - 7 * 24 * 60 * 60 * 1000)); // Subtract one week
        } else if (view === 'month') {
            setCurrentDate(prevDate => {
                const newDate = cloneDate(prevDate); // Clone the current date
                newDate.setMonth(newDate.getMonth() - 1); // Subtract one month
                return newDate;
            });
        } else if (view === 'year') {
            setCurrentDate(prevDate => {
                const newDate = cloneDate(prevDate); // Clone the current date
                newDate.setFullYear(newDate.getFullYear() - 1); // Subtract one year
                return newDate;
            });
        }
    };

    // Get the current month name
    const getMonthName = () => {
        return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "September 2024"
    };

    // Go to today's date
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleAddEvent = () => {
        if (!user.isLoggedIn) {
            alert('You must be logged in to add an event.');
            return;
        }
        setEventModalOpen(true);
    };

    // Handle the submission of a new event (send data to the backend)
    const handleEventSubmit = async (event) => {
        try {
            event.email = user.email; // Ensure the event includes the user's email

            const response = await fetch(`${API_BASE_URL}/api/events/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify(event)
            });

            if (response.ok) {
                const responseData = await response.json();
                event.EventID = responseData.eventID; // Set the event ID returned from the backend

                // Update the userEvents state with the new event
                setUserEvents([...userEvents, event]);
            } else {
                const errorData = await response.json();
                alert(`Failed to add event: ${errorData.message}`);
            }
        } catch (error) {
            alert('An error occurred while adding the event.');
        } finally {
            setEventModalOpen(false); // Close the modal
        }
    };

    // Handle event updates
    const handleUpdateEvent = async (updatedEvent) => {
        console.log('Updating event with eventID:', updatedEvent.eventID); // Debugging line
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/update?eventID=${updatedEvent.eventID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify(updatedEvent)
            });

            if (response.ok) {
                // Update the userEvents state with the updated event
                setUserEvents(userEvents.map(event => event.EventID === updatedEvent.EventID ? updatedEvent : event));
            } else {
                const errorData = await response.json();
                alert(`Failed to update event: ${errorData.message}`);
            }
        } catch (error) {
            alert('An error occurred while updating the event.');
        }
    };

    // Handle event deletions
    const handleDeleteEvent = async (eventToDelete) => {
        console.log('Deleting event with eventID:', eventToDelete.EventID); // Debugging line
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/delete?eventID=${eventToDelete.EventID}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                }
            });

            if (response.ok) {
                // Remove the deleted event from userEvents
                setUserEvents(userEvents.filter(event => event.EventID !== eventToDelete.EventID));
            } else {
                const errorData = await response.json();
                alert(`Failed to delete event: ${errorData.message}`);
            }
        } catch (error) {
            alert('An error occurred while deleting the event.');
        }
    };

    const renderCalendarView = () => {
        switch (view) {
            case 'day':
                return (
                    <Day
                        currentDate={currentDate}
                        userEvents={userEvents}
                        friendEvents={friendEvents}
                        user={user}
                        onUpdateEvent={handleUpdateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                );
            case 'week':
                return (
                    <Week
                        currentDate={currentDate}
                        userEvents={userEvents}
                        friendEvents={friendEvents}
                        user={user}
                        onUpdateEvent={handleUpdateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                );
            case 'month':
                return (
                    <Month
                        currentDate={currentDate}
                        userEvents={userEvents}
                        friendEvents={friendEvents}
                        user={user}
                        onUpdateEvent={handleUpdateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                );
            case 'year':
                return (
                    <Year
                        currentDate={currentDate}
                        userEvents={userEvents}
                        friendEvents={friendEvents}
                        user={user}
                        onUpdateEvent={handleUpdateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                );
            default:
                return (
                    <Month
                        currentDate={currentDate}
                        userEvents={userEvents}
                        friendEvents={friendEvents}
                        user={user}
                        onUpdateEvent={handleUpdateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                );
        }
    };

    return (
        <div className="calendar-container">
            <div className="view-controls">
                <button
                    onClick={() => setView('day')}
                    className={view === 'day' ? 'active' : ''}>
                    Day
                </button>
                <button
                    onClick={() => setView('week')}
                    className={view === 'week' ? 'active' : ''}>
                    Week
                </button>
                <button
                    onClick={() => setView('month')}
                    className={view === 'month' ? 'active' : ''}>
                    Month
                </button>
                <button
                    onClick={() => setView('year')}
                    className={view === 'year' ? 'active' : ''}>
                    Year
                </button>
            </div>

            <div className="calendar-controls">
                <button onClick={decrementDate}>&lt; Previous {view.charAt(0).toUpperCase() + view.slice(1)}</button>
                <span className="current-month">{getMonthName()}</span> {/* Display current month */}
                <button onClick={incrementDate}>Next {view.charAt(0).toUpperCase() + view.slice(1)} &gt;</button>
                <button className="add-event-btn" onClick={handleAddEvent}>+ Add Event</button>
            </div>

            <div className="today-button">
                <button onClick={goToToday}>Today</button>
            </div>

            <div className="calendar-content">
                {renderCalendarView()}
            </div>

            {isEventModalOpen && (
                <EventModal
                    onSubmit={handleEventSubmit}
                    onClose={() => setEventModalOpen(false)}
                    currentDate={currentDate}
                    user={user}
                />
            )}
        </div>
    );
};

export default Calendar;
