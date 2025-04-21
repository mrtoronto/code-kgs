// GitHub OAuth Configuration
const config = {
    scope: 'repo' // Required scope for accessing private repositories and creating PRs
};

// Function to update UI with user info
async function updateUIWithUserInfo(userInfo) {
    const userInfoSection = document.getElementById('user-info');
    const tokenInput = document.getElementById('token-input');
    const tokenSubmitButton = document.getElementById('submit-token');
    const testPrContainer = document.getElementById('test-pr-container');

    if (!userInfoSection || !tokenInput || !tokenSubmitButton || !testPrContainer) {
        console.error('Required DOM elements not found');
        return;
    }

    if (userInfo) {
        userInfoSection.innerHTML = `
            <img src="${userInfo.avatar_url}" alt="User avatar" class="github-avatar large">
            <p>Logged in as <strong>${userInfo.login}</strong></p>
            <div id="repo-section" class="mt-4">
                <h3>Link Repository</h3>
                <div class="input-group">
                    <input type="text" id="repo-url" class="form-control" placeholder="Enter GitHub repository URL">
                    <button id="link-repo" class="btn-primary">Link Repo</button>
                </div>
                <div id="linked-repo-info" class="mt-3"></div>
            </div>
            <button id="logout" class="btn-secondary mt-4">Logout</button>
        `;
        tokenInput.style.display = 'none';
        tokenSubmitButton.style.display = 'none';
        testPrContainer.style.display = 'block';

        // Add event listener for repo linking
        const linkRepoButton = document.getElementById('link-repo');
        if (linkRepoButton) {
            linkRepoButton.addEventListener('click', handleRepoLink);
        }

        // Add event listener for test PR creation
        const createTestPrButton = document.getElementById('create-test-pr');
        if (createTestPrButton) {
            createTestPrButton.addEventListener('click', handleCreateTestPr);
        }
    } else {
        userInfoSection.innerHTML = '';
        tokenInput.style.display = 'block';
        tokenSubmitButton.style.display = 'block';
        testPrContainer.style.display = 'none';
    }
}

// Function to fetch user info from GitHub
async function fetchUserInfo(token) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

// Function to validate GitHub token format
function validateToken(token) {
    // GitHub tokens are 40 characters long for classic tokens
    // or start with 'ghp_' for fine-grained tokens
    return token.length === 40 || (token.startsWith('ghp_') && token.length >= 40);
}

// Function to handle token submission
async function handleTokenSubmit() {
    const tokenInput = document.getElementById('token-input');
    const token = tokenInput.value.trim();

    if (!token) {
        alert('Please enter a GitHub Personal Access Token');
        return;
    }

    if (!validateToken(token)) {
        alert('Invalid token format. Please ensure you\'ve copied the entire token correctly.');
        return;
    }

    try {
        const userInfo = await fetchUserInfo(token);
        sessionStorage.setItem('github_token', token);
        sessionStorage.setItem('github_user', JSON.stringify(userInfo));
        await updateUIWithUserInfo(userInfo);
    } catch (error) {
        console.error('Error during authentication:', error);
        let errorMessage = 'Failed to authenticate. ';
        if (error.message.includes('401')) {
            errorMessage += 'Invalid token or token has been revoked. Please check your token and try again.';
        } else if (error.message.includes('403')) {
            errorMessage += 'Token does not have the required permissions. Please ensure you\'ve included the necessary scopes.';
        } else {
            errorMessage += 'Please check your token and try again.';
        }
        alert(errorMessage);
        sessionStorage.removeItem('github_token');
        sessionStorage.removeItem('github_user');
        await updateUIWithUserInfo(null);
    }
}

// Function to handle logout
function handleLogout() {
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_user');
    sessionStorage.removeItem('linked_repo');
    updateUIWithUserInfo(null);
}

