neXus Schema Documentation
Base Information
Base ID: appiD7gplQcnVpXgm
Base Name: neXus
Tables: 38
Table Summary
Table Name	Fields	Primary Field
Contacts	91	-
Education	21	-
Applications	54	-
Applicants	10	-
Participation	11	-
Initiatives	9	-
Topics	4	-
Classes	2	-
Cohorts	22	-
Teams	43	-
Members	27	-
Invites	11	-
Institutions	21	-
Partnerships	4	-
Programs	8	-
Colleges	6	-
Roles	12	-
Organizations	8	-
Forms	49	-
Events	22	-
Attendance	15	-
Milestones	16	-
Submissions	21	-
Bounties	17	-
Deliverables	9	-
Resources	22	-
Inventory	9	-
Requests	7	-
Provisioning	2	-
Locations	2	-
Points	27	-
Point Transactions	13	-
Achievements	9	-
Rewards	7	-
Rewards Claimed	7	-
Rubric Submissions	30	-
Notes	5	-
Activity	4	-
Detailed Table Schemas
Showing 15 of 38 tables

Contacts
Fields: 91 (showing 25 of 91)

Field Name	Type	Required	Description
[TEMP] Contacts [Automation]	multipleRecordLinks		Links to: Events (Multiple)
[TEMP] First Contact Point RFI Event	singleLineText		
[TEMP] Graduation Year	number		
[TEMP] Major 1	singleLineText		
[TEMP] Major 2	singleLineText		
[TEMP] Minor	singleLineText		
[TEMP] Minor 2	singleLineText		
[TEMP] Student Enrollees	singleLineText		Used to import whether the contact is participating/participated in the program listed in the row. W...
[TEMP] Student Type	singleLineText		
[TEMP] Tags	singleLineText		These tags need to be separated into their respective attendance, invited, and attendance in events....
[TEMP] xFoundry Xpand Participation	singleLineText		
[TEMP] xFoundy Program	singleLineText		
[TEMP] Xperience Topic Interest	singleLineText		
Activity	multipleRecordLinks		Links to: Activity (Multiple)
Address	multilineText		
Applicants	multipleRecordLinks		Links to: Applicants (Multiple)
Applications	multipleRecordLinks		Links to: Applications (Multiple)
Attendance	multipleRecordLinks		Links to: Attendance (Multiple)
Auth0 ID	singleLineText		
Automations	singleSelect		Options: Update or Add Education from Hubspot, Education Updated from Hubspot, Education Added from Hubspot, ...
Bio	multilineText		
Capacity (from Participation)	multipleLookupValues		
circleMemberID	number		An ID pulled from Circle.so (Connexions) that is the identifying field for their profile in the plat...
Cohorts (from Participation)	multipleLookupValues		
Contact Points	rollup		
Example:

let contactsRecords = await base.getTable("Contacts").selectRecordsAsync();
Education
Fields: 21

Field Name	Type	Required	Description
Abbreviation (from Colleges) (from Major)	multipleLookupValues		
Cohorts (from Participation) (from Contact)	multipleLookupValues		
College (Text)	formula		
Colleges (from Major)	multipleLookupValues		
Contact	multipleRecordLinks		Links to: Contacts (Multiple)
contactEmail	rollup		
Degree Type	singleSelect		Options: Undergraduate, Graduate, Doctorate, ...
Education ID	formula		
Graduation Semester	singleSelect		Options: Fall, Spring, Summer, ...
Graduation Year	number		
ID	autoNumber		
Institution	multipleRecordLinks		Links to: Institutions (Single)
Last Modified	lastModifiedTime		
Major	multipleRecordLinks		Links to: Programs (Single)
Major (from Major)	rollup		
Major (from Major) 2	multipleLookupValues		
Matriculation Name	formula		Determines if a student is Freshman, Sophomore, Junior, or Senior based on Graduation Year and curre...
Matriculation Name 2	formula		Determines the academic standing (Freshman, Sophomore, Junior, Senior, Alumni) based on graduation y...
memberTeamLast (from Contact)	multipleLookupValues		
Name (from Institution)	multipleLookupValues		
Second Major	multipleRecordLinks		Links to: Programs (Single)
Example:

let educationRecords = await base.getTable("Education").selectRecordsAsync();
Applications
Fields: 54 (showing 25 of 54)

Field Name	Type	Required	Description
Additional Documents	multipleAttachments		
Applicants	multipleRecordLinks		Links to: Applicants (Multiple)
Application ID	formula		
Are you aware that this program will require you to actively compete in and meet milestones of the 2025-2026 Mental Health Competition?	multilineText		
Are you aware that this program will require you to be physically present during class hours for the Spring 2025, Fall 2025, and Spring 2026 semesters?	multilineText		
circleMemberID (from Contact)	multipleLookupValues		
Cohort	multipleRecordLinks		Links to: Cohorts (Single)
cohortShortName	multipleLookupValues		
Contact	multipleRecordLinks		Links to: Contacts (Multiple)
Contact (from Applicants)	multipleLookupValues		
Created	createdTime		
Created By	createdBy		
Degree Type (from Education) (from Contact)	multipleLookupValues		
Describe your desired career path and explain why you chose your current degree program. Include specific goals and motivations.	multilineText		
Email	email		
Email (from Contact)	multipleLookupValues		
First Name	singleLineText		
GPA	number		
Graduation Semester	singleSelect		Options: Fall, Spring, Summer, ...
Graduation Year	number		
Graduation Year (from Education) (from Contact)	multipleLookupValues		
Hubspot Cohort	singleLineText		
Hubspot ID	singleLineText		
hubspotCohortSyncCheck	formula		
ID	autoNumber		
Example:

let applicationsRecords = await base.getTable("Applications").selectRecordsAsync();
Cohorts
Fields: 22

