import { put } from '@vercel/blob';

export async function saveTranslationsToBlob(translations) {
	try {
		const urlMap = {};

		for (const [lang, content] of Object.entries(translations)) {
			const { url } = await put(`languages/${lang}.json`, JSON.stringify(content, null, 2), {
				contentType: 'application/json',
				access: 'public'
			});
			urlMap[lang] = url;
			console.log(`Saved ${lang} translation to URL:`, url);
		}

		return urlMap;
	} catch (error) {
		console.error('Error saving to blob storage:', error);
		throw new Error(`Failed to save translations: ${error.message}`);
	}
}
