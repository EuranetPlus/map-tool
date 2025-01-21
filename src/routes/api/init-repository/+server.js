import { json } from '@sveltejs/kit';
import { Octokit } from '@octokit/rest';
import { GITHUB_TOKEN } from '$env/static/private';

// Constants
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const REPO_CREATION_WAIT = 2000;

// Utility function for retrying operations
async function retryOperation(operation, retries = MAX_RETRIES) {
	for (let i = 0; i < retries; i++) {
		try {
			return await operation();
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
		}
	}
}

// Setup repository function
async function setupRepository(octokit, user, repoName, mapConfig) {
	// Delete existing repo if needed
	try {
		await octokit.repos.delete({
			owner: user.login,
			repo: repoName
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));
	} catch (error) {
		if (error.status !== 404) throw error;
	}

	// Create new repository
	await retryOperation(async () => {
		await octokit.repos.createUsingTemplate({
			template_owner: 'EuranetPlus',
			template_repo: 'map-tool',
			owner: user.login,
			name: repoName,
			private: false,
			include_all_branches: false
		});
	});

	await new Promise((resolve) => setTimeout(resolve, REPO_CREATION_WAIT));

	// Update config-map.js
	const configMapContent = `import { writable } from 'svelte/store';
export const mapConfig = writable(${JSON.stringify(mapConfig, null, 2)});`;

	try {
		// Try to get existing file
		const { data: currentFile } = await retryOperation(async () => {
			return await octokit.repos.getContent({
				owner: user.login,
				repo: repoName,
				path: 'src/lib/stores/config-map.js'
			});
		});

		// Update existing file
		await retryOperation(async () => {
			await octokit.repos.createOrUpdateFileContents({
				owner: user.login,
				repo: repoName,
				path: 'src/lib/stores/config-map.js',
				message: 'Update map configuration',
				content: Buffer.from(configMapContent).toString('base64'),
				sha: currentFile.sha,
				branch: 'main'
			});
		});
	} catch (error) {
		if (error.status === 404) {
			// File doesn't exist yet, create it
			await retryOperation(async () => {
				await octokit.repos.createOrUpdateFileContents({
					owner: user.login,
					repo: repoName,
					path: 'src/lib/stores/config-map.js',
					message: 'Add map configuration',
					content: Buffer.from(configMapContent).toString('base64'),
					branch: 'main'
				});
			});
		} else {
			throw error;
		}
	}

	return true;
}

export async function POST({ request }) {
	try {
		const { repoName, mapConfig } = await request.json();
		console.log('Starting repository initialization for:', repoName);

		if (!GITHUB_TOKEN) {
			throw new Error('GitHub token not configured');
		}

		const octokit = new Octokit({ auth: GITHUB_TOKEN });
		const { data: user } = await octokit.users.getAuthenticated();

		// Create and setup repository
		console.log('Setting up repository...');
		await setupRepository(octokit, user, repoName, mapConfig);
		console.log('Repository setup completed');

		return json({
			message: 'Repository initialized successfully',
			status: 'success',
			repoUrl: `https://github.com/${user.login}/${repoName}`
		});
	} catch (error) {
		console.error('Repository initialization error:', error);
		return json(
			{
				error: error.message || 'Failed to initialize repository',
				status: 'error'
			},
			{ status: error.status || 500 }
		);
	}
}