Field Name	Type	Required	Description
Action Button	singleSelect		Options: Apply, Register
Application Form ID (Fillout)	singleLineText		
Applications	multipleRecordLinks		Links to: Applications (Multiple)
Classes	multipleRecordLinks		Links to: Classes (Single)
Cohort Number	number		
Current Cohort	formula		Checks if the current date is between the Start Date and End Date of the current cohort, and returns...
End Date	date		
Events	multipleRecordLinks		Links to: Events (Multiple)
Forms	multipleRecordLinks		Links to: Forms (Multiple)
Initiative	multipleRecordLinks		Links to: Initiatives (Single)
Last Modified	lastModifiedTime		
memberEmails (from Teams)	multipleLookupValues		
Milestones	multipleRecordLinks		Links to: Milestones (Multiple)
Participation	multipleRecordLinks		Links to: Participation (Multiple)
Partnerships	multipleRecordLinks		Links to: Partnerships (Multiple)
Record ID	formula		
Short Name	formula		
Short Name (from Programs)	multipleLookupValues		
Start Date	date		
Status	singleSelect		Options: Closed, Applications Open, Applications Closed, ...
Teams	multipleRecordLinks		Links to: Teams (Multiple)
Topics	multipleRecordLinks		Links to: Topics (Single)
Example:

let cohortsRecords = await base.getTable("Cohorts").selectRecordsAsync();
Teams
Fields: 43 (showing 25 of 43)

Field Name	Type	Required	Description
Applications	multipleRecordLinks		Links to: Applications (Multiple)
CMS-B: Action	singleSelect		Options: Draft item in Webflow, Re: Item drafted in Webflow, Archive item in Webflow, ...
CMS-B: Message	richText		
CMS-B: Sync time	dateTime		
CMS-B: Webflow ID	singleLineText		
CMS-B: Webflow Slug	singleLineText		
Cohorts	multipleRecordLinks		Links to: Cohorts (Single)
Contact (from Members)	multipleLookupValues		
Count (Members)	count		
Description	multilineText		
Email (from Contact) (from Members)	multipleLookupValues		
Forms	multipleRecordLinks		Links to: Forms (Multiple)
ID	autoNumber		
Image	multipleAttachments		
Ineligible Members	multipleLookupValues		
Initiative (from Cohorts)	multipleLookupValues		
Initiative Rollup (from Cohorts)	rollup		
Institution	multipleRecordLinks		Links to: Institutions (Single)
Invites	multipleRecordLinks		Links to: Invites (Multiple)
Join Team (Applications)	multipleRecordLinks		Links to: Applications (Multiple)
Joinable	checkbox		
Joinable (Yes No)	formula		
Last Modified	lastModifiedTime		
Matching Created	checkbox		
Member Points	rollup		
Example:

let teamsRecords = await base.getTable("Teams").selectRecordsAsync();
Members
Fields: 27 (showing 25 of 27)

Field Name	Type	Required	Description
Contact	multipleRecordLinks		Links to: Contacts (Single)
Contact Points	multipleLookupValues		
contactId	rollup		
Email (from Contact)	multipleLookupValues		
Forms	multipleRecordLinks		Links to: Forms (Multiple)
Graduation Semester (from Education) (from Contact)	multipleLookupValues		
Graduation Year (from Education) (from Contact)	multipleLookupValues		
Headshot (from Contact)	multipleLookupValues		
ID	autoNumber		
Invites	multipleRecordLinks		Links to: Invites (Multiple)
Last Modified	lastModifiedTime		
Major (from Education) (from Contact)	multipleLookupValues		
Major (from Education) (from Contact) 2	multipleLookupValues		
Matriculation Name 2 (from Education) (from Contact)	multipleLookupValues		
Member ID	formula		
memberName	multipleLookupValues		
memberstackID	multipleLookupValues		
Record ID (from Team)	multipleLookupValues		
Requests	singleLineText		
Reward Redemptions	singleLineText		
Status	singleSelect		Options: Active, Inactive, Invited
Submissions	multipleRecordLinks		Links to: Submissions (Multiple)
Team	multipleRecordLinks		Links to: Teams (Single)
Team Name (from Team)	multipleLookupValues		
Xperience Ambassadors	singleLineText		
Example:

let membersRecords = await base.getTable("Members").selectRecordsAsync();
Institutions
Fields: 21

Field Name	Type	Required	Description
AI assist	aiText		
alpha_two_code	singleLineText		
Applications	multipleRecordLinks		Links to: Applications (Multiple)
contactEmail	rollup		
Country	singleLineText		
Domains	singleLineText		
Education	multipleRecordLinks		Links to: Education (Multiple)
Forms	multipleRecordLinks		Links to: Forms (Multiple)
Get State Code	singleSelect		Options: Get State Code, State Code Got
Horizons Challenge Joinable Teams	rollup		
Horizons Challenge Joinable Teams Count	count		
Initiatives	multipleRecordLinks		Links to: Initiatives (Multiple)
Institution Type	formula		
Last Modified	lastModifiedTime		
Name	singleLineText		
Partnerships	multipleRecordLinks		Links to: Partnerships (Multiple)
Record ID	formula		
Roles	multipleRecordLinks		Links to: Roles (Multiple)
stateCode	singleLineText		
Teams	multipleRecordLinks		Links to: Teams (Multiple)
Web Pages	singleLineText		
Example:

let institutionsRecords = await base.getTable("Institutions").selectRecordsAsync();
Forms
Fields: 49 (showing 25 of 49)

Field Name	Type	Required	Description
Anything else?	multilineText		
Attachments	multipleAttachments		A general field for any attachments you wish to include in your form
Attributes	multilineText		
Automations	singleSelect		Options: Create or Link Contact, Contact Created, Contact Linked, Education Created, ...
Cohorts	multipleRecordLinks		Links to: Cohorts (Single)
Commitment	singleSelect		
Contacts	multipleRecordLinks		Links to: Contacts (Single)
Degree Type	singleSelect		Options: Undergraduate, Graduate
Do you agree to participate in the ambassador onboarding and training session(s)?	singleSelect		Options: Yes, No
Email	email		
Events	multipleRecordLinks		Links to: Events (Single)
File upload	multipleAttachments		
First Name	singleLineText		
Graduate Degree Type	singleSelect		
Graduation Year	singleSelect		Options: 2024, 2025, 2026, ...
Graphic Deliverables	multipleSelects		Options: Traditional marketing collateral (flyers, letterheads, business cards, mailers), Presentation deck design, Merchandise design, ...
I acknowledge the responsibilities previously mentioned and commit to sticking to them.	checkbox		
I commit to dedicating 6-7 hours per semester to fulfill my duties as an ambassador.	checkbox		
I confirm that the information provided is true and accurate to the best of my knowledge.	checkbox		
I grant permission for Xperience to use my name and photo in promotional materials related to the program.	checkbox		
I understand that failure to meet responsibilities may result in dismissal from the program.	checkbox		
I understand that I will represent Xperience and act as a role model for other participants.	checkbox		
Institution	multipleRecordLinks		Links to: Institutions (Single)
Last Name	singleLineText		
Major	multipleRecordLinks		Links to: Programs (Single)
Example:

