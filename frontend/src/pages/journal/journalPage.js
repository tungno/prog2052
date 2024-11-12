import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext/AuthContext'; // Import the authentication context for managing user state
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook for navigation
import EntryList from '../../components/journal/EntryList'; // Import EntryList component for displaying journal entries
import EntryEditor from '../../components/journal/EntryEditor'; // Import EntryEditor component for creating/updating journal entries
import EntryNotification from '../../components/journal/EntryNotification'; // Import EntryNotification for displaying messages
import './JournalPage.css'; // Import CSS styles for JournalPage
import { API_BASE_URL} from "../../App";


const Journal = () => {
    // Context for authentication token and user details
    const { authToken, user } = useContext(AuthContext);
    const [journals, setJournals] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentJournal, setCurrentJournal] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const navigate = useNavigate();

    // Effect to check authentication and fetch journals on mount
    useEffect(() => {
        if (!authToken) {
            navigate('/api/login'); // Redirect to login if not authenticated
        } else {
            fetchJournals(); // Fetch journals for the authenticated user
            setTodayDate(); // Set today's date as default
        }
    }, [authToken]);

    // Automatically hide messages after 3 seconds
    useEffect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
                setSuccessMessage('');
            }, 3000);

            return () => clearTimeout(timer); // Cleanup the timer
        }
    }, [errorMessage, successMessage]);

   // Function to set today's date in YYYY-MM-DD format
   const setTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today); // Set selected date to today
};

// Function to fetch journals from the API
const fetchJournals = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/journals/?email=${user.email}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }, // Include auth token in headers
        });
        if (response.ok) {
            const data = await response.json();
            // Sort journals by date in descending order
            const sortedJournals = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
            setJournals(sortedJournals); // Update state with sorted journals
        } else {
            console.error('Error fetching journals'); // Log error if fetching fails
        }
    } catch (error) {
        console.error('Fetch journals failed:', error); // Log error if there’s a fetch issue
    }
};

// Function to handle date change
const handleDateChange = (e) => {
    const selected = e.target.value; // Get selected date
    const today = new Date().toISOString().split('T')[0];

    if (selected > today) {
        setErrorMessage('You cannot select a future date.'); // Set error if future date is selected
        return;
    }

    setSelectedDate(selected); // Update selected date
    const existingJournal = journals.find(journal => journal.date === selected); // Check for existing journal entry

    if (existingJournal) {
        setErrorMessage(`An entry for ${selected} already exists. Please edit the existing entry.`); // Set error if entry exists
        setIsEditing(false);  
        setContent('');       
    } else {
        setIsEditing(false);  
        setCurrentJournal(null); 
        setContent('');       
        setErrorMessage('');  
    }
};

// Function to handle saving a new journal entry
const handleSaveJournal = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        setErrorMessage('Invalid date format. Please use YYYY-MM-DD.'); // Set error for invalid date format
        return;
    }

    if (content.trim() === '') {
        setErrorMessage('Journal content cannot be blank. Please write something before saving.'); // Set error for empty content
        return;
    }

    // Check if there is already an entry for the selected date
    const existingJournal = journals.find(journal => journal.date === selectedDate);
    if (existingJournal) {
        setErrorMessage(`An entry for ${selectedDate} already exists. Please edit the existing entry.`); // Set error if entry exists
        return; // Prevent creating a new entry
    }

    const journalData = { email: user.email, date: selectedDate, content }; // Prepare journal data

    try {
        const response = await fetch(`${API_BASE_URL}/api/journal/save`, {
            method: 'POST', // Specify POST method for creating new journal
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, // Set headers
            body: JSON.stringify(journalData), // Send journal data as JSON
        });

        const rawResponse = await response.text();
        if (response.ok) {
            setErrorMessage(''); // Clear error message on success
            setSuccessMessage('Journal entry saved successfully!'); // Set success message
            setContent(''); // Clear content after saving
            fetchJournals(); // Fetch updated journal list
        } else {
            const errorResponse = JSON.parse(rawResponse);
            setErrorMessage(errorResponse.message || 'Failed to save journal'); // Handle API error response
        }
    } catch (error) {
        console.error('Error saving journal:', error); // Log error if saving fails
        setErrorMessage('Error saving journal. Please try again.'); // Set error message
    }
};

