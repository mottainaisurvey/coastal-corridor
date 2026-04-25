# Coastal Corridor Mobile App — Test Plan

**Version:** 1.0.0 (Android versionCode 8, iOS build 16)  
**Date:** April 25, 2026  
**Author:** Manus AI

This document outlines the comprehensive test plan for the Coastal Corridor mobile application. It covers the newly implemented features, including the onboarding flow, authentication, legal agreements, property trust signals, 3D/VR viewer, and the KYC identity verification process.

## 1. Installation and Initial Launch

The first phase of testing ensures that the application installs correctly and that the initial user experience, specifically the onboarding flow, functions as designed.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-001** | Fresh installation on iOS via TestFlight | App installs successfully without errors. |
| **TC-002** | Fresh installation on Android via APK | App installs successfully without errors. |
| **TC-003** | Initial launch behavior | The app displays the new minimalist splash screen (logo on dark navy background), followed immediately by the first onboarding slide. The previous "flash" of the sign-in screen or main tabs must not occur. |
| **TC-004** | Onboarding carousel navigation | Swiping left/right transitions smoothly between the three promotional slides. The active dot indicator updates correctly. |
| **TC-005** | Onboarding "Skip" functionality | Tapping the "Skip" button on any slide immediately navigates the user to the Sign-In screen. |
| **TC-006** | Onboarding completion | Tapping the "Explore the Corridor" button on the final slide navigates the user to the Sign-In screen. |
| **TC-007** | Subsequent launches | After completing or skipping onboarding, force-closing and reopening the app bypasses the onboarding slides and goes directly to the Sign-In screen (if logged out) or the main tabs (if logged in). |

## 2. Authentication and Legal Agreements

This section verifies the authentication flows, including email/password, Google OAuth, password reset, and the mandatory acceptance of legal terms during registration.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-008** | Sign-Up: Terms agreement validation | Attempting to create an account without checking the "I agree to the Terms of Service and Privacy Policy" box displays an alert preventing registration. |
| **TC-009** | Sign-Up: Legal links | Tapping the "Terms of Service" or "Privacy Policy" links on the sign-up screen opens the respective full-text legal documents. The back button returns the user to the sign-up screen. |
| **TC-010** | Sign-Up: Email registration | Completing the form with valid details and checking the agreement box successfully sends a 6-digit verification code to the provided email. |
| **TC-011** | Sign-Up: Email verification | Entering the correct 6-digit code completes registration and navigates the user to the main Explore tab. |
| **TC-012** | Sign-Up: Google OAuth | Tapping "Continue with Google" (with the agreement box checked) opens the Google consent screen. Successful authorization creates the account and navigates to the main Explore tab. |
| **TC-013** | Sign-In: Email authentication | Entering valid credentials successfully logs the user in and navigates to the main Explore tab. |
| **TC-014** | Sign-In: Google OAuth | Tapping "Continue with Google" successfully logs the user in and navigates to the main Explore tab. |
| **TC-015** | Forgot Password flow | Tapping "Forgot password?" opens the reset screen. Entering a registered email sends a reset code. Entering the code and a new password successfully resets the password and logs the user in. |

## 3. Main Navigation and Explore Tab

Testing the core navigation structure and the functionality of the primary landing screen.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-016** | Tab navigation | Tapping between Explore, Properties, Fractional, and Account tabs switches screens smoothly without losing state. |
| **TC-017** | Explore: Destination cards | Tapping a destination card (e.g., "Victoria Island Terminus") navigates to a filtered view of properties for that specific destination. |
| **TC-018** | Explore: Search functionality | Entering a query in the search bar returns relevant property or destination results. Tapping a property result navigates to the Property Detail screen. |

## 4. Property Detail and Trust Signals

This is a critical area of testing, focusing on the newly added trust, legal, and media features designed to build buyer confidence.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-019** | Property Detail: General rendering | The screen loads correctly, displaying the title, destination, price, description, and amenities. |
| **TC-020** | Property Detail: Title Verification Badge | The badge displays the correct status (e.g., "Title Verified", "Verification Pending") with the appropriate color coding (green, gold, red). If a document URL is provided, the "View doc" button opens the document in the device browser. |
| **TC-021** | Property Detail: Risk Scores | The "Risk & Site Assessment" section displays horizontal bar charts for Flood Risk, Erosion Risk, Dispute Risk, and Accessibility. The bars are color-coded based on the score (e.g., low risk is green, high risk is red). |
| **TC-022** | Property Detail: Agent Badge | The agent section displays the agent's name, avatar, and license number. If the agent is verified, a green shield checkmark icon is visible next to their name. |
| **TC-023** | Property Detail: Escrow Notice | The "Escrow-Protected Transaction" card is prominently displayed, explaining the secure payment process. |
| **TC-024** | Property Detail: Inquiry Form | Tapping "Send inquiry" expands the form. Submitting the form with valid details shows a success alert. |
| **TC-025** | Property Detail: 3D/VR Viewer | If the property has a virtual tour, tapping "3D / VR Tour" opens a full-screen modal containing a WebView of the tour. The modal can be closed, and the "Open in browser" fallback button works correctly. |
| **TC-026** | Property Detail: Floor Plan | If the property has a floor plan, tapping "Floor Plan" opens the document in the device browser. |

## 5. Fractional Ownership and Transactions

Testing the fractional investment flow and associated escrow mechanisms.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-027** | Fractional: Scheme listing | The tab displays available fractional ownership schemes with their status, yield, and progress bars. |
| **TC-028** | Fractional: Purchase flow | Tapping "Purchase Shares" prompts a confirmation alert. Confirming the purchase triggers an authenticated API request and displays a success or error message based on the backend response. |
| **TC-029** | Fractional: Sold out state | Schemes marked as sold out have their purchase buttons disabled. |

## 6. Account and KYC (Identity Verification)

Testing the user profile section and the new multi-step compliance flow.

| Test Case ID | Description | Expected Result |
|---|---|---|
| **TC-030** | Account: Menu navigation | Tapping "My Portfolio" navigates to the Fractional tab. Tapping "Terms of Service" or "Privacy Policy" opens the respective legal screens. |
| **TC-031** | KYC: Step 1 (Personal Info) | Tapping "Identity Verification" opens the KYC flow. Step 1 requires First Name, Last Name, Date of Birth, and Nationality. The "Next" button is disabled until all fields are filled. |
| **TC-032** | KYC: Step 2 (Identity Document) | Step 2 requires selecting an ID Type (NIN, Passport, Driver's License) and entering the ID Number. The "Next" button is disabled until completed. |
| **TC-033** | KYC: Step 3 (Review & Submit) | Step 3 displays a summary of the entered information. Tapping "Submit Verification" sends the data to the backend. A success alert is shown, and the user is navigated back to the Account screen. |
| **TC-034** | KYC: Navigation | The user can navigate back and forth between the three steps using the "Back" and "Next" buttons without losing entered data. |
| **TC-035** | Account: Sign Out | Tapping "Sign out" successfully clears the session and returns the user to the Sign-In screen. |

---
*End of Test Plan*
