import { json } from '@sveltejs/kit';
import { Octokit } from '@octokit/rest';
import { GITHUB_TOKEN } from '$env/static/private';

async function commitSingleFile(octokit, user, repoName, lang, content) {
	const path = `static/languages/${lang}.json`;

	try {
		const { data: existingFile } = await octokit.repos.getContent({
			owner: user.login,
			repo: repoName,
			path
		});

		await octokit.repos.createOrUpdateFileContents({
			owner: user.login,
			repo: repoName,
			path,
			message: `Update language file: ${lang}`,
			content: Buffer.from(content).toString('base64'),
			sha: existingFile.sha,
			branch: 'main'
		});
	} catch (error) {
		if (error.status === 404) {
			await octokit.repos.createOrUpdateFileContents({
				owner: user.login,
				repo: repoName,
				path,
				message: `Add language file: ${lang}`,
				content: Buffer.from(content).toString('base64'),
				branch: 'main'
			});
		} else {
			throw error;
		}
	}
}

export async function POST({ request }) {
	try {
		const { repoName, translations, isLastBatch = false } = await request.json();
		const languages = Object.keys(translations);
		console.log(
			`Processing ${languages.length} files for repo: ${repoName}, isLastBatch: ${isLastBatch}`
		);

		if (!GITHUB_TOKEN) {
			throw new Error('GitHub token not configured');
		}

		const octokit = new Octokit({ auth: GITHUB_TOKEN });
		const { data: user } = await octokit.users.getAuthenticated();

		// Process each language in the batch
		for (const lang of languages) {
			try {
				const content = JSON.stringify(translations[lang], null, 2);
				await commitSingleFile(octokit, user, repoName, lang, content);
				console.log(`Committed language file: ${lang}`);
			} catch (error) {
				console.error(`Failed to commit language file ${lang}:`, error);
				throw error;
			}
		}

		// If this is the last batch, trigger deployment
		if (isLastBatch) {
			console.log('Final batch - triggering deployment');
			await octokit.repos.createDispatchEvent({
				owner: user.login,
				repo: repoName,
				event_type: 'deployment',
				client_payload: {
					initiated_at: new Date().toISOString()
				}
			});
		}

		return json({
			status: 'success',
			message: `Successfully processed ${languages.length} files${isLastBatch ? ' and triggered deployment' : ''}`,
			processedLanguages: languages
		});
	} catch (error) {
		console.error('Error in commit-files:', error);
		return json(
			{
				error: error.message || 'Failed to commit files',
				status: 'error',
				details: error.stack
			},
			{ status: error.status || 500 }
		);
	}
}