// Function to extract owner and repo from GitHub URL
function parseGitHubUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.includes('github.com')) {
            throw new Error('Not a GitHub URL');
        }
        
        const parts = parsedUrl.pathname.split('/').filter(part => part);
        if (parts.length < 2) {
            throw new Error('Invalid repository URL');
        }
        
        return {
            owner: parts[0],
            repo: parts[1]
        };
    } catch (error) {
        throw new Error('Please enter a valid GitHub repository URL');
    }
}

// Function to check repository access
async function checkRepoAccess(owner, repo) {
    const token = sessionStorage.getItem('github_token');
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const repoData = await response.json();
        return repoData;
    } catch (error) {
        console.error('Error checking repo access:', error);
        throw error;
    }
}

// Function to query UIthub API
async function queryUIthub(repoUrl) {
    try {
        const uithubUrl = `${repoUrl}?accept=application%2Fjson&maxTokens=50000`;
        const response = await fetch(uithubUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error querying UIthub:', error);
        throw error;
    }
}

// Function to handle repository linking
async function handleRepoLink() {
    const repoUrlInput = document.getElementById('repo-url');
    const linkRepoButton = document.getElementById('link-repo');
    const linkedRepoInfo = document.getElementById('linked-repo-info');
    const testPrContainer = document.getElementById('test-pr-container');
    
    if (!repoUrlInput || !linkRepoButton || !linkedRepoInfo || !testPrContainer) {
        console.error('Required DOM elements not found');
        return;
    }

    const repoUrl = repoUrlInput.value.trim();
    if (!repoUrl) {
        alert('Please enter a repository URL');
        return;
    }

    // Disable button and show loading state
    linkRepoButton.disabled = true;
    linkRepoButton.innerHTML = 'Linking...<span class="spinner"></span>';
    linkedRepoInfo.innerHTML = `
        <div class="loading-text">
            <span>Processing repository</span>
            <span class="spinner"></span>
        </div>
    `;

    try {
        const { owner, repo } = parseGitHubUrl(repoUrl);
        const token = sessionStorage.getItem('github_token');
        
        // Update loading message for GitHub verification
        linkedRepoInfo.innerHTML = `
            <div class="loading-text">
                <span>Verifying repository access</span>
                <span class="spinner"></span>
            </div>
        `;
        
        // Verify repository access
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const repoData = await response.json();
        
        // Update loading message for UIthub query
        linkedRepoInfo.innerHTML = `
            <div class="loading-text">
                <span>Fetching repository statistics</span>
                <span class="spinner"></span>
            </div>
        `;
        
        // Query UIthub API
        const uithubUrl = repoUrl.replace('github.com', 'uithub.com');
        const uithubData = await queryUIthub(uithubUrl);
        
        // Store both GitHub and UIthub data
        sessionStorage.setItem('linked_repo', JSON.stringify({ 
            owner, 
            repo, 
            url: repoUrl,
            uithubData 
        }));
        
        // Update UI with repository info and UIthub stats
        linkedRepoInfo.innerHTML = `
            <p>✓ Successfully linked to: <strong>${repoData.full_name}</strong></p>
            <div class="uithub-stats mt-3">
                <h4>Repository Stats:</h4>
                <ul>
                    <li>Total Tokens: ${uithubData.size.totalTokens.toLocaleString()}</li>
                    <li>Characters: ${uithubData.size.characters.toLocaleString()}</li>
                    <li>Lines: ${uithubData.size.lines.toLocaleString()}</li>
                </ul>
            </div>
        `;
        testPrContainer.style.display = 'block';
    } catch (error) {
        console.error('Error linking repository:', error);
        linkedRepoInfo.innerHTML = `
            <p style="color: var(--error-color)">❌ Failed to link repository. Please check the URL and try again.</p>
        `;
        testPrContainer.style.display = 'none';
        sessionStorage.removeItem('linked_repo');
    } finally {
        // Re-enable button and restore original text
        linkRepoButton.disabled = false;
        linkRepoButton.innerHTML = 'Link Repo';
    }
}

// Function to create a unique branch name
function generateUniqueBranchName() {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `test-pr-${timestamp}-${randomString}`;
}

// Function to handle test PR creation
async function handleCreateTestPr() {
    const token = sessionStorage.getItem('github_token');
    const repoInfo = JSON.parse(sessionStorage.getItem('linked_repo'));
    
    if (!token || !repoInfo) {
        alert('Please link a repository first');
        return;
    }

    const { owner, repo } = repoInfo;
    const branchName = generateUniqueBranchName();

    try {
        // Get the default branch's latest commit SHA
        const baseResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        const baseData = await baseResponse.json();
        const baseBranch = baseData.default_branch;

        // Get the base branch's reference
        const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        const refData = await refResponse.json();
        const baseSha = refData.object.sha;

        // Create new branch
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: baseSha
            })
        });

        // Get README content
        const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        const readmeData = await readmeResponse.json();
        const currentContent = atob(readmeData.content);
        const newContent = currentContent + '\nhello';

        // Update README
        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Test PR: Add hello to README',
                content: btoa(newContent),
                sha: readmeData.sha,
                branch: branchName
            })
        });

        // Create Pull Request
        const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Test PR: Add hello to README',
                body: 'This is a test PR created by Code KGs to verify repository access and PR creation functionality.',
                head: branchName,
                base: baseBranch
            })
        });

        const prData = await prResponse.json();
        alert(`Successfully created test PR! View it here: ${prData.html_url}`);
    } catch (error) {
        console.error('Error creating test PR:', error);
        alert('Failed to create test PR. Please check the console for details.');
    }
}

