<style>
.container {
	max-width: 600px;
	min-width: 300px;
	height: 100%;
	margin: auto;
	padding: 8px;
}
.cocktails {
	width: 100%;
	/* border: 1px solid #aaa; */
	display: flex;
	flex-direction: column;
}
.item {
	display: flex;
	margin: 8px;
	flex-wrap: wrap;
	justify-content: space-between;
}
.img {
    width: 40%;
    height: 180px;
    background-size: contain;
    background-position: right top;
    background-repeat: no-repeat;
}
.item_info {
	max-width: 59%;
}
</style>

<script>
	import {db, ingridients} from '../db.js'
	
</script>

<div class="container">
	<div class="cocktails">
		{#each db as cocktail, i}
			<div class="item">
				<div class="item_info">
					<p><b>{cocktail.name}</b></p>
					<p>№ <b>{cocktail.id}</b> ({cocktail.vol} мл)</p>
					<p>
						{#each cocktail.composition as c, j}
							<span>{ingridients[Object.keys(c)[0]]}{j !== cocktail.composition.length - 1 ? ', ' : ''}</span>
						{/each}
					</p>
				</div>
				<div class="img" style="background-image: url({cocktail.img ? cocktail.img : '/img/' + cocktail.value + '.jpg'})"/>
			</div>
		{/each}
	</div>

</div>