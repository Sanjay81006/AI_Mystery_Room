SPEC.md: AI Mystery Room
A. Project Requirements
1. Project Overview & Problem Statement
AI Mystery Room is an interactive, AI-powered web application where users generate and solve custom murder/crime mysteries. Traditional mystery games offer static storylines with limited replayability. This project solves that by leveraging the Gemini API to dynamically generate unique scenarios, suspects, clues, and logically consistent resolutions based on a simple user premise, offering infinite replayability.

2. Target Users & Expected Experience

Target Audience: Gamers, puzzle enthusiasts, and fans of interactive storytelling or true crime.

User Experience: Intuitive, immersive, and suspenseful. The interface should feel like a digital detective's desk, keeping the user engaged without overwhelming them with text.

3. Core Features & Optional Enhancements

Core: Dynamic mystery generation via Gemini, dynamic difficulty scaling, interactive investigation board (suspects, clues, hints), secure backend validation of the culprit, and a dynamic scoring system.

Optional Enhancements (Future Scope): AI-generated images for evidence/suspects, multiplayer co-op solving, timer-based challenges, and a global leaderboard.

4. Technology Stack

Frontend: React, Vite, Tailwind CSS

Backend: Node.js, Express.js

Database: MongoDB, Mongoose ORM

AI Integration: Google Gemini API (Text Generation)

5. Project Limitations & Final Deliverables

Limitations: The quality of the mystery heavily depends on the Gemini API's prompt adherence. Network latency during generation is expected.

Deliverables: A fully functional, deployed web application meeting all acceptance criteria, complete source code, and this SPEC.md document.

B. User Flow
The complete end-to-end journey for the player:

Launch: User opens the website and lands on the homepage.

Configuration: User enters a brief mystery premise (e.g., "A tech billionaire's yacht party") and selects a difficulty level (Easy, Medium, Hard).

Generation: The backend communicates with Gemini to generate the narrative, suspects, clues, and hints. A loading state is shown.

Investigation: User enters the Investigation Room, reads the background story, and discovers clues one by one.

Assistance: If stuck, the user requests up to the maximum allowed hints.

Accusation: User evaluates the evidence and selects a suspect to accuse.

Resolution: The application reveals the verdict (Correct/Incorrect), the true culprit, the AI's logical explanation of the crime, and the final calculated score.

Replay: User is offered the option to start a new mystery.

C. UI and Page Specifications
1. Home Page

Purpose: Introduce the project and set the tone.

Elements: Project title, brief description, "Start Investigation" CTA button.

2. Create Mystery Page

Purpose: Gather parameters for the AI generation.

Elements: Text input for the premise, Difficulty selector (dropdown/radio buttons for Easy, Medium, Hard), and a "Generate Mystery" submit button.

State: Displays a suspenseful loading animation/message while awaiting the backend API response.

3. Investigation Room Page

Purpose: The core gameplay loop.

Elements:

Story Panel: The background narrative.

Suspect Roster: Cards showing suspect names, motives, and alibis.

Evidence Board: Clickable items to reveal clues (tracked by backend).

Progress Dashboard: Current points, hints remaining, and an "Accuse" CTA.

4. Accusation Modal/Page

Purpose: Final suspect selection.

Elements: Dropdown or grid of suspects to select, confirmation prompt ("Are you sure?"), and a submit button.

5. Results Page

Purpose: Post-game breakdown.

Elements: Large Verdict banner (Success/Failure), Final Score display, Identity of the true culprit, full AI-generated explanation, and a "Play Again" button.

Responsive Behavior: All screens must be mobile-friendly, utilizing Tailwind CSS flexbox/grid layouts. Error messages (e.g., network failure, generation timeout) must be clearly displayed via toast notifications.

D. Backend and Database Design
1. API Endpoints

POST /api/cases — Accepts premise and difficulty. Calls Gemini, parses JSON, saves to DB, and returns the case ID (hiding the true culprit).

GET /api/cases/:id — Retrieves the active mystery state for the UI.

POST /api/cases/:id/clues/:clueId/discover — Marks a clue as discovered and updates the active score.

POST /api/cases/:id/hints — Consumes a hint, returns the hint text, and deducts points.

POST /api/cases/:id/accuse — Accepts the suspectId. Compares against the true culprit.

GET /api/cases/:id/result — Retrieves the final completed result, explanation, and score.

2. Database Model (Mongoose Schema Overview)

title (String), story (String), difficulty (String: Easy, Medium, Hard)

suspects (Array of Objects: name, motive, alibi)

clues (Array of Objects: id, description, isDiscovered)

hints (Array of Objects: id, description, isUsed)

playerProgress (Object: score, hintsUsed, cluesFound, status ['active', 'completed'])

Security fields: trueCulprit (String), explanation (String).

Security Requirement: These two fields must never be sent to the frontend in the GET /api/cases/:id payload. They are only utilized on the backend during the /accuse route and returned in the /result route.

E. AI Behavior and Scoring 
Rules 1. Gemini Prompting & Validation
The backend prompt must enforce a strict JSON output structure. The backend must parse and validate this JSON before saving it to MongoDB. The AI must be instructed to ensure the explanation is logically supported by the provided clues.

2. Difficulty MatrixDifficultySuspectsCluesHints AvailableBase Points on SuccessEasy352100Medium473150Hard593200

3. Scoring RulesBase Score: Awarded ONLY if the correct suspect is accused (Easy: 100, Medium: 150, Hard: 200). If the wrong suspect is chosen, the base score is 0.

Clue Discovery: +5 points for each clue discovered.Hint Penalty: -10 points for each hint used.

Floor: The final score cannot drop below 0.

Enforcement: All score calculations must occur on the Node.js backend to prevent client-side manipulation.

F. Acceptance Criteria
The project is considered complete when:

Users can successfully generate unique mysteries across Easy, Medium, and Hard difficulty levels.

Players can interact with the Investigation Room to uncover clues, request hints (up to the limit), and submit a final accusation.

The true culprit and explanation are securely withheld by the backend and never exposed in network payloads prior to accusation.

Scores are accurately calculated, validated, and persisted entirely on the backend according to the specified rules.

The Results screen accurately displays the verdict, the correct culprit, the AI's logical explanation, and the final score.

The complete web application is successfully deployed to a live URL and functions end-to-end without critical errors.