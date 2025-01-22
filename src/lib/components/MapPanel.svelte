<!-- src/lib/components/MapPanel.svelte -->
<script>
	import { page } from '$app/stores';
	import { geoIdentity } from 'd3-geo';
	import { feature } from 'topojson-client';
	import { mapConfig } from '$lib/stores/config-map';
	import { shouldUpdateMap } from '$lib/stores/update-map';
	import { onMount } from 'svelte';
	import { APP_HEIGHT, mobileSize, isMobile } from '$lib/stores/shared';
	import { selectedLanguage } from '$lib/stores/shared';
	import { languageNameTranslations } from '$lib/stores/languages';
	import MapChoropleth from '$lib/components/MapChoropleth.svelte';
	import MapSimple from '$lib/components/MapSimple.svelte';
	import Select from 'svelte-select';

	import { translations } from '$lib/stores/translations';

	let heading;
	let subheading;
	let tooltip;
	let tooltipEntries;
	let textSourceDescription;
	let textSource;
	let textDataAccess;
	let linkDataAccess;
	let linkDataAccessDescription;
	let textNoteDescription;
	let textNote;
	let customUnitLabel;
	let tooltipExtraInfoLabel;

	let textCountryClick;
	let extraInfoTexts;
	let extraInfoLinks;
	let innerWidth;
	let containerHeight;

	let transformedGeoData;

	let headerRef;
	let chartHeaderRef;
	let sourceNotesRef;
	let totalTextHeight = 0;

	// Function to get element's total height including margins
	function getTotalHeight(element) {
		if (!element) return 0;

		// Get computed styles for the element
		const styles = window.getComputedStyle(element);
		const marginTop = parseInt(styles.marginTop) || 0;
		const marginBottom = parseInt(styles.marginBottom) || 0;
		const elementHeight = element.offsetHeight;

		// Get the element's parent's margin if it exists and is within our map container
		let parentMargin = 0;
		if (element.parentElement && !element.parentElement.matches('#euranet-map')) {
			const parentStyles = window.getComputedStyle(element.parentElement);
			parentMargin = parseInt(parentStyles.marginTop) || 0;
		}

		return elementHeight + marginTop + marginBottom + parentMargin;
	}

	$: if (headerRef && chartHeaderRef && sourceNotesRef) {
		const headerTotal = getTotalHeight(headerRef);
		const chartHeaderTotal = getTotalHeight(chartHeaderRef);
		const sourceNotesTotal = getTotalHeight(sourceNotesRef);

		totalTextHeight = headerTotal + chartHeaderTotal + sourceNotesTotal;
	}

	// Add this function to detect if we're in a deployed sub-app
	function isDeployedMap() {
		// Check if we're in a deployed map by looking for specific URL parameters
		// or checking the current URL path structure
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			// Deployed maps will have the view=fullscreen parameter
			return url.searchParams.has('view') && url.searchParams.get('view') === 'fullscreen';
		}
		return false;
	}

	async function loadTranslationFile(lang) {
		try {
			const isSubApp = window.location.search.includes('view=fullscreen');

			if (isSubApp) {
				// In sub-app, load from static files
				const response = await fetch(`/languages/${lang}.json`);
				if (!response.ok) {
					throw new Error(`Failed to load language file: ${response.statusText}`);
				}
				return await response.json();
			} else {
				// In main app, load from blob storage
				const response = await fetch(`/api/translations/${lang}`);
				if (!response.ok) {
					throw new Error(`Failed to load translation: ${response.statusText}`);
				}
				return await response.json();
			}
		} catch (error) {
			console.error(`Error loading translation for ${lang}:`, error);
			return null;
		}
	}

	async function fetchAndTransformGeoData() {
		const res = await fetch('/data/geodata/europe-20m.json');
		const data = await res.json();

		const width = 600;
		const height = 600;
		const padding = -60;

		const projection = geoIdentity().reflectY(true);
		projection.fitExtent(
			[
				[padding, padding],
				[width - padding, height - padding]
			],
			feature(data, data.objects.cntrg)
		);

		transformedGeoData = {
			countries: feature(data, data.objects.cntrg),
			graticules: feature(data, data.objects.gra)
		};
	}

	// Your reactive statement stays the same
	// $: if ($translations && Object.keys($translations).length > 0 && $selectedLanguage?.value) {
	// 	getLanguage($selectedLanguage.value);
	// }

	// To this:
	$: if ($translations && Object.keys($translations).length > 0 && $selectedLanguage?.value) {
		const isSubApp = window.location.search.includes('view=fullscreen');
		if (!isSubApp) {
			// Only trigger for main app
			getLanguage($selectedLanguage.value);
		}
	}

	// Get the view parameter from the page store
	$: isFullscreen = $page.url.searchParams.get('view') === 'fullscreen';

	// Send map height to parent window
	// $: {
	// 	if ($APP_HEIGHT) {
	// 		window.parent.postMessage({ height: $APP_HEIGHT }, '*');
	// 	}
	// }

	$: dropdownLanguages = languageNameTranslations['en'];
	$: $isMobile = innerWidth <= $mobileSize;

	// onMount(async () => {
	// 	await fetchAndTransformGeoData();
	// 	// await getLanguage($selectedLanguage.value);

	// 	if ($mapConfig.translate) {
	// 		translations.set({
	// 			en: $mapConfig.translate // Assuming 'en' is your default language
	// 		});
	// 	}
	// });

	onMount(async () => {
		await fetchAndTransformGeoData();
		const isSubApp = window.location.search.includes('view=fullscreen');

		if (isSubApp) {
			// In sub-app, load translations immediately
			await getLanguage($selectedLanguage?.value || 'en');
		} else {
			// In main app, set initial translations
			if ($mapConfig.translate) {
				translations.set({
					en: $mapConfig.translate
				});
			}
		}
	});

	// Update your getLanguage function
	// In MapPanel.svelte
	async function getLanguage(lang) {
		try {
			shouldUpdateMap.set(false);

			let data;
			const isSubApp = window.location.search.includes('view=fullscreen');
			// console.log('Is sub app:', isSubApp, 'Loading language:', lang);

			if (isSubApp) {
				// In deployed sub-app, load from static files
				data = await loadTranslationFile(lang);
				if (!data) {
					console.warn('No translation file found for language:', lang);
					return;
				}
			} else {
				// In main app, use the store
				data = $translations[lang];
				if (!data) {
					console.warn('No translation data found for language:', lang);
					return;
				}
			}

			// console.log('Loaded translation data:', data);

			// Create the new config object
			const newConfig = {
				...$mapConfig,
				title: data.title || $mapConfig.title || '',
				subtitle: data.subtitle || $mapConfig.subtitle || '',
				textSourceDescription: data.textSourceDescription || $mapConfig.textSourceDescription || '',
				textSource: data.textSource || $mapConfig.textSource || '',
				textNoteDescription: data.textNoteDescription || $mapConfig.textNoteDescription || '',
				textNote: data.textNote || $mapConfig.textNote || '',
				linkDataAccessDescription:
					data.linkDataAccessDescription || $mapConfig.linkDataAccessDescription || '',
				legend1: data.legend1 || $mapConfig.legend1 || '',
				customUnitLabel: data.customUnitLabel || $mapConfig.customUnitLabel || '',
				tooltipExtraInfoLabel: data.tooltipExtraInfoLabel || $mapConfig.tooltipExtraInfoLabel || '',
				translate: {
					title: data.title || $mapConfig.translate?.title || '',
					subtitle: data.subtitle || $mapConfig.translate?.subtitle || '',
					textNoteDescription:
						data.textNoteDescription || $mapConfig.translate?.textNoteDescription || '',
					textNote: data.textNote || $mapConfig.translate?.textNote || '',
					textSourceDescription:
						data.textSourceDescription || $mapConfig.translate?.textSourceDescription || '',
					textSource: data.textSource || $mapConfig.translate?.textSource || '',
					linkDataAccessDescription:
						data.linkDataAccessDescription || $mapConfig.translate?.linkDataAccessDescription || '',
					legend1: data.legend1 || $mapConfig.translate?.legend1 || '',
					tooltipExtraInfoLabel:
						data.tooltipExtraInfoLabel || $mapConfig.translate?.tooltipExtraInfoLabel || ''
				}
			};

			// Extract and add extraInfo entries
			const extraInfoEntries = Object.keys(data).filter((key) => key.startsWith('extraInfo_'));
			extraInfoEntries.forEach((key) => {
				newConfig[key] = data[key] || $mapConfig[key] || '';
				newConfig.translate[key] = data[key] || $mapConfig.translate?.[key] || '';
			});

			// Update the store
			mapConfig.set(newConfig);
			shouldUpdateMap.set(true);

			// Update tooltips
			tooltipEntries = Object.keys(data).filter((item) => item.includes('tooltip'));
			tooltip = tooltipEntries.map((item) => ({
				[item]: data[item],
				label: data[item],
				textCountryClick: data.textCountryClick || ''
			}));

			// Extra Info
			extraInfoTexts = filterAndReduceExtraInfo(data, 'extraInfoText');
			extraInfoLinks = filterAndReduceExtraInfo(data, 'extraInfoLink');
		} catch (error) {
			console.error('Error in getLanguage:', error);
			console.error('Current state:', {
				selectedLanguage: lang,
				mapConfig: $mapConfig,
				isSubApp: window.location.search.includes('view=fullscreen')
			});
			shouldUpdateMap.set(true); // Make sure to reset this even on error
		}
	}

	// Fixed filterAndReduceExtraInfo function
	function filterAndReduceExtraInfo(data, filterTerm) {
		const asArray = Object.entries(data);
		const extraInfoEntries = asArray.filter(([key]) => key.includes(filterTerm));

		return extraInfoEntries.reduce(
			(obj, item) => ({
				...obj,
				[item[0].split('_')[1]]: item[1]
			}),
			{}
		);
	}

	function handleSelect(event) {
		$selectedLanguage = { value: event.detail.value, label: event.detail.label };
		getLanguage($selectedLanguage.value);
	}