// Function to handle editing an existing journal entry
const handleEditJournal = (journal) => {
    setIsEditing(true); // Set editing state to true
    setCurrentJournal(journal); // Set current journal to the one being edited
    setSelectedDate(journal.date); // Set selected date to the journal's date
    setContent(journal.content); // Set content to the journal's content
};

// Function to handle updating an existing journal entry
const handleUpdateJournal = async () => {
    const updatedJournal = { ...currentJournal, content }; // Prepare updated journal data

    try {
        const response = await fetch(`${API_BASE_URL}/api/journal/update/?journalID=${currentJournal.journalID}&email=${user.email}`, {
            method: 'PUT', // Specify PUT method for updating
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, // Set headers
            body: JSON.stringify(updatedJournal), // Send updated journal data as JSON
        });

        if (response.ok) {
            setSuccessMessage('Journal entry updated successfully!'); // Set success message on update
            fetchJournals(); // Fetch updated journal list
            setIsEditing(false); // Reset editing state
            setContent(''); // Clear content after updating
            setCurrentJournal(null); // Clear current journal
        } else {
            setErrorMessage('Failed to update journal'); // Set error message on failure
        }
    } catch (error) {
        setErrorMessage('Error updating journal. Please try again.'); // Set error message if update fails
    }
};

// Function to handle deleting a journal entry
const handleDeleteJournal = async (journalID) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) { // Confirm deletion
        try {
            const response = await fetch(`${API_BASE_URL}/api/journal/delete/?journalID=${journalID}&email=${user.email}`, {
                method: 'DELETE', // Specify DELETE method for removal
                headers: { 'Authorization': `Bearer ${authToken}` }, // Set headers
            });

            if (response.ok) {
                fetchJournals(); // Fetch updated journal list after deletion
            } else {
                console.error('Failed to delete journal'); // Log error if deletion fails
            }
        } catch (error) {
            console.error('Error deleting journal:', error); // Log error if there's an issue with deletion
        }
    }
};

// Function to handle changes in the search input
const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update search term state
};

// Function to handle changes in the year filter
const handleYearFilterChange = (e) => {
    setFilterYear(e.target.value); // Update year filter state
};

// Function to handle changes in the month filter
const handleMonthFilterChange = (e) => {
    setFilterMonth(e.target.value); // Update month filter state
};

    const filteredJournals = journals.filter(journal => {
        const journalDate = new Date(journal.date);
        const isYearMatch = filterYear ? journalDate.getFullYear().toString() === filterYear : true;
        const isMonthMatch = filterMonth ? (journalDate.getMonth() + 1).toString() === filterMonth : true;
        const isSearchMatch = journal.content.toLowerCase().includes(searchTerm.toLowerCase());

        return isYearMatch && isMonthMatch && isSearchMatch;
    });

    const uniqueYears = [...new Set(journals.map(journal => new Date(journal.date).getFullYear()))];

    return (
        <div className="journal-page">
            <h1>{isEditing ? 'Change of thoughts?' : 'Something on your mind?'}</h1>
            <EntryNotification message={errorMessage} className="error-message" />
            <EntryNotification message={successMessage} className="success-message" />

            <div className="journal-layout">
                <EntryList
                    journals={filteredJournals}
                    onEdit={handleEditJournal}
                    onDelete={handleDeleteJournal}
                    searchTerm={searchTerm}
                    filterYear={filterYear}
                    filterMonth={filterMonth}
                    onSearchChange={handleSearchChange}
                    onYearFilterChange={handleYearFilterChange}
                    onMonthFilterChange={handleMonthFilterChange}
                    uniqueYears={uniqueYears}
                />
                <EntryEditor
                    isEditing={isEditing}
                    selectedDate={selectedDate}
                    content={content}
                    onDateChange={handleDateChange}
                    onContentChange={(e) => setContent(e.target.value)}
                    onSave={handleSaveJournal}
                    onUpdate={handleUpdateJournal}
                />
            </div>
        </div>
    );
};

export default Journal;