let formsRecords = await base.getTable("Forms").selectRecordsAsync();
Events
Fields: 22

Field Name	Type	Required	Description
Achievements	multipleRecordLinks		Links to: Achievements (Multiple)
Attendance	multipleRecordLinks		Links to: Attendance (Multiple)
Automation	singleSelect		Options: Create Attendance Records, Created
Automation/Type	singleSelect		Options: Invited, Registered, Attended
Category	singleSelect		Options: Class, Tabling, Info Session, ...
Classes (from Cohorts)	multipleLookupValues		
Cohorts	multipleRecordLinks		Links to: Cohorts (Single)
Contacts	multipleRecordLinks		Links to: Contacts (Multiple)
Contacts (from Attendance)	multipleLookupValues		
Date	date		
Description	multilineText		
eventcreate Event ID	formula		Extracts event ID from eventcreate.com links in the Registration Link field.
eventcreate User ID	formula		Extracts user ID from eventcreate.com links in the Registration Link field.
Form Submission Count	count		
Forms	multipleRecordLinks		Links to: Forms (Multiple)
Last Modified	lastModifiedTime		
Name	singleLineText		
Open Unique RFI	button		
Record ID	formula		
Registration Link	url		
Season	singleSelect		Options: FA23, SP24, SM24, ...
Unique RFI Form	formula		Unique link for each event that prefills the General RFI form with that event
Example:

let eventsRecords = await base.getTable("Events").selectRecordsAsync();
Milestones
Fields: 16

Field Name	Type	Required	Description
Cohort	multipleRecordLinks		The cohort of each milestone. The cohort must be set. • Links to: Cohorts (Single)
cohortId	rollup		
Deliverables	multipleRecordLinks		Links to: Deliverables (Multiple)
Description	richText		Details about the Milestone, like what deliverables should be submitted, any requirements, etc. This...
Due Accuracy	singleSelect		How accurate do you know this due date to be? Specify to output only up to the selected accuracy. It... • Options: Time, Day, Month, ...
Due Datetime	dateTime		The due date and time
Due Datetime Refined	formula		Formats 'Due Datetime' based on 'Due Accuracy' (Time, Day, Month, Year).
Forms	multipleRecordLinks		Links to: Forms (Multiple)
ID	autoNumber		
Name	singleLineText		The full name of this milestone
Num Deliverables	count		
Number	number		The number of this Milestone
Record ID	formula		
Request Attendance	checkbox		
Short Name	formula		Generates a short name for the milestone, checking for missing fields.
Submissions	multipleRecordLinks		Links to: Submissions (Multiple)
Example:

let milestonesRecords = await base.getTable("Milestones").selectRecordsAsync();
Submissions
Fields: 21

Field Name	Type	Required	Description
Attachment	multipleAttachments		
Calculation	formula		
Comments	richText		
Created Time	createdTime		
Deliverable	multipleRecordLinks		Links to: Deliverables (Single)
Forms	multipleRecordLinks		Links to: Forms (Multiple)
ID	autoNumber		
Link	multilineText		
Member	multipleRecordLinks		Links to: Members (Single)
memberEmails	rollup		
Members copy	multipleRecordLinks		Links to: Points (Multiple)
Members copy	singleLineText		
Members copy	singleLineText		
Milestone	multipleRecordLinks		Links to: Milestones (Single)
milestoneId	rollup		
Name (from Deliverable)	multipleLookupValues		
Name (from Milestone)	multipleLookupValues		
Points copy	singleLineText		
Submission ID	formula		Generates a unique submission ID that includes the ID number and the name from either the Deliverabl...
Team	multipleRecordLinks		Links to: Teams (Single)
teamId	rollup		
Example:

let submissionsRecords = await base.getTable("Submissions").selectRecordsAsync();
Bounties
Bounties for Xtrapraneurs

Fields: 17

Field Name	Type	Required	Description
Additional Comments	multilineText		
Bounty ID	formula		
Classification	singleSelect		Small Bounty (Quick Wins) – Ideal for low to moderate difficulty tasks; requires creative, technical... • Options: Small, Medium, Large
Deliverables	multipleRecordLinks		Links to: Deliverables (Multiple)
ID	autoNumber		
Internship Compensation	number		
Internship Description	multilineText		
Internship Organization	multipleRecordLinks		If an internship, the organization that internship is for • Links to: Organizations (Single)
Internship Requirements	multilineText		
Internship Title	singleLineText		
Last Modified	lastModifiedTime		
Prize Type	singleSelect		The kind of prize winning this bounty gives • Options: Monetary, Internship, Meal Voucher
Prize Value	number		Either the amount of money given by the prize, the amount of the meal voucher, etc.
Status	singleSelect		Options: Submitted, Under Review, Reviewed, ...
Submitter	multipleRecordLinks		Links to: Contacts (Single)
Title	singleLineText		
Visibility	singleSelect		Options: Post on ConneXions, Posted on ConneXions, Remove from ConneXions, ...
Example:

let bountiesRecords = await base.getTable("Bounties").selectRecordsAsync();
Resources
Fields: 22

Field Name	Type	Required	Description
Appreviation	aiText		
Category	singleSelect		Options: Camera, Lens, Audio, ...
Created	createdTime		
Description	multilineText		
How to Access	richText		
ID	autoNumber		
Inventory	multipleRecordLinks		Links to: Inventory (Multiple)
Last Modified	lastModifiedTime		
License Required	checkbox		
Licensing Terms	singleLineText		
Link	url		
Location	singleSelect		
Name	singleLineText		
Provider Organization	multipleRecordLinks		Links to: Organizations (Single)
Provisions	multipleRecordLinks		Links to: Provisioning (Multiple)
Requests	multipleRecordLinks		Links to: Requests (Multiple)
Resource ID	formula		
Return Required	checkbox		
Status	singleSelect		Current availability of the resource (e.g. Available, Unavailable, Archived) • Options: Available, Unavailable, Archived
Tags	multipleSelects		Keywords to facilitate search • Options: Business Planning, AI Tools, Startup Resources, ...
Total Quantity	number		The total amount of licenses, copies, or items that are available.
Type	singleSelect		The type of resource, e.g. Software, E-Book, Course, etc. • Options: Digital, Physical, Service
Example:

