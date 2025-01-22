<script>
	import { MOUSE } from '$lib/stores/shared';
	import { onMount } from 'svelte';
	import { CENTER_ON } from '$lib/stores/shared';
	import { csvData } from '$lib/stores/shared';
	import { feature } from 'topojson-client';
	import { geoPath, geoIdentity } from 'd3-geo';
	import { dataReady } from '$lib/stores/shared';
	import { MAP_WIDTH } from '$lib/stores/shared';
	import { selectedLanguage } from '$lib/stores/shared';
	import { countryNameTranslations } from '$lib/stores/countries';
	import { countryInfoVisible } from '$lib/stores/shared';
	import { selectedCountry } from '$lib/stores/shared';
	import { isMobile } from '$lib/stores/shared';

	import { csv } from 'd3-fetch';
	import { extent } from 'd3-array';
	import { min, max } from 'd3-array';

	import { scaleQuantile } from 'd3-scale';
	import {
		// sequential
		schemeBlues, // blue
		schemeGreens, // green
		schemeGreys, // gray
		schemeOranges, // orange
		schemePurples, // purple
		schemeReds, // red
		schemeBuGn, // blue-green
		schemeBuPu, // blue-purple
		schemeGnBu, // green-blue
		schemeOrRd, // orange-red
		schemePuBuGn, // purple-blue-green
		schemePuBu, // purple-blue
		schemePuRd, //purple-red
		schemeRdPu, // red-purple
		schemeYlGnBu, // yellow-green-blue
		schemeYlGn, // yellow-green
		schemeYlOrBr, // yellow-orange-brown
		schemeYlOrRd, // yellow-orange-red
		// diverging
		schemeBrBG, // brown-bluegreen
		schemePRGn, // purple-green
		schemePiYG, // pink-yellowgreen
		schemePuOr, // purple-orange
		schemeRdBu, // red-blue
		schemeRdGy, // red-gray
		schemeRdYlBu, // red-yellow-blue
		schemeRdYlGn, // red-yellow-green
		schemeSpectral // spectral
	} from 'd3-scale-chromatic';

	import { PuBlueDarker } from '$lib/utils/customColorPalettes';
	import { formatInt } from '$lib/utils/formatNumbers';

	import Scale from './Scale.svelte';
	import Legend from './Legend.svelte';
	import CountryInfo from './CountryInfo.svelte';

	// Make square dimensions i.e. 600x600 to fill all space
	let width = 600;
	let height = 600;
	let paddingMap = -85;
	let center;
	let scaleMin, scaleMax;

	export let legend;
	export let tooltip;
	export let extraInfoTexts;
	export let extraInfoLinks;
	export let mapConfig;

	$: countryNames = countryNameTranslations[$selectedLanguage.value];

	$: selectedCountryNameTranslated = countryNames.filter((item) => {
		if ($selectedCountry != undefined) {
			return item.id == $selectedCountry.properties.id;
		} else {
			return {};
		}
	})[0].na;

	let selectedCountryExtraInfoTextTranslated;
	let selectedCountryExtraInfoLinkTranslated;

	$: if ($selectedCountry) {
		selectedCountryExtraInfoTextTranslated = extraInfoTexts[$selectedCountry.properties.id];
		selectedCountryExtraInfoLinkTranslated = extraInfoLinks[$selectedCountry.properties.id];
		// console.log(selectedCountryExtraInfoTextTranslated);
	} else {
		selectedCountryExtraInfoTextTranslated = undefined;
		selectedCountryExtraInfoLinkTranslated = undefined;
	}

	let tooltipVisible = false;
	let tooltipHeight;
	let tooltipWidth;

	let graticules = null;
	let countriesAll = null;
	let countriesWithCsvImport;
	let countriesWithExtraInfo;
	let hoveredCountry;

	// Add reactive statement for parsedData
	// $: if (mapConfig.parsedData && countriesAll) {
	// 	mergeData();
	// }

	$: if (countriesAll) {
		// Only check for countriesAll
		if (mapConfig.parsedData) {
			mergeData();
		} else {
			// Clear the data when parsedData is null
			countriesAll.features.forEach((item) => (item.csvImport = null));
			countriesWithCsvImport = [];
			countriesWithExtraInfo = { type: 'FeatureCollection', features: [] };
		}
	}

	$: if ($CENTER_ON === 'europe') {
		paddingMap = -85;
		center = countriesAll;
	}

	$: tooltipPositionX = $MOUSE.x < $MAP_WIDTH / 2 ? $MOUSE.x : $MOUSE.x - tooltipWidth;

	const projection = geoIdentity().reflectY(true);
	const path = geoPath().projection(projection);
	let colorScale = scaleQuantile();
	let colorScheme;
	let clusters;

	// Set up color scale based on dataset type
	$: if (mapConfig.datasetType == 'values') {
		colorScale = scaleQuantile();
	} else if (mapConfig.datasetType == 'binary') {
		colorScale = function (value) {
			return value == 1 ? '#2B3163' : '#F4F4F4';
		};
	}

	// Reactive declarations for color scheme
	$: colorScaleType = mapConfig.colourSchemeType;
	$: n = mapConfig.colourSchemeClasses;

	// Validate and select color scheme based on config
	$: colorScheme =
		colorScaleType !== 'unknown' &&
		colorSchemeMap[colorScaleType] &&
		colorSchemeMap[colorScaleType][mapConfig.colourScheme]
			? mapConfig.colourSchemeReverse
				? [...colorSchemeMap[colorScaleType][mapConfig.colourScheme]].reverse()
				: colorSchemeMap[colorScaleType][mapConfig.colourScheme]
			: colorSchemeMap['sequential'].red;

	// Calculate data extent for colorScale
	$: extentArray = mapConfig?.parsedData
		? mapConfig.parsedData
				.map((item) => item?.value)
				.filter((value) => value != null && !isNaN(+value))
		: [];

	// Update color scale and related values
	$: {
		if (extentArray.length === 0) {
			// console.warn('No valid data values found in extentArray.');
			clusters = [];
		} else if (mapConfig.datasetType === 'values' && colorScheme) {
			colorScale.domain(extent(extentArray)).range(colorScheme);
			// console.log('extentArray', extentArray);
			clusters = colorScale.quantiles();
			scaleMin = min(extentArray);
			scaleMax = max(extentArray);
		}
	}

	// $: console.log('mapConfig', mapConfig);

	$: mapConfig.parsedData && mergeData();

	// Color scheme map, with a fallback for missing classes (fallback to 5 classes)
	$: colorSchemeMap = {
		sequential: {
			blue: schemeBlues[n] || schemeBlues[5], // Fallback to 5 classes if 'n' is out of range
			green: schemeGreens[n] || schemeGreens[5],
			gray: schemeGreys[n] || schemeGreys[5],
			orange: schemeOranges[n] || schemeOranges[5],
			purple: schemePurples[n] || schemePurples[5],
			red: schemeReds[n] || schemeReds[5],
			'blue-green': schemeBuGn[n] || schemeBuGn[5],
			'blue-purple': schemeBuPu[n] || schemeBuPu[5],
			'green-blue': schemeGnBu[n] || schemeGnBu[5],
			'orange-red': schemeOrRd[n] || schemeOrRd[5],
			'purple-blue-green': schemePuBuGn[n] || schemePuBuGn[5],
			'purple-blue': schemePuBu[n] || schemePuBu[5],
			'purple-blue-darker': PuBlueDarker, // Fallback already set
			'purple-red': schemePuRd[n] || schemePuRd[5],
			'red-purple': schemeRdPu[n] || schemeRdPu[5],
			'yellow-green-blue': schemeYlGnBu[n] || schemeYlGnBu[5],
			'yellow-green': schemeYlGn[n] || schemeYlGn[5],
			'yellow-orange-brown': schemeYlOrBr[n] || schemeYlOrBr[5],
			'yellow-orange-red': schemeYlOrRd[n] || schemeYlOrRd[5]
		},
		diverging: {
			'brown-blue-green': schemeBrBG[n] || schemeBrBG[5],
			'purple-green': schemePRGn[n] || schemePRGn[5],
			'pink-yellow-green': schemePiYG[n] || schemePiYG[5],
			'purple-orange': schemePuOr[n] || schemePuOr[5],
			'red-blue': schemeRdBu[n] || schemeRdBu[5],
			'red-gray': schemeRdGy[n] || schemeRdGy[5],
			'red-yellow-blue': schemeRdYlBu[n] || schemeRdYlBu[5],
			'red-yellow-green': schemeRdYlGn[n] || schemeRdYlGn[5],
			spectral: schemeSpectral[n] || schemeSpectral[5]
		}
	};

	const padding = -85;

	$: if ($dataReady) {
		projection.fitExtent(
			[
				[paddingMap, paddingMap],
				[width - paddingMap, height - paddingMap]
			],
			center
		);
	}

	async function fetchGeoData() {
		try {
			const response = await fetch(`/data/geodata/europe-20m.json`);
			const data = await response.json();

			// Set the data first
			countriesAll = feature(data, data.objects.cntrg);
			graticules = feature(data, data.objects.gra);

			// Then set up projection
			projection.fitExtent(
				[
					[paddingMap, paddingMap],
					[width - paddingMap, height - paddingMap]
				],
				countriesAll
			);

			// Only set dataReady after everything is initialized
			$dataReady = true;
			// console.log('Geo data loaded:', { countriesAll, graticules });
		} catch (error) {
			console.error('Error loading geo data:', error);
		}
	}

	function mergeData() {
		if (!mapConfig.parsedData || !countriesAll) return;

		if (!mapConfig.parsedData) {
			countriesAll.features.forEach((item) => (item.csvImport = null));
			countriesWithCsvImport = [];
			countriesWithExtraInfo = { type: 'FeatureCollection', features: [] };
			return;
		}

		const csvTransformed = mapConfig.parsedData.reduce(
			(obj, item) => ({
				...obj,
				[item.id]: {
					value: item.value,
					extraInfo: item.extraInfo,
					contentText: item.text_content,
					linkText: item.link_text,
					linkURL: item.link_url_target,
					audioURL1: item.audio_url_1,
					audioURL2: item.audio_url_2,
					audioURL3: item.audio_url_3,
					imageSourceURL: item.image_url_source,
					imageTargetURL: item.image_url_target,
					videoURL: item.video_url
				}
			}),
			{}
		);

		// Reset and update all countries
		countriesAll.features.forEach((item) => {
			item.csvImport = Object.keys(csvTransformed).includes(item.properties.id)
				? csvTransformed[item.properties.id]
				: null;
		});

		countriesWithCsvImport = countriesAll.features.filter((item) => item.csvImport);

		countriesWithExtraInfo = {
			type: 'FeatureCollection',
			features: countriesWithCsvImport.filter((item) => item.csvImport.extraInfo)
		};
	}

	onMount(async () => {
		await fetchGeoData();
		// await mergeData();
	});

	function getFill(feature) {
		// If no parsed data, or empty data, return light gray
		if (!mapConfig.parsedData || mapConfig.parsedData.length === 0) {
			return '#E5E7EB';
		}

		let csvData = feature.csvImport;
		// console.log(feature);

		// For binary data type
		if (mapConfig.datasetType === 'binary') {
			return csvData?.value ? '#2B3163' : '#F4F4F4';
		}

		// For values data type
		if (csvData) {
			if (csvData.value !== undefined && csvData.value !== null) {
				const color = colorScale(csvData.value);
				// console.log('color', color);
				return color;
			}
			return '#CAD1D9'; // For null values
		}

		return '#E0E0E0'; // For countries without data
	}

	function getStroke(feature) {
		// Always show strokes, even when no data
		if (!mapConfig.parsedData || mapConfig.parsedData.length === 0) {
			return '#cdcdcd'; // Default stroke color
		}

		let csvData = feature.csvImport;

		if (csvData) {
			if (csvData.value !== undefined) {
				if (csvData.value !== null) {
					if (csvData.extraInfo) {
						// return 'orange';
					} else {
						return '#cdcdcd';
					}
					return 'white';
				}
			}
		}
		return '#cdcdcd';
	}

	function getClass(feature) {
		// If no data, make all paths non-interactive
		if (!mapConfig.parsedData || mapConfig.parsedData.length === 0) {
			return 'noPointer';
		}

		let csvData = feature.csvImport;

		if (csvData) {
			if (csvData.value) {
				return 'pointer';
			} else {
				return 'noPointer';
			}
		}
		return 'noPointer';
	}

	function handleMouseMove(e) {
		let divOffset = offset(e.currentTarget);

		let mouseX = e.pageX - divOffset.left;
		let mouseY = e.pageY - divOffset.top;
		// console.log(mouseX);

		if (hoveredCountry) {
			// console.log(hoveredCountry);
			MOUSE.set({
				x: mouseX,
				y: mouseY,
				tooltip: {
					name: hoveredCountry.name,
					value: hoveredCountry.value,
					valuePercent: hoveredCountry.valuePercent,
					extraInfo: hoveredCountry.extraInfo
				}
			});
		}

		// Calculate the position of the map div in the page to get mouse position
		function offset(el) {
			let rect = el.getBoundingClientRect(),
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
				scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
		}
	}

	$: handleMouseEnter = function (country) {
		if (mapConfig.tooltipAvailable) {
			let countryName = countryNames.filter((c) => {
				return c.id == country.properties.id;
			})[0].na;

			// set hoveredCountry only if csvImport object is present in data
			if (country.csvImport) {
				tooltipVisible = true;

				hoveredCountry = {
					name: countryName,
					value: country.csvImport.value,
					extraInfo: country.csvImport.extraInfo
				};
			} else {
				tooltipVisible = false;

				hoveredCountry = {};
			}
		}
	};

	$: handleMouseLeave = function (country) {
		if (mapConfig.tooltipAvailable) {
			tooltipVisible = false;
		}
	};

	function handleMouseClick(country) {
		if (country.csvImport.extraInfo) {
			$countryInfoVisible = true;
			$selectedCountry = country;

			// on mobile close tooltip when clicked on country with extra info
			if ($isMobile) {
				tooltipVisible = false;
			}
		}
	}

	$: handleTouchStart = function (country) {
		handleMouseEnter(country);
		handleMouseClick(country);
	};

	// $: console.log('$MOUSE', $MOUSE);
	// $: console.log('mapConfig', mapConfig);
</script>

{#if $dataReady && countriesAll && countriesAll.features}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div id="map" class="relative" on:mousemove={handleMouseMove} bind:clientHeight={$MAP_WIDTH}>
		{#if mapConfig.datasetType == 'values'}
			{#if mapConfig.scaleBarAvailable && mapConfig.parsedData && mapConfig.parsedData.length > 0}
				<Scale classes={colorScheme} {clusters} {scaleMin} {scaleMax} {mapConfig} />
			{/if}
		{/if}

		{#if mapConfig.legendAvailable && mapConfig.parsedData && mapConfig.parsedData.length > 0}
			<Legend color={mapConfig.legend1Color} label={mapConfig.legend1} />
		{/if}

		<svg
			preserveAspectRatio="xMidYMid meet"
			viewBox="0 0 {width} {height}"
			style="
        max-height: calc(100vh - var(--text-height));
        width: 100%;
    "
		>
			<!-- graticules (lines) -->
			{#if graticules?.features}
				{#each graticules.features as feature}
					<path d={path(feature)} stroke="#cfcfcf" fill="transparent" class="noPointer" />
				{/each}
			{/if}

			<!-- countriesAll -->
			{#each countriesAll.features as feature}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<path
					d={path(feature)}
					stroke={getStroke(feature)}
					fill={getFill(feature)}
					class={getClass(feature)}
					on:mouseenter={() => handleMouseEnter(feature)}
					on:mouseleave={() => handleMouseLeave(feature)}
					on:click={() => handleMouseClick(feature)}
				/>
			{/each}

			<!-- countriesWithExtraInfo -->
			{#if countriesWithExtraInfo?.features}
				{#each countriesWithExtraInfo.features as feature}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<path
						d={path(feature)}
						stroke={getStroke(feature)}
						fill={getFill(feature)}
						class={mapConfig.datasetType == 'values'
							? 'country-extra-info-values'
							: 'country-extra-info-binary'}
						on:mouseenter={() => handleMouseEnter(feature)}
						on:mouseleave={() => handleMouseLeave(feature)}
						on:click={() => handleMouseClick(feature)}
						on:touchstart={() => handleTouchStart(feature)}
					/>
				{/each}
			{/if}
		</svg>

		<CountryInfo
			selectedCountry={$selectedCountry}
			countryName={selectedCountryNameTranslated}
			countryText={selectedCountryExtraInfoTextTranslated}
			countryLink={selectedCountryExtraInfoLinkTranslated}
			{tooltip}
			{mapConfig}
		/>

		<!-- Tooltip -->
		<div
			class="tooltip p-3 text-sm {tooltipVisible ? 'active' : ''}"
			style="top: {$MOUSE.y - tooltipHeight}px; left:{tooltipPositionX}px;"
			bind:clientHeight={tooltipHeight}
			bind:clientWidth={tooltipWidth}
		>
			<div class="tooltip-head font-bold">{$MOUSE.tooltip.name}</div>
			<div class="tooltip-body space-y-1">
				{#if mapConfig.datasetType == 'values'}
					<div class="values">
						{#if mapConfig.datasetUnit == 'percent'}
							{#if mapConfig.percentRounded == true}
								<span class="font-bold">{formatInt($MOUSE.tooltip.value * 100)}%</span>
							{:else if mapConfig.percentRounded == false}
								<span class="font-bold">{Math.round($MOUSE.tooltip.value * 1000) / 10}%</span>
							{/if}
						{:else if mapConfig.datasetUnit == 'fullNumbers'}
							<span class="font-bold">{$MOUSE.tooltip.value}</span>
						{/if}
						{#if mapConfig.customUnitLabelAvailable && mapConfig.customUnitLabel !== ''}
							<span>{mapConfig.customUnitLabel}</span>
						{/if}
					</div>
				{/if}
				{#if $MOUSE.tooltip.extraInfo == true}
					<div class="text-xs"><span class="icon-tap" />{mapConfig.tooltipExtraInfoLabel}</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	#map {
		position: relative;
	}

	svg {
		width: 100%;
		height: auto;
	}

	svg path {
		stroke-width: 0.5px;
		cursor: pointer;
		stroke-linecap: round;
	}

	.country-extra-info-values {
		/* stroke-width: 1px; */
		stroke: black;
	}

	.country-extra-info-values:hover {
		stroke-width: 1px;
	}

	.country-extra-info-binary {
		stroke: green;
	}

	.noPointer {
		pointer-events: none;
	}

	.pointer {
		pointer-events: all;
	}

	.tooltip {
		text-align: left;
		position: absolute;
		pointer-events: none;
		display: none;
		background: white;
		border-radius: 3px;
		z-index: 0;
		box-shadow: 0 10px 20px 0 rgba(185, 185, 185, 0.25);
	}

	.tooltip-head {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e2e2;
	}

	.tooltip-body {
		padding-top: 0.5rem;
	}

	.active {
		display: block;
	}
</style>