</script>

<div class={isFullscreen ? 'relative w-full' : 'relative w-1/2'} style="height: 100%;">
	<div
		id="euranet-map"
		class="relative {isFullscreen ? 'p-0' : 'p-32 pt-12'}"
		bind:clientHeight={$APP_HEIGHT}
		bind:clientWidth={innerWidth}
	>
		<header bind:this={headerRef}>
			<div class="logo">
				<img
					src="./img/logo.png"
					srcset="./img/logo.png 1x, ./img/logo@2x.png 2x"
					alt="Logo EuraNet"
				/>
			</div>
			<div class="select">
				<Select
					items={dropdownLanguages}
					value={$selectedLanguage}
					placeholder="Select a language …"
					noOptionsMessage="No language found"
					on:select={handleSelect}
				/>
			</div>
		</header>

		<div id="chart" class="mt-8">
			<div id="chart-header" bind:this={chartHeaderRef}>
				{#if $mapConfig.title}
					<h1 class="text-xl font-bold">{$mapConfig.title}</h1>
				{/if}
				{#if $mapConfig.subtitle}
					<h3 class="text-md">{$mapConfig.subtitle}</h3>
				{/if}
			</div>

			<div id="chart-body" class="mt-4">
				{#if tooltip}
					<div class="wrapper" style="--text-height: {totalTextHeight}px">
						<MapChoropleth
							mapConfig={$mapConfig}
							{tooltip}
							{extraInfoTexts}
							{extraInfoLinks}
							geoData={transformedGeoData}
						/>
					</div>
				{/if}
			</div>

			<div id="source-notes" class="mt-2 text-xs" bind:this={sourceNotesRef}>
				{#if $mapConfig.textSource}
					<div>
						<span class="font-bold">{$mapConfig.textSourceDescription}: </span>
						<span>{$mapConfig.textSource}</span>
					</div>
				{/if}
				{#if $mapConfig.textNote}
					<div>
						<span class="font-bold">{$mapConfig.textNoteDescription}: </span>
						<span>{$mapConfig.textNote}</span>
					</div>
				{/if}
				{#if $mapConfig.linkDataAccess}
					<div class="underline">
						<a target="_blank" href={$mapConfig.linkDataAccess}
							>{$mapConfig.linkDataAccessDescription}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		text-align: center;
		font-family: Arial, Helvetica, sans-serif;
		color: #2b3163;
	}

	header {
		display: flex;
		align-items: center;
	}

	.logo {
		flex: 1;
	}

	.select {
		flex: 1;
	}

	div {
		text-align: left;
	}

	#euranet-map {
		background: white;
	}

	.wrapper {
		display: block;
		width: 100%;
	}
</style>
