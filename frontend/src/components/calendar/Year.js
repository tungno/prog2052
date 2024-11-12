import React from 'react';
import './Year.css';

const getEventsForYear = (events, currentYear) => {
    return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === currentYear;
    });
};

const Year = ({ currentDate, events }) => {
    const currentYear = currentDate.getFullYear();
    const yearEvents = getEventsForYear(events, currentYear);

    const months = Array.from({ length: 12 }, (_, i) => {
        const monthEvents = yearEvents.filter(event => new Date(event.date).getMonth() === i);
        return {
            monthIndex: i,
            eventCount: monthEvents.length
        };
    });

    return (
        <div className="year-view">
            <h3>Events for {currentYear}</h3>
            <table className="calendar-table">
                <thead>
                <tr>
                    <th>Jan</th>
                    <th>Feb</th>
                    <th>Mar</th>
                    <th>Apr</th>
                    <th>May</th>
                    <th>Jun</th>
                    <th>Jul</th>
                    <th>Aug</th>
                    <th>Sep</th>
                    <th>Oct</th>
                    <th>Nov</th>
                    <th>Dec</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    {months.map(({ monthIndex, eventCount }, idx) => (
                        <td key={idx}>
                            <div>{eventCount > 0 ? `⭐ ${eventCount}` : 'No events'}</div>
                        </td>
                    ))}
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Year;
