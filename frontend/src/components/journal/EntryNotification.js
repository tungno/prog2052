import React from 'react';

const EntryNotification = ({ message, className }) => {
    if (!message) return null;

    return (
        <div className={className}>{message}</div>
    );
};

export default EntryNotification;
