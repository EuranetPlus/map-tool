<script>
	// Props
	export let selectedCountry;
	export let countryLink;
	export let mapConfig;

	$: console.log('countryLink', countryLink);

	// Computed values
	$: countryID = selectedCountry.properties.id;
	$: countryText = mapConfig.translate[`extraInfo_${countryID}`];
	$: audioPieces = Object.entries(selectedCountry.csvImport).filter(([key]) =>
		key.includes('audioURL')
	);
	$: hasNoAudio = audioPieces.every(([_, value]) => value === '');
	$: hasImage = selectedCountry.csvImport.imageSourceURL;
	$: hasVideo = selectedCountry.csvImport.videoURL;
</script>

<!-- Text Content -->
{#if countryText}
	<div class="pt-5">
		<p>{countryText}</p>
		{#if countryLink}
			<a
				class="link-text font-bold"
				target="_blank"
				href={selectedCountry.csvImport.linkURL}
				rel="noopener noreferrer"
			>
				{countryLink} …
			</a>
		{/if}
	</div>
{/if}

<!-- Audio Content -->
{#if !hasNoAudio}
	<div class="pt-5">
		{#each audioPieces as [_, url]}
			{#if url}
				<!-- svelte-ignore element_invalid_self_closing_tag -->
				<iframe
					class="pb-2"
					style="border-radius:5px"
					src={url}
					width="100%"
					height="160"
					title="Audio content"
					frameborder="0"
					allowfullscreen
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
				/>
			{/if}
		{/each}
	</div>
{/if}

<!-- Image Content -->
{#if hasImage}
	<div class="pt-5">
		<a href={selectedCountry.csvImport.imageTargetURL} target="_blank" rel="noopener noreferrer">
			<img src={selectedCountry.csvImport.imageSourceURL} alt="Country information" />
		</a>
	</div>
{/if}

<!-- Video Content -->
{#if hasVideo}
	<div class="pt-5">
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<iframe
			width="100%"
			height="400"
			src={selectedCountry.csvImport.videoURL}
			title="Video content"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		/>
	</div>
{/if}

<style>
	.link-text {
		@apply transition-all;
	}

	.link-text:hover {
		color: #51a665;
	}
</style>
