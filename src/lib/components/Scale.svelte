<script>
	import { formatInt } from '$lib/utils/formatNumbers';

	let width;

	export let classes;
	export let clusters;

	export let scaleMin;
	export let scaleMax;

	export let mapConfig;

	// Add the static values from the mapConfig if available
	$: colorBarFirstValue = mapConfig.overrideScaleValues ? mapConfig.colorBarFirstValue : scaleMin;
	$: colorBarLastValue = mapConfig.overrideScaleValues ? mapConfig.colorBarLastValue : scaleMax;

	// Force 'fullNumbers' if either colorBarFirstValue or colorBarLastValue exists
	// if (colorBarFirstValue !== scaleMin || colorBarLastValue !== scaleMax) {
	// 	mapConfig.datasetUnit = 'fullNumbers';
	// }

	function displayDigit(index) {
		if (index === 0)
			return mapConfig.datasetUnit === 'percent'
				? formatInt(colorBarFirstValue * 100)
				: colorBarFirstValue;
		if (index === classes.length - 1)
			return mapConfig.datasetUnit === 'percent'
				? formatInt(colorBarLastValue * 100)
				: colorBarLastValue;
		return '';
	}

	// $: swatchWidth =
	// 	config.colourSchemeClasses > 9 ? '8vw' : config.colourSchemeClasses > 6 ? '10vw' : '13vw';
	$: swatchWidth = '5vw';
</script>

<div
	class="scale absolute top-3 rounded border bg-white p-3 text-sm"
	bind:clientWidth={width}
	style={`left: calc(50% - ${width / 2}px);`}
>
	<div class="flex justify-center">
		{#each classes as swatch}
			<div class="swatch" style="background: {swatch}; width: {swatchWidth}" />
		{/each}
	</div>
	<div class="flex justify-between">
		{#each classes as _, index}
			<div class="swatch text-xs">
				{displayDigit(index)}
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.swatch {
		height: 1.2vh;
	}

	.swatch:first-of-type {
		border-top-left-radius: 5px;
		border-bottom-left-radius: 5px;
	}

	.swatch:last-of-type {
		border-top-right-radius: 5px;
		border-bottom-right-radius: 5px;
	}
</style>
