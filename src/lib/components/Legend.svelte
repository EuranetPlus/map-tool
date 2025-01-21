<script>
	export let color;
	export let label;
</script>

<div class="legend absolute bottom-3 right-3 rounded border bg-white p-2 text-sm">
	<div>
		<span class="dot mr-2 inline-block rounded-full" style="background-color: {color}" />{label}
	</div>
</div>

<style>
	.dot {
		height: 10px;
		width: 10px;
		border: 1px solid #cdcdcd;
	}
</style>
