
import express, { Response } from 'express';

const app = express()
const port = 3000

type BuildingInfo = { 
    name: string;
    locked: boolean;
    quantity: number;
    baseprice: number;
    currentprice: number;
    production: number;
}

let buildings: { [key: string]: BuildingInfo} = {
    collector: {
        name: 'collector',
        locked: false,
        quantity: 0,

        baseprice: 50,
        currentprice: 50,
        production: 1
    },
    farmer: {
        name: 'farmer',
        locked: false,
        quantity: 0,
        baseprice: 300,
        currentprice: 300,
        production: 7
    },
    merchant: {
        name: 'merchant',
        locked: false,
        quantity: 0,
        baseprice: 1000,
        currentprice: 1000,
        production: 23
    },
}

let sugarCane = 0;
let money = 0;
let sugarCanePrice = 1;
let totalProduction = 0;
let refreshRate = 2
let multiplier = 1.2;

function update_production() {
    let production = 0
    for (const i in buildings) {
        production += buildings[i].quantity * buildings[i].production;
    }
    totalProduction = production;
    production *= refreshRate;
    sugarCane += production;
}
setInterval(update_production, refreshRate * 1000);

function ieee_eu_te_odeio(number: number): number{
    return Number(number.toFixed(2))
}

app.post('/init', (req, res) => {
    console.log('/init');
    req = req;
    if (sugarCane == 0 && money == 0 && totalProduction == 0) {
        sugarCane = 50;
        res.status(200).json({status: 'sucesso', message: '+50 cana de açúcar!'});
    }
    else {
        res.status(400).json({
            status: 'falha',
            message: 'jogo já iniciado',
        })
    }
});
app.post('/reset', (req, res) => {
    console.log('/reset');
    req = req;
    sugarCane = 0;
    money = 0;
    totalProduction = 0;

    for (const i in buildings) {
        buildings[i].currentprice = buildings[i].baseprice;
        buildings[i].quantity = 0;
    }

    res.status(200).json({status: 'sucesso', message: 'reset'});
});
app.get('/init', (req, res) => {
    console.log('init');
    req = req;
    res.status(400);
    res.send('Oops! pelo visto você fez um GET request! tente fazer um POST request ao invés');
});
app.get('/status', (req, res) => {
    console.log('/status');
    req = req;
    res.json({
        'sugarcane': sugarCane,
        'money': money,
        'production': totalProduction,
    });
});

function buy_building(res: Response, buildingName: string, quantity: number) {
    let building = buildings[buildingName];

    if (!building) {
        res.status(400).json({
            status: 'falha',
            message: 'construção não existe',
        });
        throw new Error();
    }

    if (building.locked) {
        res.status(400).json({
            status: 'falha',
            message: 'construção não disponível',
        });
        throw new Error();
    }
    let cost = 0;
    let currentPrice = building.currentprice;

    for (let i = 0; i < quantity; i++) {
        cost += currentPrice;
        currentPrice = ieee_eu_te_odeio(currentPrice * multiplier);
    }

    if (quantity <= 0) {
        res.status(400).json({
            status: 'falha',
            message: '0 ou menos de quantidade',
        });
        throw new Error();
    }

    if (cost > money) {
        res.status(400).json({
            status: 'falha',
            cost: cost,
            money: money,
            message: 'dinheiro insuficiente',
        });
        throw new Error();
    }

    building.quantity += quantity;
    building.currentprice = currentPrice;
    money = ieee_eu_te_odeio(money - cost)
    return cost;
}

app.get('/buildings', (req, res) => {
    console.log('/buildings');
    let { buy, qnt } = req.query as { [key: string]: string | string[] };

    if (!buy) {
        res.json(buildings);
        return
    }

    if (typeof buy == 'string') {
        buy = [buy];
    }

    let quantity: number[] = [];
    if (!qnt) {
        quantity = [1];
    }
    else if (typeof qnt == 'string') {
        quantity = [Number(qnt)];
    }
    else {
        quantity = qnt.map(Number);
    }
    try {
        let cost = 0;
        for (let i in buy){
            cost += buy_building(res, buy[i], quantity[i]);
        }
        res.json({
            status: 'sucesso',
            quantity: quantity,
            cost: cost,
            message: 'sucesso',
        });
    }
    catch (e) {
        // console.error(e);
        return
    }
});

app.get('/sell', (req, res) => {
    console.log('/sell');
    let { qnt } = req.query as { [key: string]: string };

    if (!qnt) {
        res.status(200).json({ sugarcaneprice: sugarCanePrice });
        return
    }

    let quantity = Number(qnt);

    if (quantity > sugarCane || quantity < 0) {
        res.status(400).json({
            status: 'falha',
            quantity: quantity,
            message: 'quantidade invalida',
        });
        return
    }

    sugarCane -= quantity;
    let profit = ieee_eu_te_odeio(sugarCanePrice * quantity);
    console.log(profit);
    money = ieee_eu_te_odeio(money + profit);

    res.json({
        status: 'sucesso',
        profit: profit,
        quantity: quantity,
        message: 'sucesso'
    });
});

app.use('/', express.static('../pages/'));

app.use('*', function(req, res){
    req = req;
    res.status(404).send('404 😔');
});

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})