// Function to validate OpenAI API key format
function validateOpenAIKey(key) {
    // OpenAI API keys start with 'sk-' and are 51 characters long
    return key.startsWith('sk-') && key.length === 51;
}

// Function to handle OpenAI API key submission
function handleOpenAIKeySubmit() {
    const keyInput = document.getElementById('openai-key-input');
    const keyStatus = document.getElementById('openai-key-status');
    const key = keyInput.value.trim();

    if (!key) {
        keyStatus.innerHTML = '<p style="color: var(--error-color)">Please enter an OpenAI API key</p>';
        return;
    }

    try {
        localStorage.setItem('openai_api_key', key);
        keyStatus.innerHTML = '<p class="success-message">API key saved successfully!</p>';
        keyInput.value = ''; // Clear the input for security
    } catch (error) {
        console.error('Error saving API key:', error);
        keyStatus.innerHTML = '<p style="color: var(--error-color)">Failed to save API key. Please try again.</p>';
    }
}

// Function to check for existing OpenAI API key
function checkExistingOpenAIKey() {
    const keyStatus = document.getElementById('openai-key-status');
    const savedKey = localStorage.getItem('openai_api_key');
    
    if (savedKey) {
        keyStatus.innerHTML = '<p class="success-message">API key is already saved</p>';
    }
}

// Initialize the UI based on session storage
document.addEventListener('DOMContentLoaded', async () => {
    const submitButton = document.getElementById('submit-token');
    if (submitButton) {
        submitButton.addEventListener('click', handleTokenSubmit);
    }

    const saveOpenAIKeyButton = document.getElementById('save-openai-key');
    if (saveOpenAIKeyButton) {
        saveOpenAIKeyButton.addEventListener('click', handleOpenAIKeySubmit);
    }

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'logout') {
            handleLogout();
        }
    });

    // Check for existing OpenAI API key
    checkExistingOpenAIKey();

    const storedToken = sessionStorage.getItem('github_token');
    const storedUser = sessionStorage.getItem('github_user');

    if (storedToken && storedUser) {
        try {
            const userInfo = JSON.parse(storedUser);
            await updateUIWithUserInfo(userInfo);
        } catch (error) {
            console.error('Error restoring session:', error);
            sessionStorage.removeItem('github_token');
            sessionStorage.removeItem('github_user');
            await updateUIWithUserInfo(null);
        }
    }
}); 