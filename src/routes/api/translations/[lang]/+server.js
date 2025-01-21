import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	try {
		const lang = params.lang;

		// First get the URL map
		const urlMapResponse = await fetch(
			`${process.env.NEXT_PUBLIC_BLOB_BASE_URL}/languages/url-map.json`
		);
		if (!urlMapResponse.ok) {
			throw new Error('Failed to load URL map');
		}

		const urlMap = await urlMapResponse.json();
		const translationUrl = urlMap[lang];

		if (!translationUrl) {
			return json({ error: `No translation found for ${lang}` }, { status: 404 });
		}

		const response = await fetch(translationUrl);
		if (!response.ok) {
			throw new Error(`Failed to load translation from ${translationUrl}`);
		}

		const content = await response.json();
		return json(content);
	} catch (error) {
		console.error('Error fetching translation:', error);
		return json({ error: 'Failed to fetch translation' }, { status: 500 });
	}
}
