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
	margin: 8px 0;
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
.filters {
	margin-left: 16px;
	width: 100%;
}
.input {
	width: 100%;
    margin-top: 12px;
    padding: 10px;
    border-radius: 16px;
	margin-bottom: 0;
}
.checkbox {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
}
.checkbox label {
	margin-left: 8px;
}
.checkbox input {
	margin-left: 8px;
	margin-bottom: 0;
}
</style>

<script>
	import {db, ingridients, ingridients_structure} from '../db.js'
	const typesArray = Object.keys(ingridients_structure).map(key => ({...ingridients_structure[key], type: key}));
	const typesFlags = {};
	Object.keys(ingridients_structure).forEach(key => typesFlags[key] = false);
	let isOpenSearch = false;
	let isOpenContains = false;
	const toggleType = (type) => () => {
		typesFlags[type] = !typesFlags[type];
	}
	function openSeacrh(){
		isOpenSearch = !isOpenSearch;
	}
	function openContains(){
		isOpenContains = !isOpenContains;
	}
</script>

<div class="container">
	<div>
		<a href="javascript:" on:click={openSeacrh}>Поиск {isOpenSearch ? '↓' : '→' }</a>
		{#if isOpenSearch === true}
			<div class="filters">
				<input name="name" class='input' placeholder="Поиск по названию"/>
				<p><a href="javascript:" on:click={openContains}>Поиск по составу {isOpenContains ? '↓' : '→' }</a></p>
				{#if isOpenContains === true}
					<div class="filters">
						{#each typesArray as type}
							<p><a href="javascript:" on:click={toggleType(type.type)}>{type.name} {typesFlags[type.type] ? '↓' : '→' }</a></p>
							{#if typesFlags[type.type] === true}
								<div class="filters">
									{#each ingridients_structure[type.type].values as name}
										<div class="checkbox">
											<input type="checkbox" id="{name}"/>
											<label for="{name}">{ingridients[name]}</label>
										</div>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
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