# Code KGs

Generate knowledge graphs from your codebase and create intelligent pull requests based on the generated insights.

## Setup

1. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
   - Set the Application name (e.g., "Code KGs")
   - Set the Homepage URL to your GitHub Pages URL (e.g., `https://username.github.io/code-kgs`)
   - Set the Authorization callback URL to the same GitHub Pages URL
   - Register the application and note down the Client ID
   - Generate a new client secret and save it securely

2. Configure the application:
   - Replace `YOUR_GITHUB_CLIENT_ID` in `auth.js` with your actual GitHub OAuth App client ID

3. Deploy to GitHub Pages:
   - The site will be automatically deployed to GitHub Pages when you push to the main branch
   - You can also manually trigger the deployment from the Actions tab

## Features

- GitHub OAuth authentication for secure access to repositories
- Knowledge graph generation from codebases
- Intelligent PR creation based on knowledge graph insights
- Support for private repositories

## Development

To run the project locally:

1. Clone the repository
2. Open `index.html` in your browser
3. For local development, you may need to set up a local server to handle OAuth callbacks

## Security Notes

- The GitHub OAuth flow is implemented following security best practices
- The application requests only the necessary scopes (`repo`) for its functionality
- OAuth token exchange should be handled by a secure backend server (not included in this frontend-only implementation)

## License

MIT License 