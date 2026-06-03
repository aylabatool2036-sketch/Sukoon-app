# Play Console Data Safety Information

This document provides the information required to fill out the Data Safety section in the Google Play Console for Sukoon.

## Data Collection and Security

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by your app encrypted in transit? | Yes |
| Do you provide a way for users to request that their data is deleted? | Yes |

## Data Types Collected

### Personal Information
- **Email address:** Collected for account management and authentication.
- **User IDs:** Collected to associate data with the correct user.

### Health and Fitness
- **Other health data:** Mood tracking and emotional state logs.

### App Activity
- **App interactions:** Used for analytics and improving the service.

### Files and Docs
- **Audio files:** Optional user-recorded voice notes for "Future Me".

## Data Usage and Sharing

- **Data is NOT shared with third parties** for marketing or advertising.
- **Data is processed by service providers** (Firebase for storage, Groq for AI processing) strictly to provide the app's features.
- **Data Deletion:** Users can delete their account within the app, which triggers a recursive deletion of all associated records.
