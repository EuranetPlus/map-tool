<!-- src/lib/components/FormField.svelte -->
<script>
	export let value = '';
	export let label = '';
	export let placeholder = '';
	export let component = 'input';
	export let type = 'text';
	export let min = undefined;
	export let max = undefined;
	export let rows = undefined;
	export let checked = false;
	export let disabled = false;
</script>

<div class="space-y-2">
	{#if component === 'textarea'}
		<label for={label}>{label}</label>
		<textarea
			id={label}
			bind:value
			class="w-full rounded border p-2"
			{placeholder}
			{rows}
			{disabled}
		/>
	{:else if component === 'select'}
		<label for={label}>{label}</label>
		<select id={label} bind:value class="w-full rounded border p-2" {disabled}>
			<slot />
		</select>
	{:else if type === 'checkbox'}
		<label class="flex items-center">
			<input type="checkbox" bind:checked class="mr-2" />
			{label}
		</label>
	{:else}
		<label for={label}>{label}</label>
		<input
			{type}
			id={label}
			{placeholder}
			class="w-full rounded border p-2"
			bind:value
			{min}
			{max}
			{disabled}
		/>
	{/if}
</div>
