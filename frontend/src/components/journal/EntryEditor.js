import React from 'react';

const EntryEditor = ({ 
    isEditing, 
    selectedDate, 
    content, 
    onDateChange, 
    onContentChange, 
    onSave, 
    onUpdate 
}) => (
    <div className="journal-input">
        <input
            type="date"
            value={selectedDate}
            onChange={onDateChange}
            placeholder="Select date"
        />
        <textarea
            value={content}
            onChange={onContentChange}
            placeholder="Write your journal..."
            rows={4}
        />
        <button onClick={isEditing ? onUpdate : onSave}>
            {isEditing ? 'Update Journal' : 'Save Journal'}
        </button>
    </div>
);

export default EntryEditor;
