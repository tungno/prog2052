const EntryList = ({ journals, onEdit, onDelete, searchTerm, filterYear, filterMonth, onSearchChange, onYearFilterChange, onMonthFilterChange, uniqueYears }) => (
    <div className="journal-list">
        <h2>Your Journals</h2>
        <div>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={onSearchChange}
            />
            <select onChange={onYearFilterChange}>
                <option value="">All Years</option>
                {uniqueYears.map(year => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
            <select onChange={onMonthFilterChange}>
                <option value="">All Months</option>
                {[...Array(12).keys()].map(month => (
                    <option key={month} value={month + 1}>
                        {new Date(0, month).toLocaleString('default', { month: 'long' })}
                    </option>
                ))}
            </select>
        </div>
        {journals.length > 0 ? journals.map((journal) => (
            <div key={journal.journalID} className="journal-item">
                <div>
                    <strong>Date:</strong> {journal.date}
                    <p>{journal.content.split(' ').slice(0, 8).join(' ')}...</p> {/* Limit to 8 words */}
                </div>
                <button onClick={() => onEdit(journal)}>Edit</button>
                <button className="delete-button" onClick={() => onDelete(journal.journalID)}>Delete</button>
            </div>
        )) : (
            <p>No journal entries found.</p>
        )}
    </div>
);

export default EntryList;
