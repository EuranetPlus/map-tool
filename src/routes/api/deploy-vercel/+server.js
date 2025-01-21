import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GITHUB_TOKEN, GITHUB_USERNAME } from '$env/static/private';
import { Octokit } from '@octokit/rest';

// Constants
const REPO_CHECK_MAX_ATTEMPTS = 5;
const REPO_CHECK_DELAY = 2000;

// Helper to get Vercel token
function getVercelToken() {
	const token = env.DEPLOY_VERCEL_TOKEN || env.VERCEL_TOKEN;
	if (!token) {
		throw new Error('No Vercel token found');
	}
	return token;
}

// Helper function to wait for repo to be available
async function waitForRepo(octokit, owner, repo) {
	for (let i = 0; i < REPO_CHECK_MAX_ATTEMPTS; i++) {
		try {
			console.log(`Attempt ${i + 1} to fetch repo...`);
			const { data } = await octokit.repos.get({
				owner,
				repo
			});
			console.log('Repository found:', data.full_name);
			return data;
		} catch (error) {
			console.log(`Attempt ${i + 1} failed:`, error.message);
			if (i === REPO_CHECK_MAX_ATTEMPTS - 1) {
				throw new Error(`Failed to find repository after ${REPO_CHECK_MAX_ATTEMPTS} attempts`);
			}
			await new Promise((resolve) => setTimeout(resolve, REPO_CHECK_DELAY));
		}
	}
}

export async function POST({ request }) {
	try {
		// Get tokens and validate environment variables
		const token = getVercelToken();
		if (!token || !GITHUB_TOKEN || !GITHUB_USERNAME) {
			throw new Error('Missing required environment variables');
		}

		// Get repository name from request
		const { repoName } = await request.json();
		if (!repoName) {
			throw new Error('Repository name is required');
		}

		console.log('Starting Vercel deployment process...');

		// Initialize Octokit and wait for repo
		const octokit = new Octokit({ auth: GITHUB_TOKEN });
		const repo = await waitForRepo(octokit, GITHUB_USERNAME, repoName);

		// Create Vercel project
		const projectResponse = await fetch('https://api.vercel.com/v9/projects', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: repoName,
				framework: 'svelte',
				gitRepository: {
					type: 'github',
					repo: `${GITHUB_USERNAME}/${repoName}`,
					repoId: repo.id.toString()
				},
				buildCommand: 'npm run build',
				devCommand: 'npm run dev',
				outputDirectory: '.svelte-kit',
				environmentVariables: [
					{
						key: 'GITHUB_TOKEN',
						value: GITHUB_TOKEN,
						type: 'encrypted',
						target: ['production', 'preview', 'development']
					},
					{
						key: 'GITHUB_USERNAME',
						value: GITHUB_USERNAME,
						type: 'plain',
						target: ['production', 'preview', 'development']
					}
				]
			})
		});

		const projectData = await projectResponse.json();
		if (!projectResponse.ok || !projectData.id) {
			throw new Error(projectData.error?.message || 'Failed to create Vercel project');
		}

		// Create deployment
		const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: repoName,
				project: projectData.id,
				gitSource: {
					type: 'github',
					repo: `${GITHUB_USERNAME}/${repoName}`,
					ref: 'main',
					repoId: repo.id.toString()
				}
			})
		});

		const deployData = await deployResponse.json();
		if (!deployResponse.ok || !deployData) {
			throw new Error(deployData?.error?.message || 'Failed to create deployment');
		}

		return json({
			message: 'Project created and deployment initiated',
			deploymentUrl: deployData.url,
			projectUrl: `https://${repoName}.vercel.app/?view=fullscreen` // Single source of URL construction
		});
	} catch (error) {
		console.error('Deployment error:', error);
		return json(
			{
				error: error.message || 'Failed to deploy',
				details: error.response?.data || error.stack
			},
			{ status: error.status || 500 }
		);
	}
}
