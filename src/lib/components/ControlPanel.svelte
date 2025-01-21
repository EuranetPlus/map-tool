<!-- src/lib/components/ControlPanel.svelte -->
<script>
	import { mapConfig } from '$lib/stores/config-map';
	import { shouldUpdateMap } from '$lib/stores/update-map';
	import { dataReady } from '$lib/stores/shared';
	import { csvParse } from 'd3-dsv';
	import { writable } from 'svelte/store';
	import { translations } from '$lib/stores/translations';

	const shouldInitialize = writable(true);

	// Add at the top of script
	const EU_COUNTRY_CODES = new Set([
		'AT',
		'BE',
		'BG',
		'CY',
		'CZ',
		'DE',
		'DK',
		'EE',
		'EL',
		'ES',
		'FI',
		'FR',
		'HR',
		'HU',
		'IE',
		'IT',
		'LT',
		'LU',
		'LV',
		'MT',
		'NL',
		'PL',
		'PT',
		'RO',
		'SE',
		'SI',
		'SK'
	]);

	let csvError = null;
	let csvWarnings = [];
	const REQUIRED_COLUMNS = ['country', 'id', 'value', 'extraInfo'];
	const CSV_EXAMPLE = `country,id,value,extraInfo
Austria,AT,35,false
Belgium,BE,83,false`;

	const EXAMPLE_DATA = `country,id,value,extraInfo,text_content,link_text,link_url_target,audio_url_1,audio_url_2,audio_url_3,image_url_source,image_url_target,video_url
Austria,AT,0.035,FALSE,,,,,,,,,
Belgium,BE,0.083,FALSE,,,,,,,,,
Bulgaria,BG,-0.108,FALSE,,,,,,,,,
Cyprus,CY,0.157,FALSE,,,,,,,,,
Czechia,CZ,-0.002,FALSE,,,,,,,,,
Germany,DE,-0.040,true,"Germany Accelerates Renewable Energy Rollout, Targets 80% Clean Power by 2030",Read more,https://www.nytimes.com/2025/01/15/us/politics/trump-biden-gaza-ceasefire.html,https://open.spotify.com/embed/episode/37AK0KI06D6027Pwv96Bvk?utm_source=generator,,,https://euranetplus-inside.eu/wp-content/uploads/2022/05/2-kuku.png,https://www.100komma7.lu/article/aktualiteit/49-propose-mat-326-mesuren-fir-eng-besser-eu,https://www.youtube.com/embed/asWW2pvhaJQ
Denmark,DK,0.036,FALSE,,,,,,,,,
Estonia,EE,0.047,FALSE,,,,,,,,,
Greece,EL,0.006,FALSE,,,,,,,,,
Spain,ES,0.132,FALSE,,,,,,,,,
Finland,FI,0.069,FALSE,,,,,,,,,
France,FR,0.045,true,French Parliament Approves Major Immigration Reform Bill Amid Nationwide Protests,Link to article,,,,,,,
Croatia,HR,0.000,FALSE,,,,,,,,,
Hungary,HU,-0.019,FALSE,,,,,,,,,
Ireland,IE,0.243,FALSE,,,,,,,,,
Italy,IT,0.026,FALSE,,,,,,,,,
Lithuania,LT,-0.072,FALSE,,,,,,,,,
Luxembourg,LU,0.239,FALSE,,,,,,,,,
Latvia,LV,0.013,FALSE,,,,,,,,,
Malta,MT,0.245,FALSE,,,,,,,,,
Netherlands,NL,-0.001,FALSE,,,,,,,,,
Poland,PL,0.027,FALSE,,,,,,,,,
Portugal,PT,-0.004,FALSE,,,,,,,,,
Romania,RO,0.090,FALSE,,,,,,,,,
Sweden,SE,0.202,FALSE,,,,,,,,,
Slovenia,SI,-0.020,FALSE,,,,,,,,,
Slovakia,SK,0.066,FALSE,,,,,,,,,`;

	// Replace the current colorSchemes declaration with this:
	const colorSchemeTypes = ['sequential', 'diverging'];
	const colorSchemes = {
		sequential: [
			'blue',
			'green',
			'gray',
			'orange',
			'purple',
			'red',
			'blue-green',
			'blue-purple',
			'green-blue',
			'orange-red',
			'purple-blue-green',
			'purple-blue',
			'purple-blue-darker',
			'purple-red',
			'red-purple',
			'yellow-green-blue',
			'yellow-green',
			'yellow-orange-brown',
			'yellow-orange-red'
		],
		diverging: [
			'brown-blue-green',
			'purple-green',
			'pink-yellow-green',
			'purple-orange',
			'red-blue',
			'red-gray',
			'red-yellow-blue',
			'red-yellow-green',
			'spectral'
		]
	};

	let title = $mapConfig.title;
	let subtitle = $mapConfig.subtitle;
	let data = $mapConfig.data;
	let datasetType = $mapConfig.datasetType;
	let datasetUnit = $mapConfig.datasetUnit;
	let percentRounded = $mapConfig.percentRounded;
	let colourSchemeType = $mapConfig.colourSchemeType;
	let colourScheme = $mapConfig.colourScheme;
	let colourSchemeReverse = $mapConfig.colourSchemeReverse;
	let colourSchemeClasses = $mapConfig.colourSchemeClasses;
	let headlineAvailable = $mapConfig.headlineAvailable;
	let subheadlineAvailable = $mapConfig.subheadlineAvailable;
	let tooltipAvailable = $mapConfig.tooltipAvailable;
	let scaleBarAvailable = $mapConfig.scaleBarAvailable;
	let overrideScaleValues = $mapConfig.overrideScaleValues;
	let legendAvailable = $mapConfig.legendAvailable;
	let textSourceAvailable = $mapConfig.textSourceAvailable;
	let textSourceDescription = $mapConfig.textSourceDescription;
	let textSource = $mapConfig.textSource;
	let textNoteAvailable = $mapConfig.textNoteAvailable;
	let textNoteDescription = $mapConfig.textNoteDescription;
	let textNote = $mapConfig.textNote;
	let textDataAccessAvailable = $mapConfig.textDataAccessAvailable;
	let linkDataAccessDescription = $mapConfig.linkDataAccessDescription;
	let linkDataAccess = $mapConfig.linkDataAccess;
	let legend1 = $mapConfig.legend1;
	let legend1Color = $mapConfig.legend1Color;
	let colorBarFirstValue = $mapConfig.colorBarFirstValue;
	let colorBarLastValue = $mapConfig.colorBarLastValue;
	let parsedData = $mapConfig.parsedData;
	let customUnitLabelAvailable = $mapConfig.customUnitLabelAvailable;
	let customUnitLabel = $mapConfig.customUnitLabel;
	let tooltipExtraInfoLabel = $mapConfig.tooltipExtraInfoLabel;

	$: configObject =
		$shouldUpdateMap && $shouldInitialize
			? {
					title: title,
					subtitle: subtitle,
					colourSchemeClasses: colourSchemeClasses,
					data: data,
					parsedData: data?.trim() ? parsedData || $mapConfig.parsedData : null,
					datasetType: datasetType,
					datasetUnit: datasetUnit,
					percentRounded: percentRounded,
					colourSchemeType: colourSchemeType,
					colourScheme: colourScheme,
					colourSchemeReverse: colourSchemeReverse,
					colourSchemeClasses: colourSchemeClasses,
					headlineAvailable: headlineAvailable,
					subheadlineAvailable: subheadlineAvailable,
					tooltipAvailable: tooltipAvailable,
					scaleBarAvailable: scaleBarAvailable,
					overrideScaleValues: overrideScaleValues,
					legendAvailable: legendAvailable,
					textSourceAvailable: textSourceAvailable,
					textSourceDescription: textSourceDescription,
					textSource: textSource,
					textNoteAvailable: textNoteAvailable,
					textNoteDescription: textNoteDescription,
					textNote: textNote,
					textDataAccessAvailable: textDataAccessAvailable,
					linkDataAccessDescription: linkDataAccessDescription,
					linkDataAccess: linkDataAccess,
					legend1: legend1,
					legend1Color: legend1Color,
					colorBarFirstValue: colorBarFirstValue,
					colorBarLastValue: colorBarLastValue,
					customUnitLabelAvailable: customUnitLabelAvailable,
					customUnitLabel: customUnitLabel,
					tooltipExtraInfoLabel: tooltipExtraInfoLabel,
					translate: {
						title,
						subtitle,
						textNoteDescription,
						textNote,
						textSourceDescription,
						textSource,
						linkDataAccessDescription,
						legend1,
						tooltipExtraInfoLabel,
						customUnitLabel,
						...$mapConfig.parsedData?.reduce((acc, country) => {
							if (country.text_content) {
								acc[`extraInfo_${country.id}`] = country.text_content;
							}
							return acc;
						}, {})
					}
				}
			: null;

	$: if (configObject !== null) {
		// console.log('configObject before store update:', configObject);

		mapConfig.set(configObject);
		// console.log('mapConfig after update:', $mapConfig);

		// console.log('mapConfig-start', $mapConfig);
		shouldInitialize.set(false);
	}

	$: data && handleCSVChange(data);

	function handleCSVChange(csvText) {
		csvError = null;
		csvWarnings = [];

		if (!csvText?.trim()) {
			updateStoreProperty('parsedData', null);
			updateStoreProperty('clusters', []);
			updateStoreProperty('colorScale', null);
			return;
		}

		try {
			const parsed = csvParse(csvText);

			// Check for required columns
			const missingColumns = REQUIRED_COLUMNS.filter((col) => !parsed.columns.includes(col));
			if (missingColumns.length > 0) {
				csvError = `Missing required columns: ${missingColumns.join(', ')}`;
				mapConfig.update((m) => ({ ...m, parsedData: null })); // Reset map data
				return;
			}

			// Rest of your existing validation code...
			const seenIds = new Set();

			// Validate data types and handle empty values
			const validatedData = parsed.map((d, index) => {
				const rowNum = index + 1;

				// Your existing validation code...
				Object.keys(d).forEach((key) => {
					if (typeof d[key] === 'string') {
						d[key] = d[key].trim();
					}
				});

				// All your existing validations...
				if (!d.country) {
					throw new Error(`Row ${rowNum}: Missing country name`);
				}

				if (!/^[a-zA-Z\s-]+$/.test(d.country)) {
					throw new Error(`Row ${rowNum}: Country name contains invalid characters`);
				}

				if (!d.id) {
					throw new Error(`Row ${rowNum}: Missing ID`);
				}

				if (!EU_COUNTRY_CODES.has(d.id)) {
					throw new Error(
						`Row ${rowNum}: Invalid country code "${d.id}". Must be a valid EU country code.`
					);
				}

				if (seenIds.has(d.id)) {
					throw new Error(`Row ${rowNum}: Duplicate country code "${d.id}"`);
				}
				seenIds.add(d.id);

				if (d.value !== 'null' && d.value !== '') {
					const numValue = +d.value;
					if (isNaN(numValue)) {
						throw new Error(
							`Row ${rowNum}: Invalid value "${d.value}" - must be a number or "null"`
						);
					}
				}

				const extraInfo = d.extraInfo.toLowerCase();
				if (!['true', 'false', ''].includes(extraInfo)) {
					throw new Error(`Row ${rowNum}: extraInfo must be "true" or "false"`);
				}

				return {
					...d,
					value: d.value === 'null' || d.value === '' ? null : +d.value,
					extraInfo: extraInfo === 'true'
				};
			});

			// Check for missing EU countries
			const includedCountries = new Set(validatedData.map((d) => d.id));
			const missingEUCountries = [...EU_COUNTRY_CODES].filter(
				(code) => !includedCountries.has(code)
			);
			if (missingEUCountries.length > 0) {
				csvWarnings.push(`Missing data for countries: ${missingEUCountries.join(', ')}`);
			}

			// After validation succeeds, update with the new data
			updateStoreProperty('parsedData', validatedData);
			updateStoreProperty('clusters', []);
			updateStoreProperty('colorScale', null);
			updateStoreProperty('translate', {
				title,
				subtitle,
				textNoteDescription,
				textNote,
				textSourceDescription,
				textSource,
				linkDataAccessDescription,
				...validatedData.reduce((acc, country) => {
					if (country.text_content) {
						acc[`extraInfo_${country.id}`] = country.text_content;
					}
					return acc;
				}, {})
			});
		} catch (error) {
			csvError = `Error parsing CSV: ${error.message}`;
			updateStoreProperty('parsedData', null);
		}
	}

	// Update color order handler to use updateStoreProperty
	function handleColorOrderChange(value) {
		updateStoreProperty('colourSchemeReverse', value);
	}

	// Function to handle checkbox changes
	function handleCheckboxChange(property, checked) {
		updateStoreProperty(property, checked);
	}

	// Function to handle select changes
	function handleSelectChange(property, value) {
		updateStoreProperty(property, value);
	}

	// Function to handle number input changes
	function handleNumberChange(property, value) {
		updateStoreProperty(property, Number(value));
	}

	let translationLoading = false;
	let translationError = null;
	let translatedLanguages = [];
	let totalLanguages = 24; // Total number of languages

	// Then modify your triggerTranslations function
	async function triggerTranslations() {
		translationLoading = true;
		translationError = null;
		translatedLanguages = [];

		try {
			const sourceData = {
				...$mapConfig.translate,
				title: $mapConfig.title,
				subtitle: $mapConfig.subtitle,
				textSourceDescription: $mapConfig.textSourceDescription,
				textSource: $mapConfig.textSource,
				textNoteDescription: $mapConfig.textNoteDescription,
				textNote: $mapConfig.textNote,
				linkDataAccessDescription: $mapConfig.linkDataAccessDescription,
				legend1: $mapConfig.legend1,
				customUnitLabel: $mapConfig.customUnitLabel,
				tooltipExtraInfoLabel: 'Click here'
			};

			let batchIndex = 0;
			let hasMore = true;
			let allTranslations = {};

			while (hasMore) {
				const response = await fetch('/api/translate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						sourceObject: sourceData,
						batchIndex
					})
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (!data.success) {
					throw new Error(data.error || 'Translation failed');
				}

				// Update progress
				if (data.completedLanguages) {
					translatedLanguages = [...new Set([...translatedLanguages, ...data.completedLanguages])];
				}

				// Merge translations
				allTranslations = { ...allTranslations, ...data.translations };

				// Update the translations store with accumulated translations
				translations.set(allTranslations);

				// Handle completion
				if (data.type === 'complete') {
					hasMore = false;
					translationError =
						data.errors?.length > 0
							? {
									type: 'warning',
									message: data.message,
									details: data.errors
								}
							: {
									type: 'success',
									message: data.message
								};
				} else {
					hasMore = data.hasMore;
					batchIndex++;
				}
			}
		} catch (error) {
			console.error('Error triggering translations:', error);
			translationError = {
				type: 'error',
				message: error.message,
				details: error.details
			};
		} finally {
			translationLoading = false;
		}
	}

	// Create a function that handles updates for all text-related properties
	function updateStoreProperty(property, value) {
		mapConfig.update((curr) => {
			// Special handling for headline and subheadline availability
			const updates = {
				...curr,
				[property]: value
			};

			// If toggling headline/subheadline off, clear the related text
			if (property === 'headlineAvailable' && !value) {
				updates.title = '';
			}
			if (property === 'subheadlineAvailable' && !value) {
				updates.subtitle = '';
			}

			return {
				...updates
				// translate: {
				// 	...curr.translate,
				// 	...updates // This will include any cleared title/subtitle
				// }
			};
		});
	}