let resourcesRecords = await base.getTable("Resources").selectRecordsAsync();
Points
Fields: 27 (showing 25 of 27)

Field Name	Type	Required	Description
Automation	singleSelect		Options: Add, Registration Added, Class Attendance Added, ...
Automation copy	multipleSelects		Options: Add, Registration Added, Class Attendance Added, ...
Business Plan	number		
Class Attendance	number		
Contact	multipleRecordLinks		Links to: Contacts (Single)
Course Enrollment Bonus	number		
Created	createdTime		
Email (from Contact)	multipleLookupValues		
Event Attendance	number		
Finals Verififcation	number		
Graduation Semester (from Education) (from Contact)	multipleLookupValues		
Graduation Year (from Education) (from Contact)	multipleLookupValues		
ID	autoNumber		
Major (from Education) (from Contact)	multipleLookupValues		
Matriculation Name 2 (from Education) (from Contact)	multipleLookupValues		
Prototype Demonstration	number		
Record ID	formula		
Record ID (from Team)	multipleLookupValues		
Recruiting new members	number		
Registration Bonus	number		
Requests	singleLineText		
Sales Pitch	number		
Submissions	multipleRecordLinks		Links to: Submissions (Multiple)
Team	multipleRecordLinks		Links to: Teams (Single)
Team Demo	number		
Example:

let pointsRecords = await base.getTable("Points").selectRecordsAsync();
Rubric Submissions
Fields: 30 (showing 25 of 30)

Field Name	Type	Required	Description
Category 1	singleLineText		
Category 2	singleLineText		
Category 3	singleLineText		
Category 4	singleLineText		
Category 5	singleLineText		
Category 6	singleLineText		
Category 7	singleLineText		
Comments (1)	multilineText		
Comments (2)	multilineText		
Comments (3)	multilineText		
Comments (4)	multilineText		
Comments (5)	multilineText		
Comments (6)	multilineText		
Comments (7)	multilineText		
Score (1-5) (1)	number		
Score (1-5) (2)	number		
Score (1-5) (3)	number		
Score (1-5) (4)	number		
Score (1-5) (5)	number		
Score (1-5) (6)	number		
Score (1-5) (7)	number		
Team Name	singleLineText		
Total	formula		
Weighted Score	formula		Multiplies the score based on the category-specific multiplier.
Weighted Score (2)	formula		Multiplies the score based on the category-specific multiplier.
Example:

