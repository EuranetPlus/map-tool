<script>
	import { fly } from 'svelte/transition';
	import { countryInfoVisible, MOUSE, APP_HEIGHT } from '$lib/stores/shared';
	import CountryMediaComponent from './CountryMediaComponent.svelte';
	import { formatOneDecimal } from '$lib/utils/formatNumbers';

	// Props
	export let selectedCountry;
	export let countryName;
	export let countryLink;
	export let mapConfig;

	// Local state
	const ANIMATION_DURATION = 1000;

	// Computed values
	$: countryValue = selectedCountry && calculateCountryValue(selectedCountry, mapConfig);
	$: countryUnit = mapConfig.datasetUnit === 'percent' ? '%' : '';

	// Helper functions
	function calculateCountryValue(country, config) {
		if (!country) return null;

		const value = country.csvImport.value;
		return config.datasetUnit === 'percent' ? formatOneDecimal(value * 100) : value;
	}

	function handleClose() {
		$countryInfoVisible = false;
	}
</script>

{#if $countryInfoVisible}
	<div
		class="country-info"
		in:fly={{ y: $APP_HEIGHT / 2, duration: ANIMATION_DURATION, opacity: 1 }}
		out:fly={{ y: $APP_HEIGHT / 2, duration: ANIMATION_DURATION / 3, opacity: 1 }}
	>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div
			class="icon-close"
			on:click={handleClose}
			on:keydown={(e) => e.key === 'Enter' && handleClose()}
			role="button"
			tabindex="0"
		/>

		<div class="country-header">
			<span class="font-bold">{countryName}</span>
			{#if mapConfig.datasetType === 'values' && $MOUSE.tooltip.value}
				<span>–</span>
				<span class="font-bold">{countryValue}{countryUnit}</span>
			{/if}
		</div>

		<CountryMediaComponent {selectedCountry} {countryLink} {mapConfig} />
	</div>
{/if}

<style>
	.country-info {
		@apply absolute overflow-auto rounded border bg-white p-5 text-sm shadow-xl;
		width: 100%;
		max-height: 50%;
		z-index: 1;
		bottom: 0;
	}

	.country-header {
		@apply border-b pb-2;
	}

	.icon-close {
		@apply static cursor-pointer text-right;
		transition: all 0.2s;
	}

	.icon-close:hover {
		color: #51a665;
	}
</style>