</script>

<div class="space-y-4 rounded-lg bg-white p-6 text-left shadow-sm">
	<!-- Basic Settings -->
	<div class="space-y-2">
		<label for="title">Title</label>
		<input
			id="title"
			name="title"
			bind:value={title}
			on:input={(e) => updateStoreProperty('title', e.target.value)}
			placeholder="Enter map title"
			class="w-full rounded border p-2"
		/>
	</div>

	<div class="space-y-2">
		<label for="subtitle">Subtitle</label>
		<input
			id="subtitle"
			name="subtitle"
			bind:value={subtitle}
			on:input={(e) => updateStoreProperty('subtitle', e.target.value)}
			placeholder="Enter subtitle"
			class="w-full rounded border p-2"
		/>
	</div>

	<div class="space-y-2">
		<label for="data">Data (CSV)</label>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<textarea
			id="data"
			name="data"
			bind:value={data}
			on:input={(e) => {
				updateStoreProperty('data', e.target.value);
				handleCSVChange(e.target.value);
			}}
			class="h-32 w-full rounded border p-2 {csvError
				? 'border-red-500'
				: csvWarnings.length
					? 'border-yellow-500'
					: ''}"
			placeholder="Paste CSV data here"
		/>
		<button
			on:click={() => (data = EXAMPLE_DATA)}
			class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
			type="button"
		>
			Load Example Data
		</button>
		{#if csvError}
			<div class="mt-1 text-sm text-red-600">
				<p>{csvError}</p>
			</div>
		{/if}
		{#if csvWarnings.length > 0}
			<div class="mt-1 text-sm text-yellow-600">
				{#each csvWarnings as warning}
					<p>⚠️ {warning}</p>
				{/each}
			</div>
		{/if}
		<div class="mt-1 text-xs text-gray-500">
			<p>Required columns: {REQUIRED_COLUMNS.join(', ')}</p>
			<details class="mt-1">
				<summary class="cursor-pointer">Show format example</summary>
				<pre class="mt-2 rounded bg-gray-100 p-2">{CSV_EXAMPLE}</pre>
			</details>
		</div>
	</div>

	<div class="space-y-2">
		<label for="source">Data Source</label>
		<input
			id="textSource"
			name="textSource"
			bind:value={textSource}
			on:input={(e) => updateStoreProperty('textSource', e.target.value)}
			placeholder="Enter source"
			class="w-full rounded border p-2"
		/>
	</div>

	<div class="space-y-2">
		<label for="note">Note</label>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<textarea
			id="note"
			name="note"
			bind:value={textNote}
			on:input={(e) => updateStoreProperty('textNote', e.target.value)}
			class="h-16 w-full rounded border p-2"
			placeholder="Enter text note"
		/>
	</div>

	<div class="space-y-2">
		<label for="data-link">Link to data</label>
		<input
			id="data-link"
			name="data-link"
			bind:value={linkDataAccess}
			on:input={(e) => updateStoreProperty('linkDataAccess', e.target.value)}
			placeholder="Enter link to data set"
			class="w-full rounded border p-2"
		/>
	</div>

	<!-- Map Configuration -->
	<div class="space-y-4 border-t pt-4">
		<h3 class="font-bold">Map Configuration</h3>

		<div class="space-y-2">
			<label for="datasetType">Dataset Type</label>
			<select
				id="datasetType"
				bind:value={datasetType}
				on:change={(e) => handleSelectChange('datasetType', e.target.value)}
				class="w-full rounded border p-2"
			>
				<option value="values">Values</option>
				<option value="binary">Binary</option>
			</select>
		</div>

		<div class="space-y-2">
			<label for="datasetUnit">Unit</label>
			<select
				id="datasetUnit"
				bind:value={datasetUnit}
				on:change={(e) => handleSelectChange('datasetUnit', e.target.value)}
				class="w-full rounded border p-2"
				disabled={datasetType === 'binary'}
			>
				<option value="fullNumbers">Full Numbers</option>
				<option value="percent">Percentage</option>
			</select>
		</div>

		{#if datasetUnit === 'percent'}
			<div class="space-y-2">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={percentRounded}
						on:change={(e) => updateStoreProperty('percentRounded', e.target.checked)}
						class="mr-2"
					/>
					Round Percentages (to nearest whole number)
				</label>
			</div>
		{/if}

		<div class="space-y-2">
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={customUnitLabelAvailable}
					on:change={(e) => updateStoreProperty('customUnitLabelAvailable', e.target.checked)}
					class="mr-2"
				/>
				Custom Tooltip Label
			</label>
		</div>

		{#if customUnitLabelAvailable}
			<div class="space-y-2">
				<input
					id="data-link"
					name="data-link"
					bind:value={customUnitLabel}
					on:input={(e) => updateStoreProperty('customUnitLabel', e.target.value)}
					placeholder="e.g. of GDP"
					class="w-full rounded border p-2"
				/>
			</div>
		{/if}

		{#if datasetType === 'values'}
			<div class="space-y-2">
				<label for="colorSchemeType">Color Scheme Type</label>
				<select
					id="colorSchemeType"
					bind:value={colourSchemeType}
					on:change={(e) => updateStoreProperty('colourSchemeType', e.target.value)}
					class="w-full rounded border p-2"
				>
					{#each colorSchemeTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<select
					id="colorScheme"
					bind:value={colourScheme}
					on:change={(e) => updateStoreProperty('colourScheme', e.target.value)}
					class="w-full rounded border p-2"
				>
					{#each colorSchemes[colourSchemeType] as scheme}
						<option value={scheme}>{scheme}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<label>Color Scheme Order</label>
				<div class="flex gap-4">
					<label class="flex items-center">
						<input
							type="radio"
							name="colorOrder"
							checked={!colourSchemeReverse}
							on:change={() => handleColorOrderChange(false)}
							class="mr-2"
						/>
						Normal
					</label>
					<label class="flex items-center">
						<input
							type="radio"
							name="colorOrder"
							checked={colourSchemeReverse}
							on:change={() => handleColorOrderChange(true)}
							class="mr-2"
						/>
						Reversed
					</label>
				</div>
			</div>

			<div class="space-y-2">
				<label for="colorClasses">Color Classes</label>
				<input
					id="colorClasses"
					type="number"
					min="3"
					max="9"
					bind:value={colourSchemeClasses}
					on:input={(e) => updateStoreProperty('colourSchemeClasses', Number(e.target.value))}
					class="w-full rounded border p-2"
				/>
			</div>
		{/if}
	</div>

	<!-- Display Options -->
	<div class="space-y-4 border-t pt-4">
		<h3 class="font-bold">Display Options</h3>

		<div class="space-y-2">
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={tooltipAvailable}
					on:change={(e) => handleCheckboxChange('tooltipAvailable', e.target.checked)}
					class="mr-2"
				/>
				Show Tooltips
			</label>
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={legendAvailable}
					on:change={(e) => handleCheckboxChange('legendAvailable', e.target.checked)}
					class="mr-2"
				/>
				Show Legend
			</label>
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={scaleBarAvailable}
					on:change={(e) => handleCheckboxChange('scaleBarAvailable', e.target.checked)}
					class="mr-2"
				/>
				Show Scale Bar
			</label>
		</div>

		{#if datasetType === 'values' && scaleBarAvailable}
			<div class="space-y-4 border-t pt-4">
				<h3 class="font-bold">Scale Bar Values</h3>
				<div class="space-y-2">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={overrideScaleValues}
							on:change={(e) => handleCheckboxChange('overrideScaleValues', e.target.checked)}
							class="mr-2"
						/>
						Override Scale Bar Values
					</label>

					{#if overrideScaleValues}
						<div class="mt-2 space-y-2">
							<label for="colorBarFirstValue">First Value</label>
							<input
								id="colorBarFirstValue"
								type="number"
								bind:value={colorBarFirstValue}
								on:input={(e) => updateStoreProperty('colorBarFirstValue', e.target.value)}
								class="w-full rounded border p-2"
							/>
						</div>
						<div class="space-y-2">
							<label for="colorBarLastValue">Last Value</label>
							<input
								id="colorBarLastValue"
								type="number"
								bind:value={colorBarLastValue}
								on:input={(e) => updateStoreProperty('colorBarLastValue', e.target.value)}
								class="w-full rounded border p-2"
							/>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<!-- New Translation section -->
	<div class="space-y-4 border-t pt-4">
		<h3 class="font-bold">Translations</h3>
		<div class="space-y-2">
			<button
				on:click={triggerTranslations}
				class="w-full rounded px-4 py-2 text-white transition-colors {translationLoading
					? 'cursor-not-allowed bg-gray-400'
					: 'bg-blue-600 hover:bg-blue-700'}"
				type="button"
				disabled={translationLoading}
			>
				{#if translationLoading}
					<span class="inline-flex items-center">
						<svg class="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
						Generating translations...
					</span>
				{:else}
					Translate all texts
				{/if}
			</button>

			{#if translationLoading || translatedLanguages.length > 0}
				<div class="mt-4 space-y-2">
					<div class="flex justify-between text-sm text-gray-600">
						<span>Translation Progress</span>
						<span>{translatedLanguages.length} / {totalLanguages}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full bg-blue-600 transition-all duration-500"
							style="width: {(translatedLanguages.length / totalLanguages) * 100}%"
						></div>
					</div>
					<div class="max-h-40 space-y-1 overflow-y-auto text-sm">
						{#each translatedLanguages as lang}
							<div class="flex items-center text-green-600">
								<svg class="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
								{lang}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if translationError}
				<div
					class="mt-2 rounded p-3 {translationError.type === 'success'
						? 'bg-green-100 text-green-700'
						: translationError.type === 'warning'
							? 'bg-yellow-100 text-yellow-700'
							: 'bg-red-100 text-red-700'}"
				>
					<p class="font-medium">{translationError.message}</p>
					{#if translationError.details}
						<div class="mt-2 max-h-32 overflow-y-auto text-sm">
							{#each translationError.details as detail}
								<p>• {detail}</p>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
