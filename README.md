# Code KGs

Generate knowledge graphs from your codebase and create intelligent pull requests based on the generated insights.

## Setup

1. Create two GitHub OAuth Apps (one for development, one for production):
   - Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
   - For Development:
     - Application name: "Code KGs Dev"
     - Homepage URL: `http://localhost:8000`
     - Authorization callback URL: `http://localhost:8000`
   - For Production:
     - Application name: "Code KGs"
     - Homepage URL: `https://mrtoronto.github.io/code-kgs`
     - Authorization callback URL: `https://mrtoronto.github.io/code-kgs`
   - Register both applications and note down their Client IDs

2. Configure the application:
   - For local development:
     - Replace `YOUR_DEV_CLIENT_ID` in `auth.js` with your development OAuth App client ID
   - For production:
     - Go to your repository settings
     - Navigate to Secrets and Variables > Actions
     - Add a new repository secret named `GITHUB_OAUTH_CLIENT_ID` with your production OAuth App client ID

3. Local Development:
   ```bash
   # Start the local development server
   python serve.py
   # Visit http://localhost:8000 in your browser
   ```

4. Production Deployment:
   - The site will be automatically deployed to GitHub Pages when you push to the main branch
   - The production client ID will be automatically injected during the build process
   - You can also manually trigger the deployment from the Actions tab

## Features

- GitHub OAuth authentication for secure access to repositories
- Knowledge graph generation from codebases
- Intelligent PR creation based on knowledge graph insights
- Support for private repositories

## Security Notes

- The GitHub OAuth flow is implemented following security best practices
- The application requests only the necessary scopes (`repo`) for its functionality
- Client IDs are handled securely:
  - Development ID is only used locally
  - Production ID is stored in GitHub Secrets and injected during build
- No server required! Everything is handled client-side with GitHub's OAuth flow

## License

MIT License 
hello