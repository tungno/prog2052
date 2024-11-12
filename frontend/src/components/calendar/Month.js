// Month.js

import React, { useState } from 'react';
import './Month.css';
import EventModal from './EventModal'; // Import EventModal
import ConfirmationModal from './ConfirmationModal'; // Import ConfirmationModal

// Helper function to format dates to YYYY-MM-DD for comparison
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so we add 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to get events for the current month
const getEventsForMonth = (events = [], currentDate) => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are zero-indexed

    return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === currentYear && (eventDate.getMonth() + 1) === currentMonth;
    });
};

// Sort events for a day based on time
const sortEventsByTime = (events = []) => {
    return events.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.time}:00`);
        const timeB = new Date(`1970-01-01T${b.time}:00`);
        return timeA - timeB;
    });
};

const Month = ({ currentDate, userEvents = [], friendEvents = [], user, onUpdateEvent, onDeleteEvent }) => {
    const monthUserEvents = getEventsForMonth(userEvents, currentDate);
    const monthFriendEvents = getEventsForMonth(friendEvents, currentDate);

    // Initialize selected days for user and friend events
    const [selectedDay, setSelectedDay] = useState(null); // For user's own events
    const [selectedFriendDay, setSelectedFriendDay] = useState(null); // For friends' events

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    // Add state variables for editing and deleting
    const [eventToEdit, setEventToEdit] = useState(null);
    const [eventToDelete, setEventToDelete] = useState(null);

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<td key={`empty-${i}`}></td>);
    }

    const handleDayClick = (day) => {
        setSelectedDay(day);
    };

    const handleFriendEventClick = (e, day) => {
        e.stopPropagation(); // Prevent the event from bubbling up to the day cell
        setSelectedFriendDay(day);
    };

    const closeModal = () => {
        setSelectedDay(null);
    };

    const closeFriendModal = () => {
        setSelectedFriendDay(null);
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    };

    const handleFriendOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeFriendModal();
        }
    };

    const handleEditEvent = (event) => {
        setEventToEdit(event);
    };

    const handleDeleteEvent = (event) => {
        setEventToDelete(event);
    };

    const confirmDeleteEvent = (event) => {
        // Call the delete function passed down from Calendar component
        onDeleteEvent(event);
        setEventToDelete(null);
        closeModal(); // Close the modal after deleting
    };

    const handleUpdateEventSubmit = (updatedEvent) => {
        onUpdateEvent(updatedEvent);
        setEventToEdit(null);
        closeModal(); // Close the modal after updating
    };

    // Update the calendarDays loop
    for (let day = 1; day <= daysInMonth; day++) {
        const formattedDay = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

        // Separate user's events into public and private
        const dayUserEvents = monthUserEvents.filter(e => e.date === formattedDay);
        const dayUserPublicEvents = dayUserEvents.filter(e => e.eventTypeID === 'public');
        const dayUserPrivateEvents = dayUserEvents.filter(e => e.eventTypeID === 'private');

        // Friend events (public only)
        const dayFriendEvents = monthFriendEvents.filter(e => e.date === formattedDay);
        const hasFriendEvents = dayFriendEvents.length > 0;


        calendarDays.push(
            <td key={`day-${day}`} className="calendar-day">
                <div onClick={() => handleDayClick(day)}>{day}</div>
                {/* Display user's public events */}
                {dayUserPublicEvents.length > 0 && (
                    <div className="event-dots public">
                        {dayUserPublicEvents.map((event, idx) => (
                            <div key={`public-${idx}`} className="event-dot">
                                <span>{event.status}</span>
                            </div>
                        ))}
                    </div>
                )}
                {/* Display user's private events */}
                {dayUserPrivateEvents.length > 0 && (
                    <div className="event-dots private">
                        {dayUserPrivateEvents.map((event, idx) => (
                            <div key={`private-${idx}`} className="event-dot">
                                <span>{event.status}</span>
                            </div>
                        ))}
                    </div>
                )}
                {hasFriendEvents && (
                    <div className="friend-event-star" onClick={(e) => handleFriendEventClick(e, day)}>
                        <span>★</span>
                    </div>
                )}
            </td>
        );
    }

    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        rows.push(<tr key={`row-${i}`}>{calendarDays.slice(i, i + 7)}</tr>);
    }

    // Get events for the selected day
    const selectedDayUserEvents = monthUserEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDate() === selectedDay;
    });

    const sortedSelectedDayUserEvents = sortEventsByTime(selectedDayUserEvents);

    // Get friend events for the selected day
    const selectedDayFriendEvents = monthFriendEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getDate() === selectedFriendDay;
    });

    const sortedSelectedDayFriendEvents = sortEventsByTime(selectedDayFriendEvents);

    return (
        <div>
            <table className="calendar-table">
                <thead>
                <tr>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                    <th>Sun</th>
                </tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </table>

            {/* User's Events Modal */}
            {selectedDay && (
                <div className="modal-overlay" onClick={handleOverlayClick}>
                    <div className="modal">
                        <h2>Your Events for {selectedDay}</h2>
                        {sortedSelectedDayUserEvents.length > 0 ? (
                            <ul>
                                {sortedSelectedDayUserEvents.map((event, idx) => (
                                    <li key={idx}>
                                        <strong>Status/Title:</strong> {event.status} <br/>
                                        <strong>Description:</strong> {event.description} <br/>
                                        <strong>Address:</strong> {event.streetAddress} <br/>
                                        <strong>Postal Number:</strong> {event.postalNumber} <br/>
                                        <strong>Time:</strong> {event.time} <br/>
                                        <strong>Type:</strong> {event.eventTypeID === 'public' ? 'Public' : 'Private'}
                                        <div className="event-actions">
                                            <button onClick={() => handleEditEvent(event)}>Edit</button>
                                            <button onClick={() => handleDeleteEvent(event)}>Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No events for this day.</p>
                        )}
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}

            {/* Friends' Events Modal */}
            {selectedFriendDay && (
                <div className="modal-overlay" onClick={handleFriendOverlayClick}>
                    <div className="modal">
                        <h2>Friends' Public Events for {selectedFriendDay}</h2>
                        {sortedSelectedDayFriendEvents.length > 0 ? (
                            <ul>
                                {sortedSelectedDayFriendEvents.map((event, idx) => (
                                    <li key={idx}>
                                        <strong>From:</strong> {event.email} <br/>
                                        <strong>Status/Title:</strong> {event.status} <br/>
                                        <strong>Description:</strong> {event.description} <br/>
                                        <strong>Address:</strong> {event.streetAddress} <br/>
                                        <strong>Postal Number:</strong> {event.postalNumber} <br/>
                                        <strong>Time:</strong> {event.time} <br/>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No public events from friends on this day.</p>
                        )}
                        <button onClick={closeFriendModal}>Close</button>
                    </div>
                </div>
            )}

            {/* Event Modal for Editing */}
            {eventToEdit && (
                <EventModal
                    onSubmit={handleUpdateEventSubmit}
                    onClose={() => setEventToEdit(null)}
                    currentDate={currentDate}
                    user={user}
                    event={eventToEdit} // Pass the event to edit
                    isEditing={true} // Indicate that we are editing
                />
            )}

            {/* Confirmation Modal for Deleting */}
            {eventToDelete && (
                <ConfirmationModal
                    message="Are you sure you want to delete this event?"
                    onConfirm={() => confirmDeleteEvent(eventToDelete)}
                    onCancel={() => setEventToDelete(null)}
                />
            )}
        </div>
    );
};

export default Month;
