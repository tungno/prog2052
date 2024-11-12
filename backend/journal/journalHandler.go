package journal

import (
	"backend/db"
	"backend/model"
	"encoding/json"
	"net/http"
	"time"

	"google.golang.org/api/iterator"
)

// CreateJournalHandler handles creating a new journal entry
func CreateJournalHandler(w http.ResponseWriter, r *http.Request) {
	var journal model.Journal
	err := json.NewDecoder(r.Body).Decode(&journal)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	journalDate, err := time.Parse("2006-01-02", journal.Date)
	if err != nil {
		http.Error(w, "Invalid date format. Please use YYYY-MM-DD.", http.StatusBadRequest)
		return
	}
	journal.Date = journalDate.Format("2006-01-02")

	userDocRef := db.Client.Collection("users").Doc(journal.Email).Collection("journals")
	docRef, _, err := userDocRef.Add(db.Ctx, journal)
	if err != nil {
		http.Error(w, "Failed to create journal", http.StatusInternalServerError)
		return
	}

	journal.JournalID = docRef.ID
	_, err = docRef.Set(db.Ctx, journal)
	if err != nil {
		http.Error(w, "Failed to update journal with JournalID", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":   "Journal created successfully",
		"journalID": journal.JournalID,
	})
}

// GetJournalHandler retrieves a journal entry by its ID
func GetJournalHandler(w http.ResponseWriter, r *http.Request) {
	journalID := r.URL.Query().Get("journalID")
	userEmail := r.URL.Query().Get("email")
	if journalID == "" || userEmail == "" {
		http.Error(w, "Missing journalID or email parameter", http.StatusBadRequest)
		return
	}

	doc, err := db.Client.Collection("users").Doc(userEmail).Collection("journals").Doc(journalID).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "Journal not found", http.StatusNotFound)
		return
	}

	journalData := doc.Data()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(journalData)
}

// UpdateJournalHandler updates an existing journal entry
func UpdateJournalHandler(w http.ResponseWriter, r *http.Request) {
	journalID := r.URL.Query().Get("journalID")
	userEmail := r.URL.Query().Get("email")
	if journalID == "" || userEmail == "" {
		http.Error(w, "Missing journalID or email parameter", http.StatusBadRequest)
		return
	}

	var journal model.Journal
	err := json.NewDecoder(r.Body).Decode(&journal)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	docRef := db.Client.Collection("users").Doc(userEmail).Collection("journals").Doc(journalID)
	_, err = docRef.Set(db.Ctx, journal)
	if err != nil {
		http.Error(w, "Failed to update journal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Journal updated successfully",
	})
}

// DeleteJournalHandler deletes a journal entry by ID
func DeleteJournalHandler(w http.ResponseWriter, r *http.Request) {
	journalID := r.URL.Query().Get("journalID")
	userEmail := r.URL.Query().Get("email")
	if journalID == "" || userEmail == "" {
		http.Error(w, "Missing journalID or email parameter", http.StatusBadRequest)
		return
	}

	docRef := db.Client.Collection("users").Doc(userEmail).Collection("journals").Doc(journalID)
	_, err := docRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to delete journal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Journal deleted successfully",
	})
}

// GetAllJournalsHandler fetches all journal entries for the logged-in user
func GetAllJournalsHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.URL.Query().Get("email")
	if userEmail == "" {
		http.Error(w, "Missing email parameter", http.StatusBadRequest)
		return
	}

	userDocRef := db.Client.Collection("users").Doc(userEmail).Collection("journals")
	iter := userDocRef.Documents(db.Ctx)

	var journals []model.Journal

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			http.Error(w, "Failed to retrieve journals", http.StatusInternalServerError)
			return
		}

		var journal model.Journal
		err = doc.DataTo(&journal)
		if err != nil {
			http.Error(w, "Failed to parse journal data", http.StatusInternalServerError)
			return
		}

		// Get the document ID from the reference
		journal.JournalID = doc.Ref.ID // Set the JournalID to the document ID
		journals = append(journals, journal)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(journals)
}
