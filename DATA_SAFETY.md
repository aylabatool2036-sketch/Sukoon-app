# Play Console Data Safety Information

This document provides the information required to fill out the Data Safety section and Health Features declaration in the Google Play Console for Sukoon.

## 1. Health Features Declaration
When completing the "Health features in your app" section, please select the following:

### Health and Fitness
- [x] **Stress management, relaxation, mental acuity:** Sukoon provides breathing exercises, soundscapes, and journaling to assist with relaxation and mental focus.

### Medical
- [x] **Mental and behavioral health:** Sukoon allows users to track their emotional states (mood logs) and provides AI-powered compassionate support.

---

## 2. Data Safety Section

### Data Collection and Security
| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by your app encrypted in transit? | Yes |
| Do you provide a way for users to request that their data is deleted? | Yes |

### Data Types Collected

#### Personal Information
- **Email address:** Collected for account management and authentication.
- **User IDs:** Collected to associate data with the correct user.

#### Health and Fitness
- **Other health data:** Mood tracking and emotional state logs.

#### App Activity
- **App interactions:** Used for analytics and improving the service.

#### Files and Docs
- **Audio files:** Optional user-recorded voice notes for "Future Me".

### Data Usage and Sharing
- **Data is NOT shared with third parties** for marketing or advertising.
- **Data is processed by service providers** (Firebase for storage, Groq for AI processing) strictly to provide the app's features.
- **Data Deletion:** Users can delete their account within the app, which triggers a recursive deletion of all associated records.
