// src/lib/utils/translationHandler.js
import { translations } from '$lib/stores/translations';
import { get } from 'svelte/store';
import fs from 'fs/promises';
import path from 'path';

/**
 * Saves the current translations to the project's static directory
 * @param {string} projectPath - Path to the project directory
 */
export async function saveTranslationsToProject(projectPath) {
	try {
		const currentTranslations = get(translations);
		if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
			throw new Error('No translations available to save');
		}

		// Create static/languages directory
		const languagesDir = path.join(projectPath, 'static', 'languages');
		await fs.mkdir(languagesDir, { recursive: true });

		// Save each language file
		for (const [lang, content] of Object.entries(currentTranslations)) {
			const filePath = path.join(languagesDir, `${lang}.json`);
			await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
		}

		return languagesDir;
	} catch (error) {
		console.error('Error saving translations:', error);
		throw error;
	}
}

/**
 * Loads translations from static files in deployed projects
 * @param {string} lang - Language code to load
 * @returns {Promise<Object>} Translation data
 */
export async function loadProjectTranslations(lang) {
	try {
		// In development, use the store
		if (process.env.NODE_ENV === 'development') {
			const currentTranslations = get(translations);
			return currentTranslations[lang] || {};
		}

		// In production, load from static file
		const response = await fetch(`/languages/${lang}.json`);
		if (!response.ok) {
			throw new Error(`Failed to load language file: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error(`Failed to load translations for ${lang}:`, error);
		return {};
	}
}
