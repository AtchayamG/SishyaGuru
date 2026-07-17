# User Journeys: SishyaGuru

## 1. The Reverse-Teaching Loop
**Objective:** The user actively teaches the AI a curated concept to solidify their own understanding.

*   **Step 1:** The learner arrives at the credential-free P0 topic page. The AI persona introduces the topic and asks a single, foundational question to start the session.
*   **Step 2:** User inputs an explanation (teaching the AI).
*   **Step 3:** AI processes the input and responds with an honest, curious follow-up question. It asks exactly *one* focused question at a time.
*   **Step 4:** The loop repeats, driving deeper into the concept tree.

## 2. Mastery Updates and Evidence
**Objective:** The user receives real-time, transparent feedback on their teaching efficacy.

*   **Step 1:** After a user submits an explanation, the Mastery Feedback Panel enters a loading state.
*   **Step 2:** The system evaluates the user's input against the Concept Map.
*   **Step 3:** The Mastery Feedback Panel updates. It displays:
    *   **Evidence:** Specific quotes or concepts the user successfully explained.
    *   **Mastery state:** One canonical labelled state: `Not assessed`, `Not enough evidence`, `Emerging`, `Developing`, or `Secure`; never a grade or intelligence score. A misconception may add a separate `Try again` action but is not a mastery state.
*   **Step 4:** The Concept Map Panel updates, highlighting nodes that have been successfully "taught."

## 3. Misconception Correction and Retry Path
**Objective:** Handle user errors gracefully without shaming or providing outright answers.

*   **Step 1:** User provides an incorrect or incomplete explanation.
*   **Step 2:** AI detects the misconception.
*   **Step 3:** Instead of saying "You are wrong" or giving the answer, the AI responds with a curious probe identifying the logical gap (e.g., "I'm a bit confused. If X is true, how does that affect Y?").
*   **Step 4:** The Mastery Feedback Panel flags a "Misconception Detected" with respectful, objective language (e.g., "The explanation of X conflicts with prior definitions.").
*   **Step 5:** The AI provides a clear retry path: "Could you try explaining that part again?" The user is prompted to try again before any full answers are revealed.
