Base Schema
{
  "tables": [
    {
      "name": "Contacts",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Full Name",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "First Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Email",
          "type": "email",
          "options": {}
        },
        {
          "name": "Members",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Members",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "UID",
          "type": "number",
          "options": {}
        },
        {
          "name": "Education",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Education",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Applicants",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applicants",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Headshot",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Graduation Semester (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Graduation Year (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Major (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Matriculation Name 2 (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Created",
          "type": "createdTime",
          "options": {}
        },
        {
          "name": "Last Sync Source (Hubspot)",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Participation",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Participation",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Hubspot ID",
          "type": "number",
          "options": {}
        },
        {
          "name": "Hubspot (Graduation Year)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Hubspot Xperience Topic",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Hubspot xFoundry Program",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Different Grad Year?",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Hubspot Student Type",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Phone",
          "type": "phoneNumber",
          "options": {}
        },
        {
          "name": "Degree Type (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Automations",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Applications",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Hubspot Application Cohorts",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Requests",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Requests",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "memberTeamLast",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "memberTeamNameLast",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Points Old",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Points",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "[TEMP] Major 1",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Major 2",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Minor",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Title (Prefix)",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Secondary Email",
          "type": "email",
          "options": {}
        },
        {
          "name": "[TEMP] Student Enrollees",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "OPTIN_IP",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Tags",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Attendance",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Attendance",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "[TEMP] xFoundry Xpand Participation",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Domain",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Phone Number Extension",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Graduation Year",
          "type": "number",
          "options": {}
        },
        {
          "name": "[TEMP] Minor 2",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Student Type",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] xFoundy Program",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "[TEMP] Xperience Topic Interest",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Notes",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Notes",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "[TEMP] First Contact Point RFI Event",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "circleMemberID",
          "type": "number",
          "options": {}
        },
        {
          "name": "Point Transactions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Point Transactions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Contact Points",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "[TEMP] Contacts [Automation]",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Events",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Activity",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Activity",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Emails TEMP",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Xperience Ambassadors",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Cohorts (from Participation)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Memberstack ID",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Memberstack JSON",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Memberstack Plans Data",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Memberstack Plan IDs",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Memberstack Metadata",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Roles",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Roles",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Bio",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Address",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Organizations (from Roles)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Primary Organization (from Roles)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Institutions (from Roles)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Edit Contact Record",
          "type": "formula",
          "options": {}
        },
        {
          "name": "LinkedIn",
          "type": "url",
          "options": {}
        },
        {
          "name": "Capacity (from Participation)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Team (from Members)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Institution (from Education)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Website URL",
          "type": "url",
          "options": {}
        },
        {
          "name": "Submitted Bounties",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Bounties",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Suffix",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Reward Redemption",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Points copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Table 38",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Rewards Claimed",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Rewards Claimed",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Education",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Education ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Major",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Programs",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Graduation Year",
          "type": "number",
          "options": {}
        },
        {
          "name": "Graduation Semester",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Institution",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Matriculation Name",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Matriculation Name 2",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Degree Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "contactEmail",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Major (from Major)",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Colleges (from Major)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Second Major",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Programs",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cohorts (from Participation) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "memberTeamLast (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Name (from Institution)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "College (Text)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Major (from Major) 2",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Abbreviation (from Colleges) (from Major)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Applications",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Application ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "First Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Email",
          "type": "email",
          "options": {}
        },
        {
          "name": "UID",
          "type": "number",
          "options": {}
        },
        {
          "name": "Major",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Programs",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Created",
          "type": "createdTime",
          "options": {}
        },
        {
          "name": "Matched Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Institution",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Graduation Year",
          "type": "number",
          "options": {}
        },
        {
          "name": "Graduation Semester",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Submission Confirmation Sent",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Applicants",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applicants",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Xperience/Team Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Xperience/Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Xperience/Header Image",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Xperience/Looking for Additional Members",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Xperience/Terms and Conditions",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Contact (from Applicants)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Created By",
          "type": "createdBy",
          "options": {}
        },
        {
          "name": "Phone",
          "type": "phoneNumber",
          "options": {}
        },
        {
          "name": "GPA",
          "type": "number",
          "options": {}
        },
        {
          "name": "What are you looking to gain as a result of participating in Xperience?",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Identify and elaborate on three specific skills and experiences you possess that will contribute to creating an innovative and effective solution in the Xperience program.",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Describe your desired career path and explain why you chose your current degree program. Include specific goals and motivations.",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Outline your strategy for managing approximately 20 hours per week for the Xperience competition over the next 15 months while maintaining your other commitments.",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "What's something outside of your work/degree that you are passionate about?",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Provide a specific example of a technical challenge you faced, describe your approach to solving it, and explain the result.",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Are you aware that this program will require you to be physically present during class hours for the Spring 2025, Fall 2025, and Spring 2026 semesters?",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Are you aware that this program will require you to actively compete in and meet milestones of the 2025-2026 Mental Health Competition?",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Unofficial Transcript",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Resume",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Additional Documents",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Cohort",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Record ID (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Name (from Cohort)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Hubspot Cohort",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "cohortShortName",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "hubspotCohortSyncCheck",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Hubspot ID",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Graduation Year (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Degree Type (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Source",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Initiative (from Cohort)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Memberstack ID (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "circleMemberID (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Email (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Applicants",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Applicant ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Application",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Full Name (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Headshot (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Email (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "First Name (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Graduation Year (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Major (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Participation",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Capacity",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Type (from Contacts)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Participation ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Initiative (from Cohorts)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Topics (from Cohorts)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Initiatives",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Short Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "memberEmails (from Teams) (from Cohorts)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Institutions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Participatory Type",
          "type": "singleSelect",
          "options": {}
        }
      ]
    },
    {
      "name": "Topics",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        }
      ]
    },
    {
      "name": "Classes",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Cohorts",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Short Name",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Initiative",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Initiatives",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Participation",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Participation",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Topics",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Topics",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cohort Number",
          "type": "number",
          "options": {}
        },
        {
          "name": "Short Name (from Programs)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Applications",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Milestones",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Milestones",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Teams",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "memberEmails (from Teams)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Classes",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Classes",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Events",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Events",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Partnerships",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Partnerships",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Action Button",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Application Form ID (Fillout)",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Teams",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Team ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Members",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Members",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Applications",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Team Notification Sent",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Team Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Image",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Matching Created",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Count (Members)",
          "type": "count",
          "options": {}
        },
        {
          "name": "Ineligible Members",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Contact (from Members)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Email (from Contact) (from Members)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Submissions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Submissions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Points",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Rewards Claimed",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Rewards Claimed",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Point Transactions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Point Transactions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Team Points",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Member Points",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Total Points",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Team Picture",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "CMS-B: Webflow Slug",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "CMS-B: Webflow ID",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "CMS-B: Action",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "CMS-B: Message",
          "type": "richText",
          "options": {}
        },
        {
          "name": "CMS-B: Sync time",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "memberEmails",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Update Team Info Form",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Select",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Institution",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Join Team (Applications)",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Joinable",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Initiative (from Cohorts)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Initiative Rollup (from Cohorts)",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Joinable (Yes No)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Points copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Members",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Member ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Graduation Semester (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Graduation Year (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Major (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Matriculation Name 2 (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Email (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Record ID (from Team)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Submissions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Submissions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Requests",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Team Name (from Team)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Contact Points",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Xperience Ambassadors",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Xperience Ambassadors 2",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Xperience Ambassadors 3",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Headshot (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "memberName",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "memberstackID",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Major (from Education) (from Contact) 2",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Reward Redemptions",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Institutions",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Education",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Education",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Applications",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Roles",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Roles",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "alpha_two_code",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Country",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Domains",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Web Pages",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "stateCode",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Get State Code",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "AI assist",
          "type": "aiText",
          "options": {}
        },
        {
          "name": "Institution Type",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Teams",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Horizons Challenge Joinable Teams",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Horizons Challenge Joinable Teams Count",
          "type": "count",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Initiatives",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Initiatives",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Partnerships",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Partnerships",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "contactEmail",
          "type": "rollup",
          "options": {}
        }
      ]
    },
    {
      "name": "Partnerships",
      "description": "Affiliations that Institutions have with xFoundry Initiatives",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Institution",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Programs",
      "description": "Educational programs at different universities, but primarily the University of Maryland. \n\nUsed primarily to identity the program that a student is enrolled in, or has graduated from. ",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Major",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Major ID",
          "type": "number",
          "options": {}
        },
        {
          "name": "Colleges",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Colleges",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Applications",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Applications",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Education",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Education",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Education 2",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Education",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Abbreviation (from Colleges)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Colleges",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Majors",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Programs",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Roles",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Roles",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Abbreviation",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "URL",
          "type": "url",
          "options": {}
        }
      ]
    },
    {
      "name": "Roles",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Role ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Organization",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Organizations",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Job Title",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Administrative Department",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Academic Department",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "College",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Colleges",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cross Office Role",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Institutions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Cohorts (from Participation) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Organizations",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Organization ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Resources",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Resources",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Notes",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Notes",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Roles",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Roles",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Organization Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Bounties",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Bounties",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        }
      ]
    },
    {
      "name": "Forms",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Submission Date",
          "type": "date",
          "options": {}
        },
        {
          "name": "Events",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Events",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "First Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Email",
          "type": "email",
          "options": {}
        },
        {
          "name": "Degree Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Graduation Year",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Major",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Programs",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "xFoundry Program Interest",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Xtrapreneurs Interest Statement",
          "type": "richText",
          "options": {}
        },
        {
          "name": "Topic Interest",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Automations",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Submissions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Submissions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Milestones",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Milestones",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Source",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Attachments",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Xperiment Graduate Student Participation",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "I understand that I will represent Xperience and act as a role model for other participants.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "I acknowledge the responsibilities previously mentioned and commit to sticking to them.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "I commit to dedicating 6-7 hours per semester to fulfill my duties as an ambassador.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "I understand that failure to meet responsibilities may result in dismissal from the program.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "I grant permission for Xperience to use my name and photo in promotional materials related to the program.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Do you agree to participate in the ambassador onboarding and training session(s)?",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Schedule",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "I confirm that the information provided is true and accurate to the best of my knowledge.",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Signature",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Select a service",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "File upload",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Requested due date",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "Graphic Deliverables",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Video Deliverables",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Writing Deliverables",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Institution",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Institutions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Graduate Degree Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Members",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Members",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "memberName (from Members)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Why ",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Which competition?",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Commitment",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Skills your bring",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Skills developed",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Attributes ",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Preference",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Anything else?",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Events",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Date",
          "type": "date",
          "options": {}
        },
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Attendance",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Attendance",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Registration Link",
          "type": "url",
          "options": {}
        },
        {
          "name": "Season",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "eventcreate User ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "eventcreate Event ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Automation",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Automation/Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Contacts (from Attendance)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Unique RFI Form",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Form Submission Count",
          "type": "count",
          "options": {}
        },
        {
          "name": "Open Unique RFI",
          "type": "button",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Achievements",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Achievements",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Cohorts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Classes (from Cohorts)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Category",
          "type": "singleSelect",
          "options": {}
        }
      ]
    },
    {
      "name": "Attendance",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Attendance ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Event",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Events",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "First Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Last Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Email",
          "type": "email",
          "options": {}
        },
        {
          "name": "Phone",
          "type": "phoneNumber",
          "options": {}
        },
        {
          "name": "EventCreate Attendee ID",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Education Program",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Grad Year",
          "type": "number",
          "options": {}
        },
        {
          "name": "Degree Program/Type",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Checked In",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Milestones",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Short Name",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Due Datetime",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "Description",
          "type": "richText",
          "options": {}
        },
        {
          "name": "Cohort",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Cohorts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Number",
          "type": "number",
          "options": {}
        },
        {
          "name": "Due Accuracy",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Due Datetime Refined",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Deliverables",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Deliverables",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Num Deliverables",
          "type": "count",
          "options": {}
        },
        {
          "name": "Request Attendance",
          "type": "checkbox",
          "options": {}
        }
      ]
    },
    {
      "name": "Submissions",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Submission ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Created Time",
          "type": "createdTime",
          "options": {}
        },
        {
          "name": "Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Attachment",
          "type": "multipleAttachments",
          "options": {}
        },
        {
          "name": "Comments",
          "type": "richText",
          "options": {}
        },
        {
          "name": "Deliverable",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Deliverables",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Forms",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Forms",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Name (from Deliverable)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Member",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Members",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Members copy",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Points",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Link",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "memberEmails",
          "type": "rollup",
          "options": {}
        },
        {
          "name": "Calculation",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Points copy",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Members copy",
          "type": "singleLineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Deliverables",
      "description": "The things that are due for milestones and bounties",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Deliverable ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Milestones",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Milestones",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Submissions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Submissions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Details",
          "type": "richText",
          "options": {}
        },
        {
          "name": "Bounties",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Bounties",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Bounty Evaluation Criteria",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Bounty Deliverable Submission Form",
          "type": "formula",
          "options": {}
        }
      ]
    },
    {
      "name": "Bounties",
      "description": "Bounties for Xtrapraneurs",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Bounty ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Deliverables",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Deliverables",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Classification",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Prize Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Prize Value",
          "type": "number",
          "options": {}
        },
        {
          "name": "Submitter",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Internship Organization",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Organizations",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Internship Title",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Internship Compensation",
          "type": "number",
          "options": {}
        },
        {
          "name": "Internship Requirements",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Internship Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Additional Comments",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Title",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Visibility",
          "type": "singleSelect",
          "options": {}
        }
      ]
    },
    {
      "name": "Resources",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Link",
          "type": "url",
          "options": {}
        },
        {
          "name": "Licensing Terms",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "How to Access",
          "type": "richText",
          "options": {}
        },
        {
          "name": "Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Provisions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Provisioning",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Provider Organization",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Organizations",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Created",
          "type": "createdTime",
          "options": {}
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        },
        {
          "name": "Tags",
          "type": "multipleSelects",
          "options": {}
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Total Quantity",
          "type": "number",
          "options": {}
        },
        {
          "name": "License Required",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Return Required",
          "type": "checkbox",
          "options": {}
        },
        {
          "name": "Location",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Resource ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Inventory",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Inventory",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Category",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Appreviation",
          "type": "aiText",
          "options": {}
        },
        {
          "name": "Requests",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Requests",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Inventory",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Item ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Resources",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Resources",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Condition",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Location",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Locations",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Notes",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Serial",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Resource Name",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Requests",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Request ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Resource",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Resources",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Request Date",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "Status",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Notes",
          "type": "richText",
          "options": {}
        }
      ]
    },
    {
      "name": "Provisioning",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Resources",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Resources",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Locations",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Inventory",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Inventory",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Points",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Record ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Contact",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Team",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Graduation Semester (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Graduation Year (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Major (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Matriculation Name 2 (from Education) (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Email (from Contact)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Record ID (from Team)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Submissions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Submissions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Requests",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Team Name (from Team)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Registration Bonus",
          "type": "number",
          "options": {}
        },
        {
          "name": "Course Enrollment Bonus",
          "type": "number",
          "options": {}
        },
        {
          "name": "Class Attendance",
          "type": "number",
          "options": {}
        },
        {
          "name": "Event Attendance",
          "type": "number",
          "options": {}
        },
        {
          "name": "Recruiting new members",
          "type": "number",
          "options": {}
        },
        {
          "name": "Team Demo",
          "type": "number",
          "options": {}
        },
        {
          "name": "Sales Pitch",
          "type": "number",
          "options": {}
        },
        {
          "name": "Finals Verififcation",
          "type": "number",
          "options": {}
        },
        {
          "name": "Business Plan",
          "type": "number",
          "options": {}
        },
        {
          "name": "Prototype Demonstration",
          "type": "number",
          "options": {}
        },
        {
          "name": "Total",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Automation",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Created",
          "type": "createdTime",
          "options": {}
        },
        {
          "name": "Automation copy",
          "type": "multipleSelects",
          "options": {}
        }
      ]
    },
    {
      "name": "Point Transactions",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Ledger ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Date",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "Achievements",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Achievements",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Teams",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Assigned",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Points Value (from Achievements)",
          "type": "multipleLookupValues",
          "options": {}
        },
        {
          "name": "Name (from Achievements)",
          "type": "multipleLookupValues",
          "options": {}
        }
      ]
    },
    {
      "name": "Achievements",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Description",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Points Value",
          "type": "number",
          "options": {}
        },
        {
          "name": "Type",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Achievement ID ",
          "type": "formula",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Point Transactions",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Point Transactions",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Airtable ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Events",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Events",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Rewards",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Cost",
          "type": "number",
          "options": {}
        },
        {
          "name": "Number Available",
          "type": "number",
          "options": {}
        },
        {
          "name": "No Cap",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Rewards Claimed",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Rewards Claimed",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "RewardsClaimedCount",
          "type": "count",
          "options": {}
        },
        {
          "name": "RewardsRemaining",
          "type": "formula",
          "options": {}
        }
      ]
    },
    {
      "name": "Rewards Claimed",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Rewards Claimed ID",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Rewards",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Rewards",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Teams",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Teams",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Date Claimed",
          "type": "date",
          "options": {}
        },
        {
          "name": "Notes",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        }
      ]
    },
    {
      "name": "Rubric Submissions",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Team Name",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Comments (1)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (1)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Category 1",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Weighted Score",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Category 2",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (2)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (2)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Comments (2)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Category 3",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (3)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (3)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Category 4",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (4)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (4)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Category 5",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (5)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (5)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Category 6",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (6)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (6)",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Category 7",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Score (1-5) (7)",
          "type": "number",
          "options": {}
        },
        {
          "name": "Weighted Score (7",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Total",
          "type": "formula",
          "options": {}
        },
        {
          "name": "Comments (3)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Comments (4)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Comments (5)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Comments (6)",
          "type": "multilineText",
          "options": {}
        },
        {
          "name": "Comments (7)",
          "type": "multilineText",
          "options": {}
        }
      ]
    },
    {
      "name": "Notes",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Note",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Hubspot ID",
          "type": "singleLineText",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Organizations",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Organizations",
            "allowsMultipleRecords": true
          }
        },
        {
          "name": "Last Modified",
          "type": "lastModifiedTime",
          "options": {}
        }
      ]
    },
    {
      "name": "Activity",
      "description": "",
      "primaryFieldName": "",
      "fields": [
        {
          "name": "Activity ID",
          "type": "autoNumber",
          "options": {}
        },
        {
          "name": "Date Time",
          "type": "dateTime",
          "options": {}
        },
        {
          "name": "Automation",
          "type": "singleSelect",
          "options": {}
        },
        {
          "name": "Contacts",
          "type": "multipleRecordLinks",
          "options": {
            "relationshipType": "-> Contacts",
            "allowsMultipleRecords": true
          }
        }
      ]
    }
  ]
}