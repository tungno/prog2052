// Eventhandler.go

package event

import (
	"backend/db"
	"backend/model"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	ics "github.com/arran4/golang-ical"
)

// Helper function to check if an item exists in a slice
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// CreateEventHandler handles creating a new event
func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	var event model.Event
	err := json.NewDecoder(r.Body).Decode(&event)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate EventTypeID
	event.EventTypeID = strings.ToLower(event.EventTypeID)
	if event.EventTypeID != "public" && event.EventTypeID != "private" {
		http.Error(w, "Invalid event type", http.StatusBadRequest)
		return
	}

	// Parse and format the date
	eventDate, err := time.Parse("2006-01-02", event.Date)
	if err != nil {
		http.Error(w, "Invalid date format. Please use YYYY-MM-DD.", http.StatusBadRequest)
		return
	}
	event.Date = eventDate.Format("2006-01-02")

	// Ensure the event includes the user's email
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok || userEmail == "" {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}
	event.Email = userEmail

	// Add the event to Firestore under the user's events subcollection
	userDocRef := db.Client.Collection("users").Doc(event.Email).Collection("events")
	docRef, _, err := userDocRef.Add(db.Ctx, event)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	event.EventID = docRef.ID
	_, err = docRef.Set(db.Ctx, event)
	if err != nil {
		http.Error(w, "Failed to update event with EventID", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Event created successfully",
		"eventID": event.EventID,
	})
}

// GetEventHandler retrieves an event by its ID
func GetEventHandler(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("eventID")
	if eventID == "" {
		http.Error(w, "Missing eventID parameter", http.StatusBadRequest)
		return
	}

	// Retrieve the user's email from the context
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok || userEmail == "" {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}

	// Retrieve the event from the user's subcollection
	docRef := db.Client.Collection("users").Doc(userEmail).Collection("events").Doc(eventID)
	doc, err := docRef.Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	var event model.Event
	err = doc.DataTo(&event)
	if err != nil {
		http.Error(w, "Error parsing event data", http.StatusInternalServerError)
		return
	}

	// Ensure that the event belongs to the user
	if event.Email != userEmail {
		http.Error(w, "Unauthorized to access this event", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

// UpdateEventHandler updates an existing event
func UpdateEventHandler(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("eventID")
	if eventID == "" {
		http.Error(w, "Missing eventID parameter", http.StatusBadRequest)
		return
	}

	var event model.Event
	err := json.NewDecoder(r.Body).Decode(&event)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Retrieve the user's email from the context
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok || userEmail == "" {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}

	// Retrieve the existing event to verify ownership
	docRef := db.Client.Collection("users").Doc(userEmail).Collection("events").Doc(eventID)
	doc, err := docRef.Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	var existingEvent model.Event
	err = doc.DataTo(&existingEvent)
	if err != nil {
		http.Error(w, "Error parsing event data", http.StatusInternalServerError)
		return
	}

	if existingEvent.Email != userEmail {
		http.Error(w, "Unauthorized to update this event", http.StatusUnauthorized)
		return
	}

	// Update the event
	event.EventID = eventID // Ensure EventID is set
	_, err = docRef.Set(db.Ctx, event)
	if err != nil {
		http.Error(w, "Failed to update event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Event updated successfully",
	})
}

// DeleteEventHandler deletes an event by ID
func DeleteEventHandler(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("eventID")
	if eventID == "" {
		http.Error(w, "Missing eventID parameter", http.StatusBadRequest)
		return
	}

	// Retrieve the user's email from the context
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok || userEmail == "" {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}

	// Retrieve the existing event to verify ownership
	docRef := db.Client.Collection("users").Doc(userEmail).Collection("events").Doc(eventID)
	doc, err := docRef.Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	var existingEvent model.Event
	err = doc.DataTo(&existingEvent)
	if err != nil {
		http.Error(w, "Error parsing event data", http.StatusInternalServerError)
		return
	}

	if existingEvent.Email != userEmail {
		http.Error(w, "Unauthorized to delete this event", http.StatusUnauthorized)
		return
	}

	// Proceed to delete the event
	_, err = docRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to delete event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Event deleted successfully",
	})
}

// GetAllEventsHandler fetches all events for the authenticated user, including public events from mutual friends
func GetAllEventsHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the user's email from the query parameter
	userEmail := r.URL.Query().Get("email")
	if userEmail == "" {
		http.Error(w, "Missing email parameter", http.StatusBadRequest)
		return
	}

	log.Printf("GetAllEventsHandler called by user: %s", userEmail)

	// Get user's accepted friends
	friendsDocs, err := db.Client.Collection("friends").
		Where("Email", "==", userEmail).
		Where("Status", "==", "accepted").
		Documents(db.Ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching friends: %v", err)
		http.Error(w, "Failed to fetch friends", http.StatusInternalServerError)
		return
	}

	log.Printf("Fetched %d friends", len(friendsDocs))

	var mutualFriendEmails []string
	for _, doc := range friendsDocs {
		friendEmail := doc.Data()["FriendEmail"].(string)

		// Check if the friend also has the current user as a friend (mutual friendship)
		mutualDocs, err := db.Client.Collection("friends").
			Where("Email", "==", friendEmail).
			Where("FriendEmail", "==", userEmail).
			Where("Status", "==", "accepted").
			Documents(db.Ctx).GetAll()

		// If mutual friend, add to list of friends
		if err == nil && len(mutualDocs) > 0 {
			mutualFriendEmails = append(mutualFriendEmails, friendEmail)
		}
	}

	var events []model.Event

	// Query the user's own events
	userEventsDocs, err := db.Client.Collection("users").Doc(userEmail).Collection("events").Documents(db.Ctx).GetAll()
	if err != nil {
		http.Error(w, "Failed to fetch user's events", http.StatusInternalServerError)
		return
	}

	for _, doc := range userEventsDocs {
		var event model.Event
		err := doc.DataTo(&event)
		if err != nil {
			http.Error(w, "Error parsing event data", http.StatusInternalServerError)
			return
		}

		event.EventID = doc.Ref.ID

		events = append(events, event)
	}

	// Now, query public events from mutual friends
	if len(mutualFriendEmails) > 0 {
		batchSize := 10
		for i := 0; i < len(mutualFriendEmails); i += batchSize {
			end := i + batchSize
			if end > len(mutualFriendEmails) {
				end = len(mutualFriendEmails)
			}
			batchEmails := mutualFriendEmails[i:end]

			// Perform collection group query
			query := db.Client.CollectionGroup("events").
				Where("Email", "in", batchEmails).
				Where("EventTypeID", "==", "public")
			mutualEventsDocs, err := query.Documents(db.Ctx).GetAll()
			if err != nil {
				http.Error(w, "Failed to fetch mutual friends' events", http.StatusInternalServerError)
				return
			}

			for _, doc := range mutualEventsDocs {
				var event model.Event
				err := doc.DataTo(&event)
				if err != nil {
					http.Error(w, "Error parsing event data", http.StatusInternalServerError)
					return
				}

				event.EventID = doc.Ref.ID

				events = append(events, event)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(events)
	if err != nil {
		http.Error(w, "Failed to encode events", http.StatusInternalServerError)
		return
	}
}

func NTNUTimetableImportHandler(w http.ResponseWriter, r *http.Request) {
	userEmail := r.Context().Value("userEmail").(string)
	eventsCollection := db.Client.Collection("users").Doc(userEmail).Collection("events")

	// Check if the request is a file upload
	if r.Method == http.MethodPost {
		if err := r.ParseMultipartForm(10 << 20); err != nil { // Limit file size to 10 MB
			http.Error(w, "Failed to parse multipart form", http.StatusBadRequest)
			return
		}

		// Check for file
		file, _, err := r.FormFile("icsFile")
		if err == nil {
			// Process uploaded file
			defer file.Close()
			cal, err := ics.ParseCalendar(file)
			if err != nil {
				http.Error(w, "Failed to parse ICS file", http.StatusInternalServerError)
				return
			}
			importEvents(cal, eventsCollection, userEmail)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "ICS file imported successfully"})
			return
		}

		// Check for URL parameter
		url := r.FormValue("url")
		if url == "" {
			http.Error(w, "Missing url parameter or file", http.StatusBadRequest)
			return
		}

		// Fetch and parse the NTNU timetable from the URL
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch NTNU timetable", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		data, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read NTNU timetable", http.StatusInternalServerError)
			return
		}

		cal, err := ics.ParseCalendar(strings.NewReader(string(data)))
		if err != nil {
			http.Error(w, "Failed to parse NTNU timetable", http.StatusInternalServerError)
			return
		}

		importEvents(cal, eventsCollection, userEmail)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "NTNU timetable imported successfully"})
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

// Helper function to import events into Firestore
func importEvents(cal *ics.Calendar, eventsCollection *firestore.CollectionRef, userEmail string) {
	for _, event := range cal.Events() {
		startTime, err := time.Parse("20060102T150405Z", event.GetProperty("DTSTART").Value)
		if err != nil {
			log.Printf("Failed to parse start time for event %s: %v", event.GetProperty("SUMMARY").Value, err)
			continue
		}
		endTime, err := time.Parse("20060102T150405Z", event.GetProperty("DTEND").Value)
		if err != nil {
			log.Printf("Failed to parse end time for event %s: %v", event.GetProperty("SUMMARY").Value, err)
			continue
		}

		// Create new event struct from ICS data
		newEvent := model.Event{
			Title:         event.GetProperty("SUMMARY").Value,
			Description:   event.GetProperty("DESCRIPTION").Value,
			StreetAddress: event.GetProperty("LOCATION").Value,
			EventTypeID:   "private", // Default to private
			StartTime:     startTime.Format(time.RFC3339),
			EndTime:       endTime.Format(time.RFC3339),
			Date:          startTime.Format("2006-01-02"),
			Email:         userEmail,
		}

		// Add the event to Firestore
		docRef, _, err := eventsCollection.Add(db.Ctx, newEvent)
		if err != nil {
			log.Printf("Failed to save event '%s' to Firestore: %v", newEvent.Title, err)
			continue
		}

		// Set the EventID after creating the document
		newEvent.EventID = docRef.ID
		_, err = docRef.Set(db.Ctx, newEvent)
		if err != nil {
			log.Printf("Failed to update event with EventID '%s': %v", newEvent.EventID, err)
		}
	}
}
