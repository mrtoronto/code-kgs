// GitHub OAuth Configuration
const config = {
    clientId: 'YOUR_GITHUB_CLIENT_ID', // Replace with your GitHub OAuth App client ID
    redirectUri: window.location.origin,
    scope: 'repo' // Required scope for accessing private repositories and creating PRs
};

// Initialize GitHub OAuth flow
document.getElementById('github-login').addEventListener('click', () => {
    // Construct GitHub OAuth URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scope}`;
    
    // Redirect to GitHub for authentication
    window.location.href = authUrl;
});

// Handle OAuth callback
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Remove the code from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Here you would typically send the code to your backend server
        // The server would exchange it for an access token using your client secret
        // For security reasons, this exchange should not be done in the frontend
        
        console.log('Authentication successful! Code:', code);
        // You can now redirect to your app's main functionality
        // or handle the authentication in your preferred way
    }
}); 