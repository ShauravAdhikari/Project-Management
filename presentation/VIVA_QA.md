# Yutani Foundation Viva Questions and Answers

Use these answers in your viva or oral presentation.

## 1. What is the main purpose of your project?

My project is a full-stack project management platform called Yutani Foundation. It helps teams organize work using workspaces, projects, tasks, member roles, dashboards, and an AI assistant.

## 2. Why did you choose this project?

I chose this project because project management is a practical real-world problem. It also allowed me to demonstrate frontend development, backend APIs, database design, authentication, deployment, and AI integration in one system.

## 3. Which technologies did you use?

I used React, React Router, TypeScript, Tailwind CSS, and React Query on the frontend. On the backend I used Node.js, Express, MongoDB, and Mongoose. I also integrated OpenAI, SendGrid, and Arcjet.

## 4. Why did you choose MongoDB?

I chose MongoDB because the project has flexible document-based data such as workspaces, projects, tasks, comments, and nested subtasks. MongoDB makes it easier to model these relationships and evolve the schema during development.

## 5. How does authentication work?

Users register with email and password. Passwords are hashed using bcrypt before storage. On successful login, the backend creates a JWT token. That token is stored on the frontend and sent with protected API requests.

## 6. How are users authorized to access data?

The backend checks whether the logged-in user belongs to the relevant workspace or project before returning protected data. This prevents unauthorized access to project and task information.

## 7. What is the purpose of workspaces?

Workspaces provide top-level organization. They allow teams or departments to group related projects together and manage members in a structured way.

## 8. What is the difference between workspace members and project members?

Workspace members belong to the whole workspace. Project members are selected from workspace members and assigned to a particular project with roles such as manager, contributor, or viewer.

## 9. What is React Query used for?

React Query is used for server-state management. It helps fetch data, cache responses, refresh data after mutations, and improve the user experience during loading and updates.

## 10. What challenges did you face?

I faced frontend dependency conflicts, dashboard crashes caused by missing data, MongoDB Atlas connection issues, CORS issues, and local backend port conflicts. I fixed them by updating dependencies, hardening data handling, and improving backend configuration.

## 11. Why did you add an AI assistant?

I added the AI assistant to improve usability. It helps users understand features, plan tasks, and generate helpful project-related responses inside the app.

## 12. Is this project production-ready?

It is strong for academic use, demos, and local deployment. However, for full production readiness, I would still add automated testing, stronger monitoring, cloud file storage, and more advanced role management.

## 13. What are the main collections in your database?

The main collections are User, Workspace, Project, Task, Comment, Activity, Verification, and WorkspaceInvite.

## 14. How does the dashboard work?

The dashboard fetches workspace statistics from the backend and computes project and task summaries, task trends, status distribution, priority data, and upcoming tasks to present a management overview.

## 15. What improvements would you add in the future?

I would add notifications, better file uploads, calendar integration, stronger reports, real-time collaboration, and a full automated testing pipeline.

## 16. What makes your project different from a simple CRUD app?

This project is more than CRUD because it includes authentication, role-based access, workspace and project hierarchies, analytics, AI integration, archived workflows, and production deployment preparation.

## 17. How do you explain the architecture simply?

The frontend handles user interaction, the backend exposes APIs and business logic, MongoDB stores the data, and external services like OpenAI and SendGrid provide advanced features.

## 18. What part of the project are you most proud of?

I am most proud of turning the project into a realistic team-management platform with dashboards, project membership logic, and AI support rather than just a basic task list.

## 19. What happens when a user creates a project?

The frontend sends project data to the backend API. The backend validates the request, checks workspace membership, creates the project in MongoDB, links it to the workspace, and returns the created project to the frontend.

## 20. How would you summarize the value of the project in one sentence?

Yutani Foundation is a practical full-stack platform that helps teams plan, track, and manage work efficiently from one centralized system.
