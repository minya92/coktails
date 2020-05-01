export const sizes = {
    'long': {
        name: 'Лонг-дринк',
        value: 'long',
    }, 
    'short': {
        name: 'Шот',
        value: 'short',
    }, 
    'decanter': {
        name: 'Графин',
        value: 'decanter',
    }
};

export const ingridients = {
    whiskey: 'Виски',
    vodka: 'Водка',
    white_rum: 'Белый Ром',
    black_rum: 'Темный Ром',
    tequila_silver: 'Светлая текила',
    champagne: 'Шампанское',
    gin: 'Джин',

    tripple_seq: 'Аплельсиновый ликер',
    bols_strawbery: 'Клубничный ликер',
    baylis: 'Сливочный ликер',
    blue_curasao: 'Блю курасао',
    coffee_liquer: 'Кофейный ликер',
    peach_liquer: 'персиковый ликер',
    limonchello: 'Лимончелло',
    
    coconut_syroup: 'Кокосовый сироп',

    cola: 'Кола',
    cream: 'Сливки',
    pineapple_juice: 'Ананасовый сок',

    pinapple: 'Анананас',
    cherry: 'Виишня'
}

export const ingridients_structure = {
    alcohol: {
        name: 'Алкоголь',
        values: [
            'whiskey',
        ]
    },
    liquers: {
        name: 'Ликеры',
        values: [
            
        ]
    },
    syrups: {
        name: 'Сиропы',
        values: [

        ],
    },
    juicies: {
        name: 'Соки',
        values: [
            
        ]
    },
    soft_drinks: {
        name: 'Безалкогольные напитки',
        values: [

        ],
    },
    fruits: {
        name: 'Фрукты, ягоды',
        values: [

        ],
    },
    other: {
        name: 'Прочее',
        values: [

        ],
    }
}

export const db = [
    {
        name: 'Виски-кола',
        id: 1,
        value: 'whiskey_cola',
        size: sizes.long,
        composition: [
            {whiskey: '50'},
            {cola: '150'},
        ],
        vol: '200',
        alc: null, //number
        reciept: `1. Наливаем в бокал ингредиенты
        2. Аккуратно перемешиваем`,
        comment: '',
        img: '',
    },
    {
        name: 'Пина-Колада',
        id: 2,
        value: 'pina_colada',
        size: sizes.long,
        composition: [
            {white_rum: '40'},
            {coconut_syroup: '10'},
            {pineapple_juice: '90'},
            {pinapple: '1 долька'},
            {cherry: '1шт'},
        ],
        vol: '170',
        alc: null, //number
        reciept: `1. Насыпать кубики льда в шейкер
        2. Добавить ром, кокосовый сироп, ананасовый сок и сливки
        3. Взбить
        4. Процедить в бокал харрикейн (400мл)
        5. Украсить ананасом, трубочкой и коктейльной вишней`,
        comment: '',
        img: '',
    }
]