<script>
	import { onMount } from 'svelte';
	import { geoPath, geoIdentity } from 'd3-geo';
	import { feature } from 'topojson-client';

	export let legend;
	export let tooltip;
	export let extraInfoTexts;
	export let extraInfoLinks;

	let mapData;
	let hoveredCountry = null;
	let mouseX = 0;
	let mouseY = 0;

	const width = 600;
	const height = 600;
	const padding = -85; // Similar to your original component

	// Set up the projection
	const projection = geoIdentity().reflectY(true);
	const path = geoPath().projection(projection);

	async function fetchGeoData() {
		try {
			const response = await fetch('/data/geodata/europe-20m.json');
			const data = await response.json();
			mapData = feature(data, data.objects.cntrg);

			// Set up projection after data is loaded
			projection.fitExtent(
				[
					[padding, padding],
					[width - padding, height - padding]
				],
				mapData
			);
		} catch (error) {
			console.error('Error loading map data:', error);
		}
	}

	function handleMouseMove(event) {
		const rect = event.currentTarget.getBoundingClientRect();
		mouseX = event.clientX - rect.left;
		mouseY = event.clientY - rect.top;
	}

	function handleMouseEnter(country) {
		hoveredCountry = {
			name: country.properties.name,
			value: country.properties.value
		};
	}

	function handleMouseLeave() {
		hoveredCountry = null;
	}

	onMount(fetchGeoData);
</script>

<div id="map" class="relative h-full w-full" on:mousemove={handleMouseMove}>
	<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 {width} {height}" class="h-full w-full">
		{#if mapData}
			{#each mapData.features as feature}
				<path
					d={path(feature)}
					class="cursor-pointer stroke-gray-300 hover:stroke-gray-500"
					fill="#F4F4F4"
					stroke-width="0.5"
					on:mouseenter={() => handleMouseEnter(feature)}
					on:mouseleave={handleMouseLeave}
				/>
			{/each}
		{/if}
	</svg>

	{#if hoveredCountry}
		<div
			class="pointer-events-none absolute rounded bg-white p-2 text-sm shadow-lg"
			style="left: {mouseX}px; top: {mouseY}px;"
		>
			<div class="font-bold">{hoveredCountry.name}</div>
			{#if hoveredCountry.value}
				<div>{hoveredCountry.value}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	#map {
		position: relative;
		width: 100%;
		height: 100%;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	path {
		transition: stroke 0.2s;
	}
</style>
