import React from 'react';
import './Day.css';

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getEventsForDay = (events, currentDate) => {
    const formattedDate = formatDate(currentDate);
    return events.filter(event => event.date === formattedDate);
};

const Day = ({ currentDate, events }) => {
    const formattedDate = formatDate(currentDate);
    const dayEvents = getEventsForDay(events, currentDate);

    return (
        <div className="day-view">
            <h3>Events for {formattedDate}</h3>
            {dayEvents.length > 0 ? (
                <ul>
                    {dayEvents.map((event, idx) => (
                        <li key={idx}>
                            <strong>{event.title}</strong>: {event.description}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No events for this day.</p>
            )}
        </div>
    );
};

export default Day;
