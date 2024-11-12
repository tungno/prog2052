import React, { useState, useEffect } from 'react';
import './EventModal.css';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const EventModal = ({ onSubmit, onClose, currentDate, user, event = null, isEditing = false }) => {
    const [streetAddress, setStreetAddress] = useState(event ? event.streetAddress : '');
    const [postalNumber, setPostalNumber] = useState(event ? event.postalNumber : '');
    const [status, setStatus] = useState(event ? event.status : '');
    const [description, setDescription] = useState(event ? event.description : '');
    const [startTime, setStartTime] = useState(event ? event.startTime : '12:00');
    const [endTime, setEndTime] = useState(event ? event.endTime : '13:00');
    const [eventTypeID, setEventTypeID] = useState(event ? event.eventTypeID : 'public');
    const [date, setDate] = useState(event ? event.date : currentDate.toISOString().split('T')[0]);
    const [importUrl, setImportUrl] = useState('');
    const [icsFile, setIcsFile] = useState(null); // State for the ICS file
    const [loading, setLoading] = useState(false);
    const [urlError, setUrlError] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (event) {
            setStreetAddress(event.streetAddress);
            setPostalNumber(event.postalNumber);
            setStatus(event.status);
            setDescription(event.description);
            setStartTime(event.startTime);
            setEndTime(event.endTime);
            setEventTypeID(event.eventTypeID);
            setDate(event.date);
        }
    }, [event]);

    const handleSubmit = () => {
        if (!streetAddress || !postalNumber || !description || !startTime || !endTime || !eventTypeID || !date) {
            setFormError('Please fill in all fields.');
            return;
        }

        const eventData = {
            eventID: event ? event.eventID : undefined, // Include eventID if editing
            streetAddress,
            postalNumber,
            status,
            description,
            startTime,
            endTime,
            eventTypeID,
            date,
            email: user.email,
        };

        onSubmit(eventData);
    };

    const isValidUrl = (url) => {
        const regex = /^(ftp|http|https):\/\/[^ "]+$/;
        return regex.test(url);
    };

    const handleImport = () => {
        setUrlError('');
        if (importUrl && !isValidUrl(importUrl)) {
            setUrlError('Invalid URL format. Please enter a valid NTNU timetable URL.');
            return;
        }
    
        setLoading(true);
        const formData = new FormData();
        if (importUrl) {
            formData.append('url', importUrl);
        }
        if (icsFile) {
            formData.append('icsFile', icsFile);
        }
    
        const token = localStorage.getItem('auth-token');
        if (!token) {
            alert('User not authenticated');
            return;
        }
    
        fetch(`${API_BASE_URL}/api/import-ntnu-timetable`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Failed to import events.');
                });
            }
            return response.json();
        })
        .then(data => {
            alert('Events imported successfully!');
            onClose(); 
            window.location.reload(); // Refresh the page after closing the modal
        })
        .catch(error => {
            alert(error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    };
    

    return (
        <div className="event-modal-overlay">
            <div className="event-modal-content">
                <h2>{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
                <div className="event-modal-form">
                    {formError && <div className="error-message">{formError}</div>}
                    <label>
                        Status/Title
                        <input
                            type="text"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            placeholder="Enter status or event title"
                        />
                    </label>
                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter event description"
                        ></textarea>
                    </label>
                    <label>
                        Street Address
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Enter street address"
                        />
                    </label>
                    <label>
                        Postal Number
                        <input
                            type="text"
                            value={postalNumber}
                            onChange={(e) => setPostalNumber(e.target.value)}
                            placeholder="Enter postal number"
                        />
                    </label>
                    <label>
                        Start Time
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </label>
                    <label>
                        End Time
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </label>
                    <label>
                        Date
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </label>
                    <label>
                        Event Type
                        <select
                            value={eventTypeID}
                            onChange={(e) => setEventTypeID(e.target.value)}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </label>
                    <label>
                        Import NTNU Timetable URL
                        <input
                            type="text"
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="Enter NTNU timetable URL"
                        />
                        {urlError && <div className="error-message">{urlError}</div>}
                    </label>
                    <label>
                        Or Upload ICS File
                        <input
                            type="file"
                            accept=".ics"
                            onChange={(e) => setIcsFile(e.target.files[0])}
                        />
                    </label>
                    <div className="event-modal-buttons">
                        <button className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button className="submit-btn" onClick={handleSubmit}>
                            {isEditing ? 'Save Changes' : 'Submit'}
                        </button>
                        <button className="import-btn" onClick={handleImport} disabled={loading}>
                            {loading ? 'Importing...' : 'Import NTNU Timetable'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