let rubricSubmissionsRecords = await base.getTable("Rubric Submissions").selectRecordsAsync();
Machine-Readable Schema
{
 "baseId": "appiD7gplQcnVpXgm",
 "baseName": "neXus",
 "tables": [
  {
   "id": "tblyKUPltUrRgPiEI",
   "name": "Contacts",
   "fieldCount": 91,
   "fields": [
    {
     "name": "[TEMP] Contacts [Automation]",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Events",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "[TEMP] First Contact Point RFI Event",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Graduation Year",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "[TEMP] Major 1",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Major 2",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Minor",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Minor 2",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Student Enrollees",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Student Type",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Tags",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] xFoundry Xpand Participation",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] xFoundy Program",
     "type": "singleLineText"
    },
    {
     "name": "[TEMP] Xperience Topic Interest",
     "type": "singleLineText"
    },
    {
     "name": "Activity",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Activity",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Address",
     "type": "multilineText"
    },
    {
     "name": "Applicants",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applicants",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Applications",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applications",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Attendance",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Attendance",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Auth0 ID",
     "type": "singleLineText"
    },
    {
     "name": "Automations",
     "type": "singleSelect",
     "options": {
      "choiceCount": 9,
      "choices": [
       "Update or Add Education from Hubspot",
       "Education Updated from Hubspot",
       "Education Added from Hubspot",
       "..."
      ]
     }
    },
    {
     "name": "Bio",
     "type": "multilineText"
    },
    {
     "name": "Capacity (from Participation)",
     "type": "multipleLookupValues"
    },
    {
     "name": "circleMemberID",
     "type": "number",
     "options": {
      "precision": 0
     }
    },
    {
     "name": "Cohorts (from Participation)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Contact Points",
     "type": "rollup"
    }
   ]
  },
  {
   "id": "tbl7wRkeRCopTvqGT",
   "name": "Education",
   "fieldCount": 21,
   "fields": [
    {
     "name": "Abbreviation (from Colleges) (from Major)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Cohorts (from Participation) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "College (Text)",
     "type": "formula"
    },
    {
     "name": "Colleges (from Major)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Contact",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "contactEmail",
     "type": "rollup"
    },
    {
     "name": "Degree Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 4,
      "choices": [
       "Undergraduate",
       "Graduate",
       "Doctorate",
       "..."
      ]
     }
    },
    {
     "name": "Education ID",
     "type": "formula"
    },
    {
     "name": "Graduation Semester",
     "type": "singleSelect",
     "options": {
      "choiceCount": 4,
      "choices": [
       "Fall",
       "Spring",
       "Summer",
       "..."
      ]
     }
    },
    {
     "name": "Graduation Year",
     "type": "number",
     "options": {
      "precision": 0
     }
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Institution",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Institutions",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Major",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Programs",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Major (from Major)",
     "type": "rollup"
    },
    {
     "name": "Major (from Major) 2",
     "type": "multipleLookupValues"
    },
    {
     "name": "Matriculation Name",
     "type": "formula"
    },
    {
     "name": "Matriculation Name 2",
     "type": "formula"
    },
    {
     "name": "memberTeamLast (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Name (from Institution)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Second Major",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Programs",
      "recordSelectivity": "Single"
     }
    }
   ]
  },
  {
   "id": "tblEBxKJdK8tgsS6P",
   "name": "Applications",
   "fieldCount": 54,
   "fields": [
    {
     "name": "Additional Documents",
     "type": "multipleAttachments"
    },
    {
     "name": "Applicants",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applicants",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Application ID",
     "type": "formula"
    },
    {
     "name": "Are you aware that this program will require you to actively compete in and meet milestones of the 2025-2026 Mental Health Competition?",
     "type": "multilineText"
    },
    {
     "name": "Are you aware that this program will require you to be physically present during class hours for the Spring 2025, Fall 2025, and Spring 2026 semesters?",
     "type": "multilineText"
    },
    {
     "name": "circleMemberID (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Cohort",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Cohorts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "cohortShortName",
     "type": "multipleLookupValues"
    },
    {
     "name": "Contact",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Contact (from Applicants)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Created",
     "type": "createdTime"
    },
    {
     "name": "Created By",
     "type": "createdBy"
    },
    {
     "name": "Degree Type (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Describe your desired career path and explain why you chose your current degree program. Include specific goals and motivations.",
     "type": "multilineText"
    },
    {
     "name": "Email",
     "type": "email"
    },
    {
     "name": "Email (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "First Name",
     "type": "singleLineText"
    },
    {
     "name": "GPA",
     "type": "number",
     "options": {
      "precision": 2
     }
    },
    {
     "name": "Graduation Semester",
     "type": "singleSelect",
     "options": {
      "choiceCount": 4,
      "choices": [
       "Fall",
       "Spring",
       "Summer",
       "..."
      ]
     }
    },
    {
     "name": "Graduation Year",
     "type": "number",
     "options": {
      "precision": 0
     }
    },
    {
     "name": "Graduation Year (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Hubspot Cohort",
     "type": "singleLineText"
    },
    {
     "name": "Hubspot ID",
     "type": "singleLineText"
    },
    {
     "name": "hubspotCohortSyncCheck",
     "type": "formula"
    },
    {
     "name": "ID",
     "type": "autoNumber"
    }
   ]
  },
  {
   "id": "tblrfsWy5n5lqFOCG",
   "name": "Applicants",
   "fieldCount": 10
  },
  {
   "id": "tblyab7kraX4t4N3j",
   "name": "Participation",
   "fieldCount": 11
  },
  {
   "id": "tblBbX9ZpqRdE08Pc",
   "name": "Initiatives",
   "fieldCount": 9
  },
  {
   "id": "tblgNUObXtNbULK4S",
   "name": "Topics",
   "fieldCount": 4
  },
  {
   "id": "tblGGdJ8qwkadwHss",
   "name": "Classes",
   "fieldCount": 2
  },
  {
   "id": "tbl6iyzrUj4oQnYnp",
   "name": "Cohorts",
   "fieldCount": 22,
   "fields": [
    {
     "name": "Action Button",
     "type": "singleSelect",
     "options": {
      "choiceCount": 2,
      "choices": [
       "Apply",
       "Register"
      ]
     }
    },
    {
     "name": "Application Form ID (Fillout)",
     "type": "singleLineText"
    },
    {
     "name": "Applications",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applications",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Classes",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Classes",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Cohort Number",
     "type": "number",
     "options": {
      "precision": 0
     }
    },
    {
     "name": "Current Cohort",
     "type": "formula"
    },
    {
     "name": "End Date",
     "type": "date"
    },
    {
     "name": "Events",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Events",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Initiative",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Initiatives",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "memberEmails (from Teams)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Milestones",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Milestones",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Participation",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Participation",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Partnerships",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Partnerships",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Record ID",
     "type": "formula"
    },
    {
     "name": "Short Name",
     "type": "formula"
    },
    {
     "name": "Short Name (from Programs)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Start Date",
     "type": "date"
    },
    {
     "name": "Status",
     "type": "singleSelect",
     "options": {
      "choiceCount": 5,
      "choices": [
       "Closed",
       "Applications Open",
       "Applications Closed",
       "..."
      ]
     }
    },
    {
     "name": "Teams",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Teams",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Topics",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Topics",
      "recordSelectivity": "Single"
     }
    }
   ]
  },
  {
   "id": "tblfr4EuiTufRyCXK",
   "name": "Teams",
   "fieldCount": 43,
   "fields": [
    {
     "name": "Applications",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applications",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "CMS-B: Action",
     "type": "singleSelect",
     "options": {
      "choiceCount": 11,
      "choices": [
       "Draft item in Webflow",
       "Re: Item drafted in Webflow",
       "Archive item in Webflow",
       "..."
      ]
     }
    },
    {
     "name": "CMS-B: Message",
     "type": "richText"
    },
    {
     "name": "CMS-B: Sync time",
     "type": "dateTime"
    },
    {
     "name": "CMS-B: Webflow ID",
     "type": "singleLineText"
    },
    {
     "name": "CMS-B: Webflow Slug",
     "type": "singleLineText"
    },
    {
     "name": "Cohorts",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Cohorts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Contact (from Members)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Count (Members)",
     "type": "count"
    },
    {
     "name": "Description",
     "type": "multilineText"
    },
    {
     "name": "Email (from Contact) (from Members)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Image",
     "type": "multipleAttachments"
    },
    {
     "name": "Ineligible Members",
     "type": "multipleLookupValues"
    },
    {
     "name": "Initiative (from Cohorts)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Initiative Rollup (from Cohorts)",
     "type": "rollup"
    },
    {
     "name": "Institution",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Institutions",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Invites",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Invites",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Join Team (Applications)",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applications",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Joinable",
     "type": "checkbox"
    },
    {
     "name": "Joinable (Yes No)",
     "type": "formula"
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Matching Created",
     "type": "checkbox"
    },
    {
     "name": "Member Points",
     "type": "rollup"
    }
   ]
  },
  {
   "id": "tblvfcITrjCJLBsTq",
   "name": "Members",
   "fieldCount": 27,
   "fields": [
    {
     "name": "Contact",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Contact Points",
     "type": "multipleLookupValues"
    },
    {
     "name": "contactId",
     "type": "rollup"
    },
    {
     "name": "Email (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Graduation Semester (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Graduation Year (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Headshot (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Invites",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Invites",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Major (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Major (from Education) (from Contact) 2",
     "type": "multipleLookupValues"
    },
    {
     "name": "Matriculation Name 2 (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Member ID",
     "type": "formula"
    },
    {
     "name": "memberName",
     "type": "multipleLookupValues"
    },
    {
     "name": "memberstackID",
     "type": "multipleLookupValues"
    },
    {
     "name": "Record ID (from Team)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Requests",
     "type": "singleLineText"
    },
    {
     "name": "Reward Redemptions",
     "type": "singleLineText"
    },
    {
     "name": "Status",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Active",
       "Inactive",
       "Invited"
      ]
     }
    },
    {
     "name": "Submissions",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Submissions",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Team",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Teams",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Team Name (from Team)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Xperience Ambassadors",
     "type": "singleLineText"
    }
   ]
  },
  {
   "id": "tblUfz8XySnkYP9sM",
   "name": "Invites",
   "fieldCount": 11
  },
  {
   "id": "tblE2f8nG8uve4s6i",
   "name": "Institutions",
   "fieldCount": 21,
   "fields": [
    {
     "name": "AI assist",
     "type": "aiText"
    },
    {
     "name": "alpha_two_code",
     "type": "singleLineText"
    },
    {
     "name": "Applications",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Applications",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "contactEmail",
     "type": "rollup"
    },
    {
     "name": "Country",
     "type": "singleLineText"
    },
    {
     "name": "Domains",
     "type": "singleLineText"
    },
    {
     "name": "Education",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Education",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Get State Code",
     "type": "singleSelect",
     "options": {
      "choiceCount": 2,
      "choices": [
       "Get State Code",
       "State Code Got"
      ]
     }
    },
    {
     "name": "Horizons Challenge Joinable Teams",
     "type": "rollup"
    },
    {
     "name": "Horizons Challenge Joinable Teams Count",
     "type": "count"
    },
    {
     "name": "Initiatives",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Initiatives",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Institution Type",
     "type": "formula"
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Name",
     "type": "singleLineText"
    },
    {
     "name": "Partnerships",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Partnerships",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Record ID",
     "type": "formula"
    },
    {
     "name": "Roles",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Roles",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "stateCode",
     "type": "singleLineText"
    },
    {
     "name": "Teams",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Teams",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Web Pages",
     "type": "singleLineText"
    }
   ]
  },
  {
   "id": "tbl6tfcoWAq4gcbzJ",
   "name": "Partnerships",
   "fieldCount": 4
  },
  {
   "id": "tbl6saicC8h1oRXmR",
   "name": "Programs",
   "fieldCount": 8
  },
  {
   "id": "tblsijPr68Sywj7A0",
   "name": "Colleges",
   "fieldCount": 6
  },
  {
   "id": "tblBinGGFaCqUB8J0",
   "name": "Roles",
   "fieldCount": 12
  },
  {
   "id": "tblopwzOpPldjzqa6",
   "name": "Organizations",
   "fieldCount": 8
  },
  {
   "id": "tblXlNsVNAFbEIYCg",
   "name": "Forms",
   "fieldCount": 49,
   "fields": [
    {
     "name": "Anything else?",
     "type": "multilineText"
    },
    {
     "name": "Attachments",
     "type": "multipleAttachments"
    },
    {
     "name": "Attributes ",
     "type": "multilineText"
    },
    {
     "name": "Automations",
     "type": "singleSelect",
     "options": {
      "choiceCount": 6,
      "choices": [
       "Create or Link Contact",
       "Contact Created",
       "Contact Linked, Education Created",
       "..."
      ]
     }
    },
    {
     "name": "Cohorts",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Cohorts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Commitment",
     "type": "singleSelect",
     "options": {
      "choiceCount": 0
     }
    },
    {
     "name": "Contacts",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Degree Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 2,
      "choices": [
       "Undergraduate",
       "Graduate"
      ]
     }
    },
    {
     "name": "Do you agree to participate in the ambassador onboarding and training session(s)?",
     "type": "singleSelect",
     "options": {
      "choiceCount": 2,
      "choices": [
       "Yes",
       "No"
      ]
     }
    },
    {
     "name": "Email",
     "type": "email"
    },
    {
     "name": "Events",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Events",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "File upload",
     "type": "multipleAttachments"
    },
    {
     "name": "First Name",
     "type": "singleLineText"
    },
    {
     "name": "Graduate Degree Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 0
     }
    },
    {
     "name": "Graduation Year",
     "type": "singleSelect",
     "options": {
      "choiceCount": 7,
      "choices": [
       "2024",
       "2025",
       "2026",
       "..."
      ]
     }
    },
    {
     "name": "Graphic Deliverables",
     "type": "multipleSelects",
     "options": {
      "choiceCount": 8,
      "choices": [
       "Traditional marketing collateral (flyers, letterheads, business cards, mailers)",
       "Presentation deck design",
       "Merchandise design",
       "..."
      ]
     }
    },
    {
     "name": "I acknowledge the responsibilities previously mentioned and commit to sticking to them.",
     "type": "checkbox"
    },
    {
     "name": "I commit to dedicating 6-7 hours per semester to fulfill my duties as an ambassador.",
     "type": "checkbox"
    },
    {
     "name": "I confirm that the information provided is true and accurate to the best of my knowledge.",
     "type": "checkbox"
    },
    {
     "name": "I grant permission for Xperience to use my name and photo in promotional materials related to the program.",
     "type": "checkbox"
    },
    {
     "name": "I understand that failure to meet responsibilities may result in dismissal from the program.",
     "type": "checkbox"
    },
    {
     "name": "I understand that I will represent Xperience and act as a role model for other participants.",
     "type": "checkbox"
    },
    {
     "name": "Institution",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Institutions",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Last Name",
     "type": "singleLineText"
    },
    {
     "name": "Major",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Programs",
      "recordSelectivity": "Single"
     }
    }
   ]
  },
  {
   "id": "tblnD6zkNKcFJFKCX",
   "name": "Events",
   "fieldCount": 22,
   "fields": [
    {
     "name": "Achievements",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Achievements",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Attendance",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Attendance",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Automation",
     "type": "singleSelect",
     "options": {
      "choiceCount": 2,
      "choices": [
       "Create Attendance Records",
       "Created"
      ]
     }
    },
    {
     "name": "Automation/Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Invited",
       "Registered",
       "Attended"
      ]
     }
    },
    {
     "name": "Category",
     "type": "singleSelect",
     "options": {
      "choiceCount": 6,
      "choices": [
       "Class",
       "Tabling",
       "Info Session",
       "..."
      ]
     }
    },
    {
     "name": "Classes (from Cohorts)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Cohorts",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Cohorts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Contacts",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Contacts (from Attendance)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Date",
     "type": "date"
    },
    {
     "name": "Description",
     "type": "multilineText"
    },
    {
     "name": "eventcreate Event ID",
     "type": "formula"
    },
    {
     "name": "eventcreate User ID",
     "type": "formula"
    },
    {
     "name": "Form Submission Count",
     "type": "count"
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Name",
     "type": "singleLineText"
    },
    {
     "name": "Open Unique RFI",
     "type": "button"
    },
    {
     "name": "Record ID",
     "type": "formula"
    },
    {
     "name": "Registration Link",
     "type": "url"
    },
    {
     "name": "Season",
     "type": "singleSelect",
     "options": {
      "choiceCount": 10,
      "choices": [
       "FA23",
       "SP24",
       "SM24",
       "..."
      ]
     }
    },
    {
     "name": "Unique RFI Form",
     "type": "formula"
    }
   ]
  },
  {
   "id": "tbl2x5g0QDRUuTwAJ",
   "name": "Attendance",
   "fieldCount": 15
  },
  {
   "id": "tblfWVQpvieoPAKaq",
   "name": "Milestones",
   "fieldCount": 16,
   "fields": [
    {
     "name": "Cohort",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Cohorts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "cohortId",
     "type": "rollup"
    },
    {
     "name": "Deliverables",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Deliverables",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Description",
     "type": "richText"
    },
    {
     "name": "Due Accuracy",
     "type": "singleSelect",
     "options": {
      "choiceCount": 4,
      "choices": [
       "Time",
       "Day",
       "Month",
       "..."
      ]
     }
    },
    {
     "name": "Due Datetime",
     "type": "dateTime"
    },
    {
     "name": "Due Datetime Refined",
     "type": "formula"
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Name",
     "type": "singleLineText"
    },
    {
     "name": "Num Deliverables",
     "type": "count"
    },
    {
     "name": "Number",
     "type": "number",
     "options": {
      "precision": 0
     }
    },
    {
     "name": "Record ID",
     "type": "formula"
    },
    {
     "name": "Request Attendance",
     "type": "checkbox"
    },
    {
     "name": "Short Name",
     "type": "formula"
    },
    {
     "name": "Submissions",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Submissions",
      "recordSelectivity": "Multiple"
     }
    }
   ]
  },
  {
   "id": "tblQOSJDm7tbqb6ty",
   "name": "Submissions",
   "fieldCount": 21,
   "fields": [
    {
     "name": "Attachment",
     "type": "multipleAttachments"
    },
    {
     "name": "Calculation",
     "type": "formula"
    },
    {
     "name": "Comments",
     "type": "richText"
    },
    {
     "name": "Created Time",
     "type": "createdTime"
    },
    {
     "name": "Deliverable",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Deliverables",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Forms",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Forms",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Link",
     "type": "multilineText"
    },
    {
     "name": "Member",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Members",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "memberEmails",
     "type": "rollup"
    },
    {
     "name": "Members copy",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Points",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Members copy",
     "type": "singleLineText"
    },
    {
     "name": "Members copy",
     "type": "singleLineText"
    },
    {
     "name": "Milestone",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Milestones",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "milestoneId",
     "type": "rollup"
    },
    {
     "name": "Name (from Deliverable)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Name (from Milestone)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Points copy",
     "type": "singleLineText"
    },
    {
     "name": "Submission ID",
     "type": "formula"
    },
    {
     "name": "Team",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Teams",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "teamId",
     "type": "rollup"
    }
   ]
  },
  {
   "id": "tblRD7DUeYagIrfnL",
   "name": "Bounties",
   "fieldCount": 17,
   "fields": [
    {
     "name": "Additional Comments",
     "type": "multilineText"
    },
    {
     "name": "Bounty ID",
     "type": "formula"
    },
    {
     "name": "Classification",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Small",
       "Medium",
       "Large"
      ]
     }
    },
    {
     "name": "Deliverables",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Deliverables",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Internship Compensation",
     "type": "number",
     "options": {
      "precision": 2
     }
    },
    {
     "name": "Internship Description",
     "type": "multilineText"
    },
    {
     "name": "Internship Organization",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Organizations",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Internship Requirements",
     "type": "multilineText"
    },
    {
     "name": "Internship Title",
     "type": "singleLineText"
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "Prize Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Monetary",
       "Internship",
       "Meal Voucher"
      ]
     }
    },
    {
     "name": "Prize Value",
     "type": "number",
     "options": {
      "precision": 2
     }
    },
    {
     "name": "Status",
     "type": "singleSelect",
     "options": {
      "choiceCount": 5,
      "choices": [
       "Submitted",
       "Under Review",
       "Reviewed",
       "..."
      ]
     }
    },
    {
     "name": "Submitter",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Title",
     "type": "singleLineText"
    },
    {
     "name": "Visibility",
     "type": "singleSelect",
     "options": {
      "choiceCount": 4,
      "choices": [
       "Post on ConneXions",
       "Posted on ConneXions",
       "Remove from ConneXions",
       "..."
      ]
     }
    }
   ]
  },
  {
   "id": "tble49o4QF0uh5Jvv",
   "name": "Deliverables",
   "fieldCount": 9
  },
  {
   "id": "tblJ0993Ym5YQPE22",
   "name": "Resources",
   "fieldCount": 22,
   "fields": [
    {
     "name": "Appreviation",
     "type": "aiText"
    },
    {
     "name": "Category",
     "type": "singleSelect",
     "options": {
      "choiceCount": 18,
      "choices": [
       "Camera",
       "Lens",
       "Audio",
       "..."
      ]
     }
    },
    {
     "name": "Created",
     "type": "createdTime"
    },
    {
     "name": "Description",
     "type": "multilineText"
    },
    {
     "name": "How to Access",
     "type": "richText"
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Inventory",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Inventory",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Last Modified",
     "type": "lastModifiedTime"
    },
    {
     "name": "License Required",
     "type": "checkbox"
    },
    {
     "name": "Licensing Terms",
     "type": "singleLineText"
    },
    {
     "name": "Link",
     "type": "url"
    },
    {
     "name": "Location",
     "type": "singleSelect",
     "options": {
      "choiceCount": 0
     }
    },
    {
     "name": "Name",
     "type": "singleLineText"
    },
    {
     "name": "Provider Organization",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Organizations",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Provisions",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Provisioning",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Requests",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Requests",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Resource ID",
     "type": "formula"
    },
    {
     "name": "Return Required",
     "type": "checkbox"
    },
    {
     "name": "Status",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Available",
       "Unavailable",
       "Archived"
      ]
     }
    },
    {
     "name": "Tags",
     "type": "multipleSelects",
     "options": {
      "choiceCount": 26,
      "choices": [
       "Business Planning",
       "AI Tools",
       "Startup Resources",
       "..."
      ]
     }
    },
    {
     "name": "Total Quantity",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Type",
     "type": "singleSelect",
     "options": {
      "choiceCount": 3,
      "choices": [
       "Digital",
       "Physical",
       "Service"
      ]
     }
    }
   ]
  },
  {
   "id": "tblrnsq5Rgb92kZjh",
   "name": "Inventory",
   "fieldCount": 9
  },
  {
   "id": "tbl3ttL5eB2WDqHOa",
   "name": "Requests",
   "fieldCount": 7
  },
  {
   "id": "tblhTgDR38CsNFt37",
   "name": "Provisioning",
   "fieldCount": 2
  },
  {
   "id": "tbli0LegyPHMv7lvz",
   "name": "Locations",
   "fieldCount": 2
  },
  {
   "id": "tblp4e2mAeLUoFTxZ",
   "name": "Points",
   "fieldCount": 27,
   "fields": [
    {
     "name": "Automation",
     "type": "singleSelect",
     "options": {
      "choiceCount": 6,
      "choices": [
       "Add",
       "Registration Added",
       "Class Attendance Added",
       "..."
      ]
     }
    },
    {
     "name": "Automation copy",
     "type": "multipleSelects",
     "options": {
      "choiceCount": 6,
      "choices": [
       "Add",
       "Registration Added",
       "Class Attendance Added",
       "..."
      ]
     }
    },
    {
     "name": "Business Plan",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Class Attendance",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Contact",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Contacts",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Course Enrollment Bonus",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Created",
     "type": "createdTime"
    },
    {
     "name": "Email (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Event Attendance",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Finals Verififcation",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Graduation Semester (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Graduation Year (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "ID",
     "type": "autoNumber"
    },
    {
     "name": "Major (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Matriculation Name 2 (from Education) (from Contact)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Prototype Demonstration",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Record ID",
     "type": "formula"
    },
    {
     "name": "Record ID (from Team)",
     "type": "multipleLookupValues"
    },
    {
     "name": "Recruiting new members",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Registration Bonus",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Requests",
     "type": "singleLineText"
    },
    {
     "name": "Sales Pitch",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Submissions",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Submissions",
      "recordSelectivity": "Multiple"
     }
    },
    {
     "name": "Team",
     "type": "multipleRecordLinks",
     "options": {
      "linkedTableName": "Teams",
      "recordSelectivity": "Single"
     }
    },
    {
     "name": "Team Demo",
     "type": "number",
     "options": {
      "precision": 1
     }
    }
   ]
  },
  {
   "id": "tbllnSCeUWSLMGlR0",
   "name": "Point Transactions",
   "fieldCount": 13
  },
  {
   "id": "tbluxGlL5HSErQqwV",
   "name": "Achievements",
   "fieldCount": 9
  },
  {
   "id": "tblFQqUphRdjNvfnF",
   "name": "Rewards",
   "fieldCount": 7
  },
  {
   "id": "tblvhKYwHZ2PCporm",
   "name": "Rewards Claimed",
   "fieldCount": 7
  },
  {
   "id": "tblBc75SngXJqXJvm",
   "name": "Rubric Submissions",
   "fieldCount": 30,
   "fields": [
    {
     "name": "Category 1",
     "type": "singleLineText"
    },
    {
     "name": "Category 2",
     "type": "singleLineText"
    },
    {
     "name": "Category 3",
     "type": "singleLineText"
    },
    {
     "name": "Category 4",
     "type": "singleLineText"
    },
    {
     "name": "Category 5",
     "type": "singleLineText"
    },
    {
     "name": "Category 6",
     "type": "singleLineText"
    },
    {
     "name": "Category 7",
     "type": "singleLineText"
    },
    {
     "name": "Comments (1)",
     "type": "multilineText"
    },
    {
     "name": "Comments (2)",
     "type": "multilineText"
    },
    {
     "name": "Comments (3)",
     "type": "multilineText"
    },
    {
     "name": "Comments (4)",
     "type": "multilineText"
    },
    {
     "name": "Comments (5)",
     "type": "multilineText"
    },
    {
     "name": "Comments (6)",
     "type": "multilineText"
    },
    {
     "name": "Comments (7)",
     "type": "multilineText"
    },
    {
     "name": "Score (1-5) (1)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (2)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (3)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (4)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (5)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (6)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Score (1-5) (7)",
     "type": "number",
     "options": {
      "precision": 1
     }
    },
    {
     "name": "Team Name",
     "type": "singleLineText"
    },
    {
     "name": "Total",
     "type": "formula"
    },
    {
     "name": "Weighted Score",
     "type": "formula"
    },
    {
     "name": "Weighted Score (2)",
     "type": "formula"
    }
   ]
  },
  {
   "id": "tblmgG2XRPr4Hsv9J",
   "name": "Notes",
   "fieldCount": 5
  },
  {
   "id": "tblewF4E0KuDR5d1P",
   "name": "Activity",
   "fieldCount": 4
  }
 ]
}
Notes for AI Code Generation
This schema documentation was optimized for size. Only the most important tables and fields are shown in detail. When writing code that interacts with this Airtable base:

Use the table and field names exactly as shown (case-sensitive)
For record links, check the "recordSelectivity" to determine if it accepts single or multiple records
Verify field types before operations (e.g., don't perform math on text fields)
Primary fields (🔑) are generally used as identifiers