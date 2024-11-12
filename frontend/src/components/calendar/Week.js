import React from 'react';
import './Week.css';

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get the start of the week (Monday as the first day of the week)
const getStartOfWeek = (date) => {
    const day = date.getDay() || 7; // Sunday is 0, we need it to be 7 for ISO weeks
    if (day !== 1) {
        date.setHours(-24 * (day - 1));
    }
    return date;
};

// Get all events for the current week
const getEventsForWeek = (events, startDate) => {
    const startOfWeek = getStartOfWeek(new Date(startDate));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 7 days total

    return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
};

const Week = ({ currentDate, events }) => {
    const startOfWeek = getStartOfWeek(new Date(currentDate));
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        weekDays.push(currentDay);
    }

    const weekEvents = getEventsForWeek(events, startOfWeek);

    return (
        <div className="week-view">
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
                <tr>
                    {weekDays.map((day, idx) => {
                        const formattedDay = formatDate(day);
                        const dayEvents = weekEvents.filter(event => event.date === formattedDay);

                        return (
                            <td key={idx}>
                                <div>{formattedDay}</div>
                                <div className="event-stars">
                                    {dayEvents.map((event, idx) => (
                                        <span key={idx} className="event-star">⭐</span>
                                    ))}
                                </div>
                            </td>
                        );
                    })}
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Week;
